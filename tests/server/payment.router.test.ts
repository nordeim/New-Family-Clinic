/**
 * tests/server/payment.router.test.ts
 *
 * Focused unit tests for paymentRouter.createPaymentIntent.
 * Uses Jest-style mocks; external services (Supabase, Stripe) are stubbed.
 *
 * NOTE:
 * - These tests assume a Jest test environment and a test runner configured
 *   in package.json. If not yet present, wire them into your existing Jest setup.
 */

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { paymentRouter } from "@/lib/trpc/routers/payment.router";
// Use the actual AppRouter export from the Next.js tRPC server entrypoint.
// Adjust this path if your AppRouter is defined elsewhere.
// PDPA: test types and mocks must use synthetic data only.
import type { AppRouter } from "~/server/api/root";

// Helper types for tRPC
type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

// Local aliases for clarity; AppRouter wiring can be fixed once the payment router
// is registered on the server side. For now, avoid indexing into RouterInput/Output
// on a non-existent key to keep this scaffold type-safe.
type CreatePaymentInput = { appointmentId: string };
type CreatePaymentOutput = {
  clientSecret: string | null;
  totalAmount: number;
  subsidyAmount: number;
  originalAmount: number;
};

// Minimal mock shapes
type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

function createMockCtx() {
  const fromMock = jest.fn();
  const updateMock = jest.fn();
  const insertMock = jest.fn();
  const selectMock = jest.fn();
  const singleMock = jest.fn();

  // Very small fluent mock to support the calls in paymentRouter
  fromMock.mockReturnValue({
    select: selectMock.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      single: singleMock,
    }),
    insert: insertMock.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: singleMock,
      }),
    }),
    update: updateMock.mockReturnValue({
      eq: jest.fn(),
    }),
  });

  const supabase = {
    from: fromMock,
  } as unknown as any;

  const ctx = {
    supabase,
    user: { id: "user-1" },
    session: { user: { id: "user-1" } },
  };

  return {
    ctx,
    fromMock,
    insertMock,
    updateMock,
    selectMock,
    singleMock,
  };
}

// Mock stripeService
jest.mock("@/lib/integrations/stripe", () => ({
  stripeService: {
    createPaymentIntent: jest.fn(),
  },
}));

const { stripeService } = jest.requireMock("@/lib/integrations/stripe");

describe("paymentRouter.createPaymentIntent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("creates payment intent for owned appointment with valid fee", async () => {
    const { ctx, singleMock } = createMockCtx();

    // 1) Mock appointment lookup (owned by user with valid fee and patient)
    const appointmentData = {
      id: "appt-1",
      clinic_id: "clinic-1",
      patient_id: "patient-1",
      consultation_fee: 50,
      patients: [{ id: "patient-1", user_id: "user-1", chas_card_type: "none" }],
    };
    singleMock
      // First single() for appointment
      .mockResolvedValueOnce({
        data: appointmentData,
        error: null,
      } as SupabaseResponse<typeof appointmentData>)
      // Second single() for payments insert (id only)
      .mockResolvedValueOnce({
        data: { id: "pay-1" },
        error: null,
      } as SupabaseResponse<{ id: string }>);

    // 2) Mock Stripe PaymentIntent creation
    (stripeService.createPaymentIntent as jest.Mock).mockResolvedValueOnce({
      id: "pi_123",
      client_secret: "secret_123",
    });

    const caller = paymentRouter.createCaller({
      supabase: ctx.supabase,
      user: ctx.user,
      session: ctx.session,
    } as any);

    const input: CreatePaymentInput = { appointmentId: "appt-1" };
    const result = (await caller.createPaymentIntent(
      input,
    )) as CreatePaymentOutput;

    expect(result.clientSecret).toBe("secret_123");
    expect(result.originalAmount).toBe(50);
    expect(result.totalAmount).toBeGreaterThan(0);

    // Ensure Stripe called with correct metadata wiring
    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
      expect.any(Number),
      "sgd",
      expect.objectContaining({
        appointmentId: "appt-1",
        paymentId: "pay-1",
        patientId: "patient-1",
      }),
    );
  });

  test("throws NOT_FOUND when appointment not found or not owned", async () => {
    const { ctx, singleMock } = createMockCtx();

    // Appointment lookup returns null
    singleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found", code: "PGRST116" },
    } as SupabaseResponse<null>);

    const caller = paymentRouter.createCaller({
      supabase: ctx.supabase,
      user: ctx.user,
      session: ctx.session,
    } as any);

    await expect(
      caller.createPaymentIntent({
        appointmentId: "non-existent",
      } as CreatePaymentInput),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: "NOT_FOUND",
    });
  });

  test("throws BAD_REQUEST when no payment is required", async () => {
    const { ctx, singleMock } = createMockCtx();

    const appointmentData = {
      id: "appt-2",
      clinic_id: "clinic-1",
      patient_id: "patient-1",
      consultation_fee: 0,
      patients: [{ id: "patient-1", user_id: "user-1", chas_card_type: "none" }],
    };
    singleMock.mockResolvedValueOnce({
      data: appointmentData,
      error: null,
    } as SupabaseResponse<typeof appointmentData>);

    const caller = paymentRouter.createCaller({
      supabase: ctx.supabase,
      user: ctx.user,
      session: ctx.session,
    } as any);

    await expect(
      caller.createPaymentIntent({
        appointmentId: "appt-2",
      } as CreatePaymentInput),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: "BAD_REQUEST",
    });
  });
});