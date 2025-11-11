Payments alignment sub-plan executed for paymentRouter, consistent with schema, auth decision, and webhook contract.

Files changed

1) lib/trpc/routers/payment.router.ts
- File: [`lib/trpc/routers/payment.router.ts`](lib/trpc/routers/payment.router.ts:1)

Key behaviors after change

1. Auth and identity usage

- Uses protectedProcedure:
  - Requires authenticated user via NextAuth-driven context.
- Ownership check:
  - When fetching appointment, enforces:
    - patients.user_id = ctx.user.id
  - This ties payment initiation to the canonical NextAuth/Prisma user id (as required by AGENT.md).

2. Appointment and patient loading (schema-aware)

- Query:
  - From "appointments":
    - Selects:
      - id
      - clinic_id
      - patient_id
      - consultation_fee
      - patients!inner(id, user_id, chas_card_type)
  - Filters:
    - .eq("id", input.appointmentId)
    - .eq("patients.user_id", ctx.user.id)
- Validation:
  - If no row or error:
    - Throws NOT_FOUND with clear message.
  - Ensures:
    - Appointment belongs to current user.
    - We have clinic_id and patient_id needed for payments table.

3. CHAS subsidy and amount calculation

- Extracts patient from nested relation:
  - Handles both array and single object shapes defensively.
  - If patient.id is missing:
    - Throws INTERNAL_SERVER_ERROR to avoid half-baked records.
- CHAS mapping:
  - Normalizes chas_card_type; only accepts known values (blue, orange, green, none).
  - Defaults to "none" if unknown.
- Uses CHASCalculator:
  - Calculates subsidyAmount and finalAmount.
- Validates:
  - finalAmountInCents > 0.
  - If not:
    - Throws BAD_REQUEST: "No payable amount after subsidies/adjustments."

4. Payments insert aligned with clinic.payments schema

Based on 007_financial_tables.sql:

- Inserts a new row into payments with:

  - clinic_id:
    - From appointment.clinic_id.
  - patient_id:
    - From patient.id.
  - appointment_id:
    - From appointment.id.
  - payment_number:
    - Generated via generateBusinessId("PAY").
  - receipt_number:
    - Generated via generateBusinessId("REC").
  - payment_date:
    - Today’s date in YYYY-MM-DD (UTC) format.
  - payment_method:
    - "stripe".
  - payment_gateway:
    - "stripe".
  - subtotal:
    - consultationFee.
  - chas_subsidy_amount:
    - subsidyAmount.
  - total_amount:
    - finalAmount.
  - paid_amount:
    - 0 (nothing collected yet).
  - outstanding_amount:
    - finalAmount (awaiting payment).
  - status:
    - "pending".

- Selects and validates:
  - .select("id").single().
  - If insert fails or no id:
    - Throws INTERNAL_SERVER_ERROR: "Could not create payment record."

- This removes all:
  - "..." placeholders.
  - Ad-hoc values not supported by schema.

5. Stripe PaymentIntent creation and linkage

- Calls:
  - stripeService.createPaymentIntent(finalAmountInCents, "sgd", metadata)
- Metadata includes:
  - appointmentId: input.appointmentId
  - paymentId: paymentRecord.id (string)
  - patientId: patient.id (string)
- On success:
  - Updates payments:
    - payment_intent_id = paymentIntent.id
  - Validates update:
    - If fail:
      - Throws INTERNAL_SERVER_ERROR:
        - "Payment intent created, but failed to link it to payment record."

- Returns to client:
  - clientSecret
  - totalAmount (finalAmount)
  - subsidyAmount
  - originalAmount (consultationFee)

6. Error handling

- Uses TRPCError consistently:
  - NOT_FOUND for missing/unauthorized appointment.
  - BAD_REQUEST for non-payable conditions.
  - INTERNAL_SERVER_ERROR for DB/Stripe issues.
- Keeps messages user-safe and aligned with Meticulous Approach principles.

Stripe webhook compatibility check

- File (unchanged in this step):
  - [`pages/api/webhooks/stripe.ts`](pages/api/webhooks/stripe.ts:1)

Key points:

- Expects:
  - metadata.paymentId on PaymentIntent.
- On payment_intent.succeeded:
  - Updates payments:
    - status = "completed"
    - transaction_reference = latest_charge
- With the updated paymentRouter:
  - metadata.paymentId is set to paymentRecord.id.
  - payments.id is UUID PK from schema.
  - This matches webhook expectations.
- Optional future refinement (not applied here, to keep changes focused):
  - Also set:
    - paid_amount = total_amount
    - outstanding_amount = 0
  - when marking completed.

Checklist vs sub-plan

- Uses ctx.session.user.id (NextAuth) as canonical identity:
  - [x] Ownership enforced via patients.user_id = ctx.user.id.

- Queries appointments and patients per schema:
  - [x] Fetches clinic_id, patient_id, consultation_fee, chas_card_type.
  - [x] Validates presence of patient.id.

- Writes to payments with correct schema fields; no placeholders:
  - [x] clinic_id from appointment.
  - [x] patient_id from patient.
  - [x] appointment_id from input/appointment.
  - [x] payment_number / receipt_number generated via generateBusinessId.
  - [x] payment_date set.
  - [x] subtotal / chas_subsidy_amount / total_amount set.
  - [x] paid_amount = 0, outstanding_amount = total_amount.
  - [x] status = "pending".
  - [x] payment_method/payment_gateway = "stripe".
  - [x] payment_intent_id patched after PaymentIntent creation.

- Cooperates with Stripe webhook:
  - [x] PaymentIntent metadata includes paymentId expected by webhook.
  - [x] Webhook can reliably update matching payments row.

No schema changes or auth model shifts were introduced.

This completes the payments alignment step for the createPaymentIntent flow in a precise, schema-consistent, auth-consistent manner and sets a solid foundation for a small, subsequent refinement of the webhook handler in a separate focused change set if desired.
