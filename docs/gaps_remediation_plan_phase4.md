Next remediation step direction established and inputs gathered for payments/telemedicine/feedback/jobs alignment.

Summary of current progression

- Auth alignment:
  - NextAuth + Prisma codified as the single identity system in:
    - [`AGENT.md`](AGENT.md:10)
    - [`src/server/auth/config.ts`](src/server/auth/config.ts:1)
    - [`src/server/api/trpc.ts`](src/server/api/trpc.ts:1)
  - Supabase Auth-based signup path disabled and documented in:
    - [`lib/auth/actions.ts`](lib/auth/actions.ts:1)
- Booking flow:
  - [`src/services/appointment-service.ts`](src/services/appointment-service.ts:1) now acts as the canonical booking orchestrator with stable contract and idempotency.
  - [`src/lib/trpc/routers/appointment.router.ts`](src/lib/trpc/routers/appointment.router.ts:1) delegates to AppointmentService and uses TRPCError.

What this step did

- Ran a targeted search:
  - [`lib/trpc/root.ts`](lib/trpc/root.ts:1)
  - [`lib/trpc/routers/payment.router.ts`](lib/trpc/routers/payment.router.ts:1)
  - [`lib/trpc/routers/telemedicine.router.ts`](lib/trpc/routers/telemedicine.router.ts:1)
  - [`lib/trpc/routers/feedback.router.ts`](lib/trpc/routers/feedback.router.ts:1)
  - [`lib/trpc/routers/health.router.ts`](lib/trpc/routers/health.router.ts:1)
  - [`lib/jobs/queue.ts`](lib/jobs/queue.ts:1)
  - [`pages/api/webhooks/stripe.ts`](pages/api/webhooks/stripe.ts:1)
  - [`pages/api/cron/process-jobs.ts`](pages/api/cron/process-jobs.ts:1)
- This confirms the locations of the next integration points:
  - Payment creation and webhook reconciliation (payments table).
  - Telemedicine session management (telemedicine_sessions table).
  - Feedback submission (user_feedback table).
  - Health router placeholders (health_screening_*).
  - Background jobs (jobs table) and admin broadcast.

Next concrete remediation step (to be executed next)

- Focus Phase: Payments alignment (high impact, bounded scope).
- Target file:
  - [`lib/trpc/routers/payment.router.ts`](lib/trpc/routers/payment.router.ts:1)
- Immediate goals:
  - Ensure:
    - It uses ctx.session.user.id (NextAuth) as canonical identity.
    - It queries appointments and patients in a way that matches the migrations.
    - It writes to payments table with correct schema fields (no "..." placeholders).
    - It cooperates with Stripe webhook handler (pages/api/webhooks/stripe.ts).
- This will be implemented in the following step via precise diffs, validating against:
  - master_remediation_plan.md
  - AGENT.md auth guidelines
  - database/migrations for payments.*

At this point, no new code changes beyond those already reported were made in this specific step; this result marks the transition from auth alignment to the payments integration phase under the established architecture.
