import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AppointmentService } from "~/services/appointment-service";

/**
 * Zod schema for booking requests.
 * Strict but user-friendly; matches Phase 1+2 UX copy.
 */
const requestBookingInput = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  phone: z
    .string()
    .min(1, "Mobile number is required")
    .max(32),
  reason: z
    .string()
    .min(4, "Tell us briefly why you are visiting")
    .max(500),
  preferredTime: z
    .string()
    .min(1, "Preferred date/time is required")
    .max(200),
  contactPreference: z.enum(["whatsapp", "call", "either"]),
  idempotencyKey: z
    .string()
    .min(1)
    .max(255)
    .optional(),
});

export const appointmentRouter = createTRPCRouter({
  /**
   * requestBooking
   *
   * Phase 2 (lightweight real flow):
   * - Accepts a simple booking intent payload.
   * - Delegates to AppointmentService (currently in-memory/idempotent).
   * - Returns a stable response that the UI can rely on.
   *
   * Future:
   * - Swap AppointmentService implementation to call real DB / booking.create_booking
   *   without changing this public contract.
   */
  requestBooking: publicProcedure
    .input(requestBookingInput)
    .mutation(async ({ input }) => {
      try {
        const result = await AppointmentService.createBookingRequest(input);
        return {
          requestId: result.requestId,
          status: result.status,
          message: result.message,
        };
      } catch (error) {
        // Normalize error message; avoid leaking internals
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Unable to process your request at the moment. Please try again or call the clinic.";
        // Let tRPC map this as a BAD_REQUEST-style error
        throw new Error(message);
      }
    }),
});