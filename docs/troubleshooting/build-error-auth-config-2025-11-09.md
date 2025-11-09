# Triage: Build failure from `src/server/auth/config.ts` — 2025-11-09

Summary

- Last `npm run build` failed during Next.js ESLint/type-check step.
- The blocking errors reported are two `@typescript-eslint/no-explicit-any` errors in `src/server/auth/config.ts` (callback binding elements annotated as `any`).
- The build output also shows many ESLint *warnings* (unused variables, type-only imports, anonymous default export) that should be addressed after the blocking error is fixed.

Attached error: `error.txt` (used as the source of truth for this triage).

Root cause hypothesis

- Earlier quick fixes introduced `any` in the NextAuth `session` callback to silence TypeScript errors and move forward. The project's ESLint config prohibits `any` and treats this as an error in production builds.
- The project's NextAuth type import we originally tried (`NextAuthConfig`) was not present in the installed version; we removed it and annotated callback args with `any` as a stopgap. The correct type name is almost always `NextAuthOptions` (or similar) for recent next-auth versions.

Acceptance criteria (success)

- Fix `src/server/auth/config.ts` so that ESLint no longer reports `Unexpected any` for the `session` callback.
- Re-run `npm run -s type-check` and `npm run -s lint` and have no errors (warnings may remain but the build should not fail for the `any` errors).
- Then iterate through remaining lint warnings and make minimal, reversible edits until `npm run build` succeeds.

Implementation plan (validated, stepwise, minimal-risk)

Batch A — Fix NextAuth typing (blocking / high priority)

1. Edit `src/server/auth/config.ts`:
   - Import the correct NextAuth options type from `next-auth`:

     ```ts
     import type { NextAuthOptions } from "next-auth";
     ```

   - Annotate the exported config with that type:

     ```ts
     export const authConfig: NextAuthOptions = {
       adapter: PrismaAdapter(db),
       providers: [ ... ],
       callbacks: { session: ({ session, user }) => ({ ... }) },
       // ...rest
     };
     ```

   - Remove any manual `: any` annotations on `session`/`user` callback parameters. Let `NextAuthOptions` infer the correct types.

2. Re-run type-check and lint:
   - `npm run -s type-check`
   - `npm run -s lint`

3. If the import `NextAuthOptions` is not present in the installed `next-auth` version (TypeScript error), fallback options in this order of preference:
   a. Import the correct exported options type from the installed `next-auth` (check `node_modules/next-auth/index.d.ts` to confirm exact name), e.g., `import type { NextAuthOptions } from "next-auth";`.
   b. If no suitable exported type exists, define a local lightweight type for `authConfig` that contains `callbacks?: { session?: (params: { session: DefaultSession; user: { id: string } }) => DefaultSession }` — typed narrowly to cover usage in this file only, and avoid `any`.
   c. As an absolute last resort, if typing proves impossible, add an inline ESLint disable for `@typescript-eslint/no-explicit-any` on the two lines only with a short TODO comment linking to this troubleshooting doc — but this is undesirable; prefer typed solution.

Validation (after Batch A):
- Goal: `no-explicit-any` errors in `src/server/auth/config.ts` are resolved. If so, proceed to Batch B.

Batch B — Fix surrounding lint warnings (medium priority)

Files (from `error.txt`) to update with minimal edits:
- `pages/dashboard/vaccinations/index.tsx` — rename unused `records` and `isLoading` to `_records` and `_isLoading` (or actually use them if intended).
- `pages/doctor/consultations/[appointmentId].tsx` — rename `appointmentId` to `_appointmentId` if unused.
- `pages/doctor/patients/[patientId]/history.tsx` — rename `data` to `_data` if unused.
- `pages/health-screening/index.tsx` — rename `packages`, `isLoading` to `_packages` and `_isLoading`.
- `components/doctor/TodaySchedule.tsx` — remove unused `cn` import or prefix with `_cn` depending on intended use.
- `components/payment/CheckoutForm.tsx` — remove unused `useState` import or use it if needed.
- `lib/auth/AuthContext.tsx`, `lib/integrations/resend.ts`, `lib/jobs/queue.ts`, `lib/notifications/types.ts` — convert imports used only for types to `import type { ... } from '...'`.
- `lib/jobs/types.ts` — replace anonymous default export (`export default {}`) with a named export like `export const jobTypesStub = {};` or remove entirely.
- `lib/trpc/context.ts` — prefix unused args `req` and `resHeaders` with `_req` and `_resHeaders` if they must remain in the signature (or remove them from the parameter destructuring if not used).
- `lib/trpc/root.ts` — remove unused `publicProcedure` import if not used.
- Others flagged in `error.txt` — address each by renaming to `_`-prefixed variables or changing to `import type` as appropriate.

Validation (after Batch B):
- `npm run -s lint` should show zero errors; warnings are acceptable per project rules but try to eliminate most.

Batch C — Final build

1. Run `npm run build`.
2. If build fails, analyze remaining errors and repeat the edit/test cycle.

Rollback and safety

- All edits are small, localized, and reversible.
- We'll avoid aggressive refactors; prefer precise type annotations and small renames.

Estimated time

- Batch A (auth typing): 10–20 minutes.
- Batch B (lint cleanups): 15–40 minutes depending on the number of files.
- Batch C (final build): 5–15 minutes.

Next step (requires your confirmation)

I will proceed with Batch A (fix `src/server/auth/config.ts`) now. After that I will run `npm run -s type-check` and `npm run -s lint` and report the results and next steps.

If you prefer I should run the full `npm run build` instead of the lint/type-check after Batch A, say so; otherwise I will run the checks first to keep feedback fast and focused.

---

This file saved to `docs/troubleshooting/build-error-auth-config-2025-11-09.md` as requested. It includes analysis, findings, and the validated plan. I'll proceed once you confirm "Go ahead". 