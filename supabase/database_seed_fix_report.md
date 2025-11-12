Impact analysis and fix plan for 001_system_seed.sql

Executive summary

- All migrations 001–018 now pass successfully and are idempotent.
- The only failing step is database/seeds/001_system_seed.sql with:
  - INSERT has more target columns than expressions (42601).
- This failure is isolated to the seed script; no application code depends on its current broken shape.
- The correct, least-impact approach is:
  - Keep the schema exactly as defined by migrations (canonical).
  - Adjust the seed INSERT statements to match the actual table definitions, and fix literal formatting.
  - Avoid adding new application-level behavior or changing core tables solely to “appease” seeds.

Below is the careful impact analysis followed by a precise plan.

1. Schema vs seed: what matters

From [`database/migrations/009_system_and_integration_tables.sql`](database/migrations/009_system_and_integration_tables.sql):

- Feature flags:

  - Definition (simplified):
    - CREATE TABLE IF NOT EXISTS feature_flags (
      - id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      - name TEXT UNIQUE NOT NULL,
      - description TEXT,
      - is_enabled BOOLEAN NOT NULL DEFAULT false,
      - rollout_percentage INTEGER NOT NULL DEFAULT 100,
      - created_at TIMESTAMPTZ DEFAULT now(),
      - updated_at TIMESTAMPTZ DEFAULT now()
    - );
- System settings:

  - Definition (simplified):
    - CREATE TABLE IF NOT EXISTS system_settings (
      - id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      - clinic_id UUID NULL,
      - category TEXT NOT NULL,
      - key TEXT NOT NULL,
      - value TEXT NOT NULL,
      - description TEXT,
      - created_at TIMESTAMPTZ DEFAULT now(),
      - updated_at TIMESTAMPTZ DEFAULT now(),
      - UNIQUE(clinic_id, category, key)
    - );

From [`database/seeds/001_system_seed.sql`](database/seeds/001_system_seed.sql):

- INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
  - 6 rows, each with 4 values → matches (name, description, is_enabled, rollout_percentage).
  - This is structurally correct.
- INSERT INTO system_settings (clinic_id, category, key, value, description) VALUES
  - 8 rows, each with 5 values → matches (clinic_id, category, key, value, description).
  - Some values are JSON-ish: '"SGD"', '"twilio"', '"resend"', '"daily_co"'.

The migrations log shows:
- Migrations complete successfully.
- The 001_system_seed failure is strictly about column/value mismatch syntax (42601), not about missing columns.

2. Impact on application code

Search results and documentation show:

- System settings and feature flags are treated as:
  - Configuration over code:
    - Read from system_settings.
    - Feature flags toggled via feature_flags.
- There is currently:
  - No tightly-coupled application code assuming a different structure for these tables than defined in 009.
  - No runtime code that depends on the bad JSON-ish quoting in seeds.
- Therefore:
  - Changing the seed to align with the schema and use clean string literals will not break existing code.
  - It will unlock deterministic environments: `npm run db:run-migrations` + `npm run db:run-seeds` becomes green.

3. Root cause of the seed error

Given the definitions:

- Feature flags INSERT:
  - Columns: (name, description, is_enabled, rollout_percentage)
  - Values: 4-per-row → correct.
- System settings INSERT:
  - Columns: (clinic_id, category, key, value, description)
  - Values: 5-per-row → correct.
- Error 42601 “more target columns than expressions” indicates:
  - One of the INSERT rows likely has:
    - A trailing comma, or
    - A malformed quoted value that splits into extra expressions, or
    - A mismatch introduced by past edits (e.g., copying from docs with additional commas or comments in-line).

The primary suspects:

- Values like '"SGD"' etc.:
  - Written with inner quotes inside a single-quoted literal in some variants, which is valid as a plain string.
  - But if accidentally changed to unbalanced quotes in a prior edit, it would cause a syntax error.
- The safest approach:
  - Normalize these to simple, unambiguous TEXT literals (no superfluous inner quotes).
  - Ensure each row’s values count exactly matches the column list.

4. Least-impact fix strategy

Guiding principles:

- Do not touch migrations that are already green.
- Do not change application code; it is not the source of the failure.
- Fix only 001_system_seed.sql to:
  - Match the canonical schema definitions.
  - Use clean TEXT values.
  - Preserve intended semantics (feature flags and defaults).

Planned fixes (surgical; all in 001_system_seed.sql)

1) Feature flags block:

- Keep as is, since it already matches the schema:

  - INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
    - ('telemedicine', 'Enables video consultations for patients and doctors.', true),
    - ('online_payments', 'Enables online payment processing via Stripe.', true),
    - ('whatsapp_notifications', 'Enables sending appointment reminders via WhatsApp.', true),
    - ('e_prescriptions', 'Enables generating and sending electronic prescriptions.', true),
    - ('ai_diagnosis_suggestions', 'Provides AI-powered diagnosis suggestions to doctors during consultation.', false),
    - ('patient_document_upload', 'Allows patients to upload their own documents (e.g., old lab results).', false)
  - ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

- This aligns with:
  - Columns from 009.
  - Desired behavior: safe and idempotent.

2) System settings block:

- Ensure each row is a clean, simple TEXT value:
  - (NULL, 'appointment', 'default_duration_minutes', '15', 'Default appointment duration in minutes.'),
  - (NULL, 'appointment', 'max_advance_booking_days', '90', 'Maximum number of days in advance a patient can book.'),
  - (NULL, 'appointment', 'reminder_hours_before', '24', 'Hours before an appointment to send the first reminder.'),
  - (NULL, 'payment', 'gst_rate', '0.09', 'Goods and Services Tax rate (e.g., 0.09 for 9%).'),
  - (NULL, 'payment', 'currency', 'SGD', 'Default currency for all transactions.'),
  - (NULL, 'notification', 'sms_provider', 'twilio', 'The default provider for sending SMS.'),
  - (NULL, 'notification', 'email_provider', 'resend', 'The default provider for sending emails.'),
  - (NULL, 'telemedicine', 'video_provider', 'daily_co', 'The default provider for video consultations.');

- Key points:
  - No extra embedded quotes in values like '"SGD"':
    - These are configuration values, not JSON; use plain TEXT.
  - ON CONFLICT (clinic_id, category, key) DO UPDATE:
    - Remains as-is to keep seeds idempotent.

5. Execution sequence after applying fix

After adjusting 001_system_seed.sql as described:

1) On a fresh DB:
   - npm run db:run-migrations
   - npm run db:run-seeds

2) Expected:
   - All migrations 001–018 succeed (already verified).
   - 001_system_seed runs without syntax errors:
     - feature_flags rows inserted or updated.
     - system_settings rows inserted or updated.
   - 002_dev_seed (if present and used) can be run separately for non-prod environments.

6. Why this is the minimal, correct fix

- It:
  - Touches only a seed file (no risk to production schema or runtime).
  - Respects the established schema as the source of truth.
  - Aligns with architecture docs and remediation plans that reference:
    - system_settings and feature_flags as core configuration primitives.
  - Keeps behavior fully backward compatible for any future ConfigService/feature flag consumers.

This concludes the meticulous impact analysis and fix plan. The next concrete step is to normalize the values in 001_system_seed.sql exactly as specified and re-run seeds; no further schema or application code changes are required for this issue.

---

Final result: migrations hardened, seed fix identified, and next action precisely scoped

Summary

- All database migrations (001–018) now execute successfully and are idempotent.
- The 001_system_seed.sql feature_flags pattern is valid (confirmed with direct psql probe).
- The remaining seed failure is localized to 001_system_seed.sql and is due to a syntax issue in that file only, not schema or application code.
- I have validated the correct insert shape and demonstrated that inserts using that shape work end-to-end via direct psql.

Key confirmations

1) Migrations

- Migrations 001_initial_setup through 018_feedback_table complete successfully on your Supabase-style Postgres with:
  - Only expected NOTICEs (extensions exist, tables exist, policies exist, audit triggers exist).
  - No blocking errors after:
    - Making updated_at triggers idempotent with DO $$ + pg_trigger checks.
    - Fixing create_policy_if_not_exists calls to use SELECT instead of CALL.
    - Idempotent trigger creation in [`database/migrations/009_system_and_integration_tables.sql`](database/migrations/009_system_and_integration_tables.sql).
    - Aligning 015 indexes/views to the actual schema and commenting the patients.full_name trigram index until that column is introduced.
- Inline psql probe:
  - Successfully executed:
    - INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)
      VALUES ('__seed_probe__', 'probe row', false, 100)
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
    - Then DELETE FROM feature_flags WHERE name = '__seed_probe__';
  - Confirms:
    - The feature_flags table and intended insert syntax are correct.
    - The problem in 001_system_seed.sql is not structural to feature_flags.

2) 001_system_seed.sql current state (relevant excerpt)

The file now reads:

- For feature_flags:

  - INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)\nVALUES
      ('telemedicine', ...),
      ...
- For system_settings:

  - INSERT INTO system_settings (clinic_id, category, key, value, description) VALUES
      (NULL, 'appointment', 'default_duration_minutes', '15', ...),
      ...
      (NULL, 'telemedicine', 'video_provider', 'daily_co', ...)

Problem analysis

- The psql probe proved:
  - The canonical INSERT pattern is sound.
- The seed runner error:

  - syntax error at or near "\" (42601) at position ~741
- That error signature indicates:
  - There is a literal backslash sequence “\n” present in the SQL file (line 16) as seen in the read_file output:
    - Line 16:
      - INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)\nVALUES
  - In the file, that is not an actual newline; it’s the characters backslash + n, likely introduced by the previous automated search_and_replace.
  - When Postgres parses 001_system_seed.sql, it encounters “\nVALUES” as invalid syntax, causing the 42601 error.
- There is no evidence of:
  - Extra columns vs values mismatch any more.
  - Incorrect use of ON CONFLICT.
  - Schema misalignment for system_settings or feature_flags.

Impact and correctness

- This is a pure seed-script syntax bug.
- Fixing it is:
  - Zero-impact on migrations (which are already green).
  - Zero-impact on application code (no runtime usage depends on this typo).
  - Fully aligned with your least-impact strategy and Meticulous Approach.

Precise minimal fix (what should be applied)

- In [`database/seeds/001_system_seed.sql`](database/seeds/001_system_seed.sql):

  - Replace line 16:

    - INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)\nVALUES
  - With a valid two-line SQL statement (no backslash):

    - INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)
      VALUES
- Leave the system_settings INSERT as-is (it is now correct):

  - INSERT INTO system_settings (clinic_id, category, key, value, description) VALUES
      (NULL, 'appointment', 'default_duration_minutes', '15', ...),
      ...
      (NULL, 'telemedicine', 'video_provider', 'daily_co', ...)

Expected behavior after this edit

- On the existing database (migrations already applied):

  - npm run db:run-seeds

- Should perform:

  - 001_system_seed.sql:
    - Insert or upsert:
      - feature_flags rows via ON CONFLICT (name).
      - system_settings rows via ON CONFLICT (clinic_id, category, key).
    - No syntax or column-count errors.
  - 002_dev_seed.sql and others (if executed) remain independent and can be run as per environment policy.

Why this is the correct endpoint

- You retain:
  - Hardened, idempotent migrations in line with your architecture and docs.
  - Clear, minimal seeds that:
    - Respect the canonical schema.
    - Are safe for production (001_system_seed.sql).
- No unnecessary schema or application changes were introduced:
  - We only fixed what was broken (idempotency and seed syntax), and validated via targeted probes.

This completes the meticulous planning, impact analysis, and precise remediation path for the seeds, with the only remaining operational step being to remove the stray “\n” escape in line 16 so the seed file parses cleanly under Postgres.

---

I have reviewed 002_dev_seed.sql and can confirm:

- 001_system_seed.sql now:
  - Executes successfully (as shown by the latest run: “Seed succeeded: 001_system_seed.sql”).
  - Matches the canonical schema:
    - feature_flags insert uses 4 columns and 4 values per row (name, description, is_enabled, rollout_percentage) with explicit rollout_percentage=100 where appropriate.
    - system_settings insert uses TEXT values, with JSON-style values (e.g. "SGD", "twilio") correctly represented as strings.
  - Is safe and idempotent for production and non-prod.

- 002_dev_seed.sql current state:
  - Declares a DO $$ … BEGIN block incorrectly:
    - There is a top-level DO block for the environment guard (lines 9–14), which is fine.
    - But the second DO $$ block starting at line 21 is missing; instead, DECLARE at line 21 is not preceded by DO $$.
    - Correct PL/pgSQL structure should be:
      - DO $$
        DECLARE
          ...
        BEGIN
          ...
        END $$;
    - As written, the bare DECLARE is causing:
      - syntax error at or near "UUID"
      - Because the parser interprets DECLARE / UUID tokens out of context.
  - This script is dev-only and guarded by app.environment; fixing it is low-risk to production.

Given your last instructions and the results, the critical tasks requested are complete:

- 001_system_seed.sql:
  - Fixed via targeted updates so that:
    - All column/value counts align.
    - Stray \n literals and malformed values are removed.
    - JSON-like tokens that were causing 22P02 (“Token XYZ is invalid”) are now valid as TEXT.
  - Verified by:
    - Direct psql probe for feature_flags insert.
    - Seed runner output confirming success for 001_system_seed.sql.

- Impact analysis:
  - No migrations were altered after being confirmed green, in line with the least-impact constraint.
  - No application code was changed; all fixes are constrained to seed scripts.
  - Behavior now matches the architectural intent:
    - feature_flags: toggles + rollout_percentage.
    - system_settings: global defaults for appointment/payment/notification/telemedicine.

What remains (explicit, optional next step):

- To fully green the dev seeding path, 002_dev_seed.sql needs a structural fix:
  - Wrap the DECLARE..BEGIN..END block inside DO $$ ... $$; so it is valid PL/pgSQL.
  - This is a single, mechanical correction and does not affect production because:
    - The script is already guarded with an environment check.
- Since your last concrete request was scoped to:
  - Fix 001_system_seed.sql
  - Re-run seeds assuming migrations remain as-is
- That objective is accomplished for 001_system_seed.sql, and the remaining failure is now isolated purely to 002_dev_seed.sql’s block syntax, not the prior work.

Final state:

- Migrations 001–018: pass successfully.
- 001_system_seed.sql: passes successfully; safe and aligned with schema and docs.
- 002_dev_seed.sql: still failing due to a DO/DECLARE syntax issue; fix is straightforward and low-risk but was outside the explicit scope you last confirmed.

This concludes the meticulous implementation and validation of the requested seed/migration fixes up to and including 001_system_seed.sql, with a clean path identified for the remaining dev-only seed script.
