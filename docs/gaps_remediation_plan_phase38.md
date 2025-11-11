Non-existent tRPC calls in the Vaccinations and Health Screening pages have been removed and replaced with documented static placeholders; this resolves the latest type/lint build blockers while preserving the roadmap for future endpoints.

Summary of fixes in this checkpoint

1) Vaccinations page — remove invalid getPatientVaccinations usage

File:
- [`pages/dashboard/vaccinations/index.tsx`](pages/dashboard/vaccinations/index.tsx:1)

Previously:
- Imported api from "@/lib/trpc/client".
- Called:
  - api.health.getPatientVaccinations.useQuery();
- Health router does not expose getPatientVaccinations, causing a tRPC type error.

Now:
- Import:
  - Only:
    - ProtectedRoute from "@/components/auth/ProtectedRoute".
- Component:

  - Documented via header comment:

    - The health router does not yet expose getPatientVaccinations.
    - To keep types/build clean, this page is static.
    - When implemented in lib/trpc/routers/health.router.ts, re-wire using api.health.getPatientVaccinations.useQuery().

  - Renders:

    - ProtectedRoute wrapper.
    - Static content:
      - Title: “My Vaccination Records”.
      - Body text explaining the page is intentionally static until a typed tRPC endpoint is available.

Effects:
- Removes unused api import (fixes @typescript-eslint/no-unused-vars warning).
- Eliminates call to non-existent tRPC procedure (fixes type error).
- Keeps UX coherent and documents future wiring.

2) Health screening page — remove invalid getScreeningPackages usage

File:
- [`pages/health-screening/index.tsx`](pages/health-screening/index.tsx:1)

Previously:
- Imported api.
- Called:
  - api.health.getScreeningPackages.useQuery();
- No corresponding endpoint in health router → type error at build.

Now:
- Replaced entire implementation with:

  - File-level doc comment:

    - health router does not yet expose getScreeningPackages.
    - Static placeholder used to keep types/build clean.
    - Once implemented, can rewire via api.health.getScreeningPackages.useQuery().

  - Component:

    - Static layout:
      - Title: “Health Screening Packages”.
      - Descriptive copy about preventive health screenings.
      - Placeholder text:
        - Dynamic listing coming soon; intentionally static until typed endpoint exists.

Effects:
- Removes dependency on non-existent tRPC procedure.
- Removes unused api import.
- Fixes both the type error and lint warnings.

Context and consistency check

These adjustments are fully aligned with:

- The Meticulous Approach:
  - Do not paper over missing endpoints.
  - Make placeholders explicit and documented.
- tRPC + TypeScript strictness:
  - No calls to routes that don’t exist in AppRouter.
  - No reliance on any or implicit types.
- PDPA/logging constraints:
  - Both pages remain non-PHI, content-only surfaces.
- Previous work remains intact:
  - payment.router.ts:
    - any removed; ChasCardType union used.
    - PDPA-safe Stripe logging guidance.
  - telemedicine.router.ts:
    - Typed TelemedicineSessionRecord.
    - Logs constrained (appointmentId + sanitized error only).
  - feedback.router.ts:
    - Logs only safe technical info on error.
  - lib/jobs/queue.ts:
    - JobRecord typed; PDPA-safe logging.
  - health.router.ts:
    - Explicit PDPA/non-diagnostic guidance.
  - jest.config.cjs:
    - Valid CommonJS Jest config for tests/server.

Why this is a good major-checkpoint completion

- All reported blocking issues in this round:
  - Unexpected any in payment.router.ts.
  - Non-existent getPatientVaccinations / getScreeningPackages calls.
- Have been fixed with:
  - Minimal code changes.
  - Strong documentation for future endpoints.
  - No impact on existing working functionality.
- The project is now positioned for:
  - A clean npm run build (with these specific errors resolved).
  - Next phase: solidifying Jest tests and adding tRPC procedures in a controlled manner when ready.
