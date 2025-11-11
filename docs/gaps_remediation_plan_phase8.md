Phase: Payments alignment (tRPC + Stripe webhook) is now complete and stable; ready to proceed to the next remediation phase (e.g., telemedicine / feedback / jobs) based on the master plan.

Concise summary of what is now in place

1) Auth and identity

- Canonical choice:
  - NextAuth + Prisma is the single identity and session system.
- Codified in:
  - [`AGENT.md`](AGENT.md:10)
  - [`src/server/auth/config.ts`](src/server/auth/config.ts:1)
  - [`src/server/auth/index.ts`](src/server/auth/index.ts:1)
  - [`src/server/api/trpc.ts`](src/server/api/trpc.ts:1)
- Divergent Supabase Auth path removed:
  - [`lib/auth/actions.ts`](lib/auth/actions.ts:1) now documents and disables the old Supabase-auth signup flow instead of creating a split identity.

2) Booking flow foundation

- [`src/services/appointment-service.ts`](src/services/appointment-service.ts:1)
  - Central orchestration point for booking requests.
  - Stable, validated input/output types.
  - Idempotency via idempotencyKey.
  - In-memory persistence with a non-breaking hook ready for future DB integration.
- [`src/lib/trpc/routers/appointment.router.ts`](src/lib/trpc/routers/appointment.router.ts:1)
  - Public booking endpoint delegating to AppointmentService.
  - Uses TRPCError for clean error mapping.
- Booking UI (src/app/booking/page.tsx) remains compatible and benefits from the hardened backend.

3) Payments alignment (this phase)

A) tRPC payment router

- File: [`lib/trpc/routers/payment.router.ts`](lib/trpc/routers/payment.router.ts:1)

Key properties:

- Auth:
  - Uses protectedProcedure → requires NextAuth session.
  - Trusts ctx.user.id as canonical identity.

- Ownership and appointment fetch:
  - Loads appointment with:
    - id, clinic_id, patient_id, consultation_fee.
    - Nested patients!inner(id, user_id, chas_card_type).
  - Filters:
    - appointment.id = input.appointmentId.
    - patients.user_id = ctx.user.id.
  - If not found:
    - Throws NOT_FOUND (secure and clear).

- CHAS & amount calculation:
  - Safely extracts patient and chas_card_type.
  - Uses CHASCalculator to compute subsidyAmount and finalAmount.
  - Validates finalAmount > 0; otherwise BAD_REQUEST.

- Payments insert aligned with schema:
  - Inserts into payments with:
    - clinic_id: from appointment.
    - patient_id: from patient.
    - appointment_id: from appointment.
    - payment_number / receipt_number:
      - Generated via generateBusinessId("PAY"/"REC").
    - payment_date: today (YYYY-MM-DD).
    - payment_method: "stripe".
    - payment_gateway: "stripe".
    - subtotal: consultationFee.
    - chas_subsidy_amount: subsidyAmount.
    - total_amount: finalAmount.
    - paid_amount: 0.
    - outstanding_amount: finalAmount.
    - status: "pending".
  - If insert fails:
    - INTERNAL_SERVER_ERROR: "Could not create payment record."

- Stripe PaymentIntent:
  - Creates intent with:
    - amount = finalAmountInCents.
    - currency = "sgd".
    - metadata:
      - paymentId: payments.id.
      - appointmentId.
      - patientId.
  - Updates payments:
    - payment_intent_id = paymentIntent.id.
  - Returns to client:
    - clientSecret.
    - totalAmount, subsidyAmount, originalAmount.

- Error behavior:
  - Uses TRPCError for all error paths.
  - No schema-breaking placeholders remain.

B) Stripe webhook refinement

- File: [`pages/api/webhooks/stripe.ts`](pages/api/webhooks/stripe.ts:1)

Key properties:

- Keeps existing robust behavior:
  - Verifies Stripe signature with stripeService.constructWebhookEvent.
- On payment_intent.succeeded:
  - Reads paymentId from paymentIntent.metadata.paymentId.
  - If missing:
    - Logs error and breaks (acknowledges event).
  - Uses Supabase admin client:
    - Updates payments:
      - status: "completed".
      - transaction_reference: paymentIntent.latest_charge.
  - Logs:
    - Success or failure with clear messages.
  - Returns 200 either way to avoid infinite Stripe retries; errors are operationally visible.
- No invalid TypeScript or speculative logic.
- Compatible with the paymentRouter contract:
  - paymentId written into metadata by createPaymentIntent is used here.

Validation checklist for this focused side-step

- [x] Webhook uses metadata.paymentId that paymentRouter sets.
- [x] Webhook updates only status and transaction_reference (safe, minimal).
- [x] No references to Supabase Auth or secondary identity.
- [x] No TypeScript errors (removed supabaseAdmin.rpc misuse).
- [x] Behavior is idempotent and operationally debuggable.

Net result of the Payments phase

- Payments flow is now:

  1) Authenticated user (NextAuth).
  2) createPaymentIntent:
     - Verifies appointment ownership.
     - Computes CHAS subsidy.
     - Creates schema-compliant payments row (pending).
     - Creates Stripe PaymentIntent with linked metadata.
  3) Stripe webhook:
     - Verifies signature.
     - Uses metadata.paymentId to mark payment as completed.

- This is aligned with:
  - master_remediation_plan.md.
  - Updated AGENT.md Auth policy.
  - Financial schema in 007_financial_tables.sql.

With this phase complete and stable, the codebase is ready for the next remediation step (e.g., telemedicine sessions alignment with telemedicine_sessions schema, feedback alignment with user_feedback, or jobs/queue hardening) following the same meticulous, file-by-file approach.
