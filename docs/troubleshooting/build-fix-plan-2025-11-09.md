# Build failure triage & remediation plan — 2025-11-09

This document captures the analysis, findings, and the step-by-step implementation plan to resolve the current production build failure reported by `npm run build`.

Files referenced: attached `error.txt` (build output). The roadmap below is derived from that output.

## Summary of the problem

- The Next.js production build fails during ESLint/type-check stage. The build output shows two high-priority classes of failures:
  1. ESLint `@typescript-eslint/no-explicit-any` errors (treated as errors by the build):
     - `components/feedback/FeedbackWidget.tsx` (use of `any` to access mutation state)
     - `components/payment/CheckoutForm.tsx` (use of `any` to access mutation state)
     - `lib/trpc/routers/payment.router.ts` (loose `any` / unsafe supabase shapes)
     - `src/server/auth/config.ts` (callback binding elements implicitly `any`)
  2. Several ESLint warnings that should be fixed to keep the codebase clean and prevent future failures:
     - `@typescript-eslint/consistent-type-imports` warnings
     - `import/no-anonymous-default-export` warning
     - `@typescript-eslint/no-unused-vars` warnings across a number of pages/components

- The root cause is a set of conservative, unblock-first changes made earlier (casts to `any`, temporary `tsconfig` excludes, permissive env types) which left some `any` usages and other lint issues in the codebase. The build treats these as errors and fails.

## High-level remediation approach

- Fix `no-explicit-any` issues first, focusing on the few places the build flagged as errors.
- Convert value imports that are types-only to `import type` to satisfy `consistent-type-imports` rule.
- Replace anonymous default export in `lib/jobs/types.ts` with a named export.
- Fix unused variable warnings by prefixing with `_` (allowed) or removing/using them.
- Re-run `npm run lint` and `npm run build` iteratively until green.

The plan is broken into small, reversible batches so each change is minimal-risk and verifiable.

---

## Detailed implementation plan (stepwise)

Batch 1 — No-explicit-any in mutation usages (priority)

Goal: remove `any` casts used to access mutation state in UI components.

Files to change:
- `components/feedback/FeedbackWidget.tsx`
- `components/payment/CheckoutForm.tsx`

Actions:
1. Add a small, well-typed utility to detect mutation loading state without using `any`. Prefer using `import type` + type predicates that narrow from `unknown` to `{ isLoading?: boolean } | { status?: string }`.
2. Replace `isLoading={(submitMutation as any).isLoading}` with `isLoading={getMutationLoading(submitMutation)}`.
3. Replace `(createPaymentIntent as any).isLoading` with `getMutationLoading(createPaymentIntent)`.

Validation:
- Run `npm run -s type-check` and `npm run -s lint`.
- Expected: explicit-any errors for these two components are resolved.

Batch 2 — Payment router and Supabase shape safety

Goal: remove `any` in `lib/trpc/routers/payment.router.ts` and access patient fields safely.

Actions:
1. Replace ad-hoc `as any` assumptions by a small type-guard that detects whether `appointment.patients` is an array or an object, then read `patient = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients`.
2. Ensure any further usage of patient fields are guarded (e.g., `patient?.id`).

Validation:
- `npm run -s type-check` and `npm run -s lint` should not report `no-explicit-any` for this file.

Batch 3 — NextAuth typing in `src/server/auth/config.ts`

Goal: replace `any` usage in NextAuth callbacks with proper `NextAuthOptions`/callback typing.

Actions:
1. Import the correct NextAuth types from the installed `next-auth` version (e.g., `import type { NextAuthOptions } from "next-auth";`).
2. Annotate `authConfig: NextAuthOptions = { ... }` and let TypeScript infer callback parameter types.
3. If the installed next-auth types differ, use a minimal typed callback signature or a narrowly scoped `// eslint-disable-next-line` with a short justification.

Validation:
- `npm run -s type-check` and `npm run -s lint` — the implicit-any errors should be gone.

Batch 4 — consistent-type-imports, anonymous export, unused vars

Goal: fix remaining warnings so the build is clean and maintainable.

Actions:
1. Convert imports used only for types to `import type` in the flagged files (e.g., `lib/auth/AuthContext.tsx`, `lib/integrations/resend.ts`, `lib/jobs/queue.ts`, `lib/notifications/types.ts`).
2. Replace anonymous default export in `lib/jobs/types.ts` with a named export (e.g., `export const jobTypesStub = {}`) or remove it entirely.
3. Fix unused variables by either using them, removing them, or renaming to `_`-prefixed names (allowed by repo lint config). Files include pages mentioned in `error.txt`.

Validation:
- `npm run -s lint` should be clean (or only show acceptable warnings matched by repo rules).

Batch 5 — final build

Actions:
1. Run `npm run build` locally.
2. Fix any remaining build-time issues reported. These will likely be minor if batches 1–4 succeed.

---

## Safety and rollback

- Each batch contains minimal, reversible edits. I'll commit each batch as a single patch (or keep changes staged) so they can be reverted easily.
- If a batch introduces unexpected type-errors, I'll revert that batch and iterate more conservatively (e.g., add a tiny type declaration rather than refactoring logic).

## Estimated effort

- Batch 1: 10–20 minutes
- Batch 2: 10–20 minutes
- Batch 3: 5–15 minutes (dependent on next-auth types)
- Batch 4: 15–30 minutes
- Batch 5: 5–15 minutes

## Next step (requires your confirmation)

I will proceed with Batch 1 (remove `any` usage in `FeedbackWidget` and `CheckoutForm`) and then run `npm run -s type-check` and `npm run -s lint`. This is a low-risk, high-impact change that should clear 2 of the build-blocking errors.

Do you approve proceeding with Batch 1 now? If yes, I will apply the edits and report results immediately.
