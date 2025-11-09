# Recent build troubleshooting — 2025-11-09

This file captures the immediate troubleshooting actions, findings, and recommended next steps taken during the Next.js production build failure triage on 2025-11-09.

## Executive summary

- Ran `npm run build` and reproduced build-time lint/type failures.
- Fixed several blocking issues in small, low-risk commits:
  1. Exported `t` from `lib/trpc/server.ts` so middlewares that import `{ t }` resolve correctly.
  2. Replaced `catch (e: any)` patterns with `catch (e: unknown)` + safe message extraction in several files to satisfy `@typescript-eslint/no-explicit-any`.
  3. Fixed `components/telemedicine/VideoCall.tsx` to use `import type` for `DailyCall` and to avoid `any` by adding a safe `extractErrorMessage` helper.
  4. Resolved a case-sensitive module collision by removing the duplicate `components/ui/Badge.tsx` (uppercase) and keeping the canonical `components/ui/badge.tsx` (lowercase). Also added a `success` variant to `badge.tsx` to match usages.
  5. Normalized `TodaySchedule.tsx` to import the lowercase `badge` module.

## Current failing symptom (after the above fixes)

- The production build now fails during the TypeScript check with the following error in `components/doctor/TodaySchedule.tsx`:

  Type error: Property 'users' does not exist on type '{ users: { full_name: any; }[]; }[].'

  The problematic line:

  ```tsx
  {appt.patients?.users?.full_name ?? "Patient Name Missing"}
  ```

  This indicates that `appt.patients` is an array of objects where each entry itself has a `users` array (or different shape) — so the code is wrongly assuming `appt.patients` is an object with `users` property.

## Root-cause analysis

- The Supabase `.select()` used to fetch appointment rows returns nested relations; depending on how the `.select()` call was written, `patients` may be returned as an array (e.g., `patients: [{ users: [...] }]`) rather than a single object. The code assumed `appt.patients?.users` was directly accessible, but TypeScript shows `appt.patients` is an array type (hence `.users` doesn't exist on the array type).
- This is a shape mismatch between the database response and the UI component's expectations. It is common when using Supabase/pgREST style `select` joins: nested relations default to arrays unless `single()` or `!inner`/`users!inner(...).single()` semantics are used.

## Minimal safe fixes (options)

I recommend one of these safe, minimal fixes (ordered by safety and scope):

1. Component guard (fastest, low-risk)
   - Change `TodaySchedule.tsx` to handle both array and object shapes. Example:

   ```tsx
   const patientName = Array.isArray(appt.patients)
     ? appt.patients[0]?.users?.[0]?.full_name
     : appt.patients?.users?.full_name;

   {patientName ?? 'Patient Name Missing'}
   ```

   - Pros: fastest to implement, local to UI, no backend changes.
   - Cons: duplicates normalization logic across components if multiple components rely on the same shape.

2. Server normalization (recommended longer-term)
   - Modify the tRPC router (or a repository layer) that returns appointment objects and normalize the patient/doctor nested shapes into a single `patient` object or explicit `patient_name` field.
   - Example: in the server, transform appointments before returning:

   ```ts
   const patient = Array.isArray(row.patients) ? row.patients[0]?.users?.[0] : row.patients?.users;
   return { ...row, patient_name: patient?.full_name ?? null };
   ```

   - Pros: single canonical shape for all consumers, easier to test, more maintainable.
   - Cons: requires backend change and tests; slightly larger scope.

3. Change DB query to return single relation
   - Adjust the Supabase select to ensure `patients` returns a single object instead of an array (use `.single()` or `users!inner(*)` patterns depending on schema).
   - Pros: fixes at source.
   - Cons: requires careful SQL or supabase select syntax changes and validation.

## Implementation plan (short-term)

Phase 1 (apply minimal component guard) — ~15–30 minutes

1. Update `components/doctor/TodaySchedule.tsx` to read the patient full_name safely handling array or object shapes.
2. Run `npm run build` locally to validate the error is resolved and gather remaining issues.

Phase 2 (medium-term, optional) — server normalization — ~1–3 hours

1. Identify the tRPC router or repository method that returns appointments used by the Doctor dashboard.
2. Normalize the returned appointment shape to include `patient_name` (string) and `clinic_id`/`patient_id` primitives where needed.
3. Update unit tests and components to use `appointment.patient_name`.

Phase 3 (cleanup) — lint and warnings

1. Replace any remaining `: any` patterns with `unknown` and safe extraction.
2. Convert type-only imports to `import type` across flagged files.
3. Prefix or remove unused variables or implement placeholders.

## Files changed in this troubleshooting session

- `lib/trpc/server.ts` — exported `t`
- `pages/api/cron/process-jobs.ts` — catch unknown
- `pages/api/health.ts` — catch unknown
- `pages/api/webhooks/stripe.ts` — catch unknown
- `lib/jobs/queue.ts` — catch unknown and message extraction
- `lib/trpc/routers/telemedicine.router.ts` — catch unknown
- `lib/trpc/routers/admin.router.ts` — changed to return `total` (compatibility)
- `pages/doctor/dashboard/index.tsx` — escaped apostrophes
- `components/doctor/TodaySchedule.tsx` — import path normalized to lowercase `badge` (not yet changed to guard patient shape)
- `components/ui/badge.tsx` — added `success` variant
- `components/telemedicine/VideoCall.tsx` — used `import type` and added `extractErrorMessage` helper

## Next action (I can implement immediately if you approve)

- Apply Phase 1: Add a short guard in `components/doctor/TodaySchedule.tsx` to safely extract patient name from `appt.patients` whether it's an array or object. Then run `npm run build` and report back the results.

If you approve, reply `Proceed` and I will apply the minimal component guard and run the build to capture subsequent failures.

---

Timestamp: 2025-11-09T00:00:00Z
