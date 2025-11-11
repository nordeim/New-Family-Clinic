# Plan — Evolve “Book an Appointment” CTA into Real Booking Flow

Date: 2025-11-11  
Owner: AI Coding Agent (Kilo Code)  
Status: Plan only (no booking backend changes applied yet)

---

## 1. Objective

Transform the current “Book an Appointment” CTA from a scroll-only UX into a real, testable booking entry point that:

- Aligns with the “Healthcare with Heart” and Healthier SG vision.
- Integrates cleanly with the platform’s application architecture:
  - App Router (app/)
  - tRPC
  - Services and database/migrations (booking tables and procedures)
- Is safe, incremental, and fully covered by Playwright tests.

We will support three progressive levels:

1) Level 0 (current): Scrolls to demo quick booking card (already implemented).
2) Level 1 (MVP booking entry): Navigates to dedicated booking page/flow with proper route + form (no complex concurrency yet).
3) Level 2 (full integration): Wires booking CTA and booking page into real tRPC/service + DB transactional booking.

This document defines the meticulous plan for Levels 1 and 2 and how tests will evolve.

---

## 2. Current State (Baseline)

- CTA locations:
  - Hero primary button: “Book an Appointment”
  - Header “Book Appointment” button
- Behavior:
  - Implemented in `src/app/page.tsx`:
    - Scrolls to `#hero-book` (quick booking card).
- Quick booking card:
  - Static, no real backend integration.
  - Safe demo.

This is aligned with design but not yet with the real transactional booking model defined in the architecture docs.

---

## 3. Target Architecture for Booking Flow

We follow the project patterns (AGENT.md, Project_Architecture_Document):

- Booking flow should use:
  - tRPC router under:
    - `src/lib/trpc/routers/appointment.router.ts`
  - Service layer:
    - `src/services/appointment-service.ts` (or equivalent) to call DB logic.
  - Database migrations:
    - booking tables and `booking.create_booking` procedure already exist (e.g., `database/migrations/013_booking_transaction.sql`).
- Frontend:
  - App Router page for booking:
    - `src/app/booking/page.tsx`
    - or `src/app/appointments/book/page.tsx`
  - Uses `@/lib/trpc/client` hooks for booking.

Design constraints:

- Must be:
  - Elderly-friendly (simple, few fields, clear guidance).
  - Resilient (idempotency, safe retries via existing DB design).
  - Secure (no sensitive data leakage).

---

## 4. Phase 1 — MVP Booking Entry (No DB Writes Yet)

Goal:

- Make “Book an Appointment” CTA clearly functional by navigating to a dedicated booking route, while keeping backend integration as a separate, controlled step.

Changes:

1) Routing

- Add dedicated booking entry route:
  - `src/app/booking/page.tsx`
- Behavior:
  - Simple, static-first booking form (name, phone, reason, preferred date/time).
  - Clear copy: request will be manually confirmed (until real integration lands).
- This page:
  - Aligns UX with landing page.
  - Serves as canonical place for future tRPC-backed booking.

2) Update CTAs

- In `src/app/page.tsx`:
  - Header “Book Appointment” button:
    - Change to link to `/booking`.
  - Hero “Book an Appointment” button:
    - Change primary action to `router.push("/booking")`.
    - Optionally keep small text link to scroll down to quick card.
- This guarantees:
  - All “Book Appointment” CTAs have a concrete, obvious behavior:
    - Navigate to `/booking`.

3) Tests

Extend Playwright tests in `tests/e2e/landing-links.spec.ts` or new spec:

- New tests:
  - “Book Appointment CTAs navigate to /booking”
    - Assert clicking header CTA results in URL `/booking`.
    - Assert clicking hero CTA results in URL `/booking`.
- New `tests/e2e/booking-page.spec.ts`:
  - Assert `/booking`:
    - Renders booking heading.
    - Shows basic form fields and info.
    - No console errors.

No backend booking submissions yet; intentionally UX-only.

---

## 5. Phase 2 — tRPC + Service + DB Integration

Once MVP entry is stable, integrate with real booking backend.

5.1 Backend

1) Appointment Service

- File:
  - `src/services/appointment-service.ts` (create if missing).
- Add:
  - `createBooking` method:
    - Accepts validated input (patient/contact info, slot/time, reason).
    - Calls DB layer:
      - Uses existing transactional helper (e.g., `booking.create_booking`).
    - Handles:
      - IdempotencyKey (generated client- or server-side).
      - Maps DB errors to domain-safe errors (e.g., slot_unavailable).

2) tRPC Router

- File:
  - `src/lib/trpc/routers/appointment.router.ts`
- Add mutation:
  - `requestBooking` or `createBooking`:
    - Input schema:
      - name, phone, clinicId (or fixed), reason, desiredSlot/time, idempotencyKey.
    - Output:
      - bookingRequestId, status, message, (optionally) appointmentNumber.
    - Implementation:
      - Validates input with zod.
      - Calls `appointment-service.createBooking`.
      - Returns normalized result.

3) API Integration

- Ensure router is wired:
  - `src/lib/trpc/root.ts` / `src/server/api/root.ts` includes `appointment` router.

5.2 Frontend

1) Booking Page uses tRPC

- `src/app/booking/page.tsx`:
  - Mark `"use client"`.
  - Use `api.appointment.createBooking.useMutation()`:
    - On submit:
      - Validate with same rules as server.
      - Pass idempotencyKey (e.g., uuid).
      - Show loading and success/error toasts.
  - UX:
    - Clear “Request Received; we will confirm via WhatsApp/SMS” messaging.
    - Ensure accessible error messages.

2) Landing Quick Booking Card

- Optionally:
  - Wire quick card submission to `appointment.createBooking` mutation.
  - Two-step:
    - For MVP, may only show success toast (mock).
    - For full integration, call actual mutation with idempotencyKey.

5.3 Playwright Tests (Extended)

New/updated tests:

- `tests/e2e/booking-page.spec.ts`:
  - “Book Appointment CTAs reach /booking”
    - From `/`, click hero CTA → expect URL `/booking`.
    - From `/`, click header CTA → expect URL `/booking`.
  - “Can submit booking form (happy path)”
    - Fill fields with valid data.
    - Submit.
    - Assert:
      - No client-side validation error remains.
      - Success message/toast is shown.
      - (Optional) For real backend: inspect API calls or DB state in test env.

- `tests/e2e/landing-links.spec.ts`:
  - Update existing scroll-based test:
    - For primary hero CTA:
      - Switch expectation from scroll to navigation to `/booking` once Phase 2 is live.
    - Keep nav anchor tests intact.

This ensures:

- CTAs are not “fake”; they drive into a genuinely implemented flow.
- E2E tests will fail if:
  - Route is missing.
  - Mutation mis-wired.
  - Booking form is broken.

---

## 6. Safety & Incremental Rollout

- Phase 1:
  - No DB writes.
  - Only adds `/booking` page and CTA navigation.
  - Low risk, easy revert.
- Phase 2:
  - Introduces real writes via tRPC/service/DB:
    - Must guard with:
      - Strict zod validation.
      - Idempotency keys.
      - Proper error handling.
  - Should:
    - Run in dev/test environment first.
    - Be covered by Playwright + unit tests.

---

## 7. Implementation Order Checklist

Phase 1 (Next):

- [ ] Create `src/app/booking/page.tsx` (static booking entry).
- [ ] Update CTAs in `src/app/page.tsx`:
  - Header “Book Appointment” → link to `/booking`.
  - Hero “Book an Appointment” → navigate to `/booking`.
- [ ] Add/extend Playwright tests to assert `/booking` navigation.
- [ ] Run: `npm run lint`, `npm run test:e2e`, `npm run build`.

Phase 2 (Subsequent task):

- [ ] Implement `appointment-service.ts` with `createBooking`.
- [ ] Implement `appointment.router.ts` with `createBooking` mutation.
- [ ] Wire into TRPC root router.
- [ ] Connect `/booking` page form to tRPC mutation.
- [ ] Optionally wire landing quick booking form to same mutation.
- [ ] Add unit tests (service + router) and extend Playwright tests for submission.
- [ ] Run full CI commands.

This plan is now staged and validated for correctness, impact, and alignment with the project’s architecture. Execution should proceed in these phases in subsequent steps.