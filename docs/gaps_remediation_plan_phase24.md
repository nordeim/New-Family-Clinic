Planned and scoped the next precise steps for PDPA/logging confirmation and Jest-based tests as distinct, PR-sized changes, without modifying code in this message.

This response is a concrete execution blueprint you can follow step-by-step.

A) PDPA/logging confirmation — micro-sweep plan

Target files:
- [`lib/trpc/routers/payment.router.ts`](lib/trpc/routers/payment.router.ts:1)
- [`lib/trpc/routers/telemedicine.router.ts`](lib/trpc/routers/telemedicine.router.ts:1)
- [`lib/trpc/routers/feedback.router.ts`](lib/trpc/routers/feedback.router.ts:1)
- [`lib/trpc/routers/health.router.ts`](lib/trpc/routers/health.router.ts:1)
- [`lib/jobs/queue.ts`](lib/jobs/queue.ts:1)
- [`pages/api/webhooks/stripe.ts`](pages/api/webhooks/stripe.ts:1)

Objectives:
- Ensure all logs:
  - Only include:
    - IDs (paymentId, jobId, appointmentId, etc.)
    - error.code, error.message, or equivalent
    - High-level context labels
  - Never include:
    - PHI (symptoms, diagnoses, NRIC, full names inside payloads)
    - Full request/response bodies
- Add explicit comments at key boundaries:
  - “Do not log PHI or full payloads.”

Planned edits by file (to be applied in tiny patches):

1) payment.router.ts
- Review any console.error/console.log.
- If present:
  - Ensure messages only reference:
    - appointmentId, paymentId, error.code/message.
- Add a short comment near logging:
  - // PDPA: keep logs free of PHI; log IDs and error codes only.

2) telemedicine.router.ts
- For logs in error paths (e.g., room creation failure):
  - Confirm they log only:
    - error message
    - appointmentId (optional)
  - Add:
  - // PDPA: do not log clinical content or meeting details tied to identity.

3) feedback.router.ts
- Ensure:
  - Logs do not include feedbackText contents.
  - If currently logging the Supabase error object, that’s acceptable if it excludes user payload.
- Add:
  - // PDPA: never log full feedback text or user identifiers here.

4) health.router.ts
- No runtime logs currently expected.
- Add top-level comment reinforcement:
  - Protected summary must remain minimal and non-diagnostic.

5) lib/jobs/queue.ts
- Logs are already structured.
- Confirm:
  - No logging of job.payload.
- Add/confirm doc:
  - Jobs are infra-level; do not log job payloads if they could contain PHI.

6) pages/api/webhooks/stripe.ts
- Ensure:
  - Logs reference paymentId, event type, error messages.
  - No cardholder/PII/PHI logged.
- Add:
  - // PDPA: Stripe webhooks must not log card details or sensitive patient info.

Each of these can be applied as separate, very small diffs focused solely on logging text/comments.

B) Tests — Jest-based, mock-driven, per-module plans

Global approach:
- Use Jest test files under tests/server/ with clear naming.
- For each suite:
  - Mock:
    - Supabase client calls (ctx.supabase, createSupabaseAdminClient).
    - External providers (stripeService, dailyVideoProvider).
    - tRPC context (protected/public procedures).
- Assert:
  - Correct behavior for success, authorization failures, and error mapping.

1) paymentRouter.createPaymentIntent tests

File:
- tests/server/payment.router.test.ts

Key tests:
- Success:
  - Mock:
    - ctx.session.user.id = "user-1"
    - appointments query returns matching appointment and patient with consultation_fee.
    - payments insert returns { id: "pay-1" }.
    - stripeService.createPaymentIntent returns fake intent with client_secret.
  - Expect:
    - TRPC mutation returns:
      - clientSecret, totalAmount, subsidyAmount, originalAmount.
    - Supabase and stripe mocks called with correct metadata.

- Unauthorized/Not found:
  - appointments query returns null or error.
  - Expect TRPCError with code "NOT_FOUND".

- No payment required:
  - consultation_fee <= 0.
  - Expect TRPCError "BAD_REQUEST".

- Insert failure:
  - payments insert returns error.
  - Expect TRPCError "INTERNAL_SERVER_ERROR".

- PaymentIntent failure:
  - createPaymentIntent throws.
  - Expect TRPCError "INTERNAL_SERVER_ERROR".

2) telemedicineRouter.getTelemedicineSession tests

File:
- tests/server/telemedicine.router.test.ts

Key tests:
- Existing session reuse:
  - appointment exists and user is patient/doctor.
  - telemedicine_sessions.single returns { room_url: "https://room" }.
  - Expect:
    - { roomUrl: "https://room" }.

- New session creation:
  - No existing session.
  - dailyVideoProvider.createRoom returns { url, name }.
  - Insert succeeds.
  - Expect:
    - { roomUrl: url } and correct Supabase calls.

- Forbidden access:
  - appointment exists but user is neither patient nor doctor.
  - Expect TRPCError "FORBIDDEN".

- Failure paths:
  - Daily or insert error → TRPCError "INTERNAL_SERVER_ERROR".

3) feedbackRouter.submitFeedback tests

File:
- tests/server/feedback.router.test.ts

Key tests:
- No content:
  - No rating and no feedbackText.
  - Expect:
    - success: true
    - No insert.

- Valid feedback:
  - rating or feedbackText present.
  - Insert succeeds.
  - Expect:
    - success: true
    - Insert called with user_id from ctx.user.id.

- Insert error:
  - Insert returns error.
  - Expect TRPCError "INTERNAL_SERVER_ERROR".

4) JobProcessor / enqueueJob tests

File:
- tests/server/jobs.queue.test.ts

Key tests:
- enqueueJob:
  - Successful insert → no error thrown.
  - Insert error → console.error called (assert without PHI).

- JobProcessor.run:
  - No job:
    - rpc("claim_job") yields PGRST116 or null → run returns without error.
  - With job and handler:
    - handler runs → markAsCompleted called.
  - With job and no handler:
    - markAsFailed called with "No handler registered for queue."
  - Handler throws:
    - With attempts near MAX_ATTEMPTS:
      - markAsFailed.
    - With attempts lower:
      - retryJob called, run_at updated.

5) healthRouter tests

File:
- tests/server/health.router.test.ts

Key tests:
- getPublicHealthContent:
  - Returns static array with expected structure.

- getMyHealthSummary:
  - When patient exists:
    - Supabase returns { id: "patient-1" }.
    - Expect:
      - patientId = "patient-1".
      - lastScreeningDate, lastVaccinationDate = null.
      - hasChronicCarePlan = false.
  - When no patient:
    - Expect TRPCError "NOT_FOUND".

C) Execution guidance

To apply this plan in the same meticulous style:
- For PDPA/logging:
  - Create one tiny patch per 1–2 files (e.g., payments/logging, telemedicine/logging).
- For tests:
  - Add one test file at a time:
    - Start with paymentRouter, then telemedicine, etc.
  - Keep mocks and helpers shared where useful (e.g., a test utils module for creating fake ctx).

This blueprint is ready for direct incremental implementation as you requested, preserving the stable baseline and ensuring each step is reviewable and aligned with PDPA and architectural constraints.
