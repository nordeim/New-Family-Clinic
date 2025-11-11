import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { AppointmentService } from "~/services/appointment-service";

/**
 * Zod schema for booking requests.
 * Strict but user-friendly; matches the booking page UX.
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
   * Public booking intent endpoint used by the /booking page.
   * Current behavior:
   * - Validates payload.
   * - Delegates to AppointmentService, which handles idempotency and orchestration.
   * - Returns a stable, UI-focused response.
   *
   * Future:
   * - AppointmentService will be upgraded to call the real DB pipeline
   *   (booking_requests + booking.create_booking()) without changing this contract.
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
          appointmentId: result.appointmentId,
          appointmentNumber: result.appointmentNumber,
        };
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Unable to process your request at the moment. Please try again or call the clinic.";

        // Normalize as a BAD_REQUEST so the client can handle gracefully.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }
    }),
});