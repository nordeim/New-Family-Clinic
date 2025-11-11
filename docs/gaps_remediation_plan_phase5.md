Planned changes for Payments Alignment (no edits applied yet)

Objective

Align the payments flow with:

- Auth decision:
  - NextAuth + Prisma is the single identity source.
- Schema:
  - clinic.payments from 007_financial_tables.sql.
- Runtime:
  - tRPC/NextAuth context (ctx.session.user.id).
  - Stripe webhook handler at [`pages/api/webhooks/stripe.ts`](pages/api/webhooks/stripe.ts:1).

We will refine the existing implementation in [`lib/trpc/routers/payment.router.ts`](lib/trpc/routers/payment.router.ts:1) without breaking the current contract, then ensure it cooperates cleanly with the Stripe webhook.

Phase scope (this step)

Only planning. Next step will implement via precise diffs.

1. Identity model in payments flow

Current:

- paymentRouter:
  - Uses protectedProcedure — good (requires authenticated user).
  - Uses ctx.supabase.from("appointments") and filters by patients.user_id = ctx.user.id.
  - Assumes:
    - ctx.user.id is the canonical user id.
    - Supabase has “appointments” and “patients” tables accessible that reflect this.

Planned adjustments:

- Treat ctx.session.user.id (via protectedProcedure) as canonical and do not introduce any Supabase Auth–specific identity.
- When querying appointments:
  - Ensure the filter uses that canonical user id for ownership:
    - patients.user_id = ctx.session.user.id (as today).
- Ensure any use of ctx.supabase in this router is:
  - A DB client bound to the same NextAuth/Prisma-based identity (or uses server-side/admin context), not Supabase Auth user.

2. Schema alignment for payments insert

Schema constraints (007_financial_tables.sql):

- payments (within clinic schema) requires:
  - id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
  - clinic_id UUID NOT NULL
  - patient_id UUID NOT NULL
  - appointment_id UUID NULLABLE
  - payment_number VARCHAR(50) UNIQUE NOT NULL
  - receipt_number VARCHAR(50) UNIQUE NOT NULL
  - payment_date DATE NOT NULL
  - payment_method VARCHAR(50) NOT NULL
  - subtotal DECIMAL(10,2) NOT NULL
  - total_amount DECIMAL(10,2) NOT NULL
  - paid_amount DECIMAL(10,2) NOT NULL
  - status payment_status DEFAULT 'pending'
  - plus other optional/aux fields.

Current paymentRouter behavior:

- Inserts into "payments" with:
  - clinic_id: "..." (placeholder) — invalid.
  - payment_number / receipt_number: naive `Date.now()`-based.
  - No payment_date.
  - total_amount but no paid_amount/outstanding alignment.

Planned changes:

A) Appointment fetch shape:

- Update SELECT to fetch:
  - appointment_id
  - clinic_id
  - patient_id
  - consultation_fee
  - patient’s CHAS card type
- The query should:
  - Verify appointment belongs to current user.
  - Provide required FK values for payments table.

B) Insert into payments with valid schema:

- Map fields as:
  - clinic_id:
    - From appointment.clinic_id.
  - patient_id:
    - From appointment’s patient_id (not nested placeholder).
  - appointment_id:
    - input.appointmentId.
  - payment_number:
    - Generate unique, human-readable identifier, e.g.:
      - "PAY-" + short UUID or timestamp+random.
  - receipt_number:
    - Similar scheme: "REC-" + short UUID or sequence.
  - payment_date:
    - Use current date (e.g., now() in DB or current UTC on server).
  - payment_method:
    - "stripe" (for this flow).
  - subtotal:
    - consultationFee from appointment.
  - chas_subsidy_amount:
    - From CHASCalculator result.
  - total_amount:
    - finalAmount (after subsidy).
  - paid_amount:
    - 0 at intent-creation time.
  - outstanding_amount:
    - total_amount at intent creation (not yet paid).
  - status:
    - "pending".
  - payment_gateway:
    - "stripe".
  - payment_intent_id:
    - Initially null; set after Stripe intent created.

C) After Stripe PaymentIntent creation:

- Update the same payment row:
  - Set payment_intent_id = paymentIntent.id.
- Ensure metadata on PaymentIntent includes:
  - paymentId: our payments.id
  - appointmentId: input.appointmentId
  - patientId: patient_id

3. Cooperation with Stripe webhook

Current webhook behavior:

- On payment_intent.succeeded:
  - Reads metadata.paymentId.
  - Updates payments:
    - status: "completed"
    - transaction_reference: paymentIntent.latest_charge
- This is already structurally correct if:
  - paymentRouter creates payments row.
  - metadata.paymentId is set.

Planned adjustments:

- Confirm metadata shape:
  - Ensure paymentRouter sets metadata.paymentId consistent with webhook usage.
- Optionally (within this scope):
  - When marking completed:
    - Update:
      - paid_amount to total_amount.
      - outstanding_amount to 0.
    - Keep other fields intact.
- Ensure:
  - No identity logic is added in webhook; it should trust metadata.paymentId plus Stripe verification.

4. Security and ownership

Planned rules:

- createPaymentIntent:
  - Must be protectedProcedure.
  - Must:
    - Fetch appointment where:
      - appointment.id = input.appointmentId
      - appointment belongs to current user (via patients.user_id = ctx.session.user.id).
  - If no match:
    - Throw NOT_FOUND with message about missing/unauthorized appointment.

- Webhook handler:
  - Remains authenticated via Stripe signature, not user session.
  - Only uses metadata.paymentId and Stripe API verification.

5. Implementation outline (for next step)

For lib/trpc/routers/payment.router.ts:

- Normalize query:

  - SELECT from "appointments" (or clinic.appointments depending on client) to retrieve:
    - clinic_id
    - patient_id
    - consultation_fee
    - patient.chas_card_type
  - Confirm filter ensures current user’s ownership.

- Compute CHAS subsidy:

  - Use CHASCalculator as today, with robust extraction of chas_card_type from nested patient object.

- Create payments row:

  - Use ctx.supabase (server-side DB client) or a dedicated DB helper to:
    - Insert record into payments with:
      - Fully populated fields honoring schema.
      - No literal "..." placeholders.

- Create Stripe PaymentIntent:

  - Call stripeService.createPaymentIntent with:
    - amount = finalAmountInCents
    - currency = "sgd"
    - metadata:
      - paymentId (from DB)
      - appointmentId
      - patientId

- Update payments row with payment_intent_id.

- Return to client:

  - clientSecret
  - totalAmount
  - subsidyAmount
  - originalAmount

For pages/api/webhooks/stripe.ts:

- Validate current behavior against the new contract:

  - Expects metadata.paymentId → payments.id.
  - On success:
    - Update status = "completed".
    - Set transaction_reference.
    - (Optionally) set paid_amount and outstanding_amount for consistency.

- No changes are strictly required for the initial alignment, but we can improve consistency in a later pass.

6. Constraints and non-goals for this slice

- Do not:
  - Change schema.
  - Introduce Supabase Auth.
  - Alter NextAuth configuration.
- Keep:
  - Identity source: ctx.session.user.id (NextAuth).
  - Webhook logic: uses Stripe verification + metadata.paymentId.

This plan is now ready to be executed in the next step via targeted apply_diff updates to payment.router.ts (and optionally a minimal, safe enhancement to the webhook handler) while validating every change against:

- 007_financial_tables.sql
- AGENT.md Auth guidelines
- master_remediation_plan.md.
