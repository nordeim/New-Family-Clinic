import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  AppointmentService,
  publicBookingInputSchema,
  protectedBookingInputSchema,
  BookingError,
  SlotNotFoundError,
  SlotUnavailableError,
  BookingInProgressError,
} from "~/services/appointment-service";

/**
 * Router: appointmentRouter
 *
 * Exposes:
 * - requestBookingPublic: Public booking request from /booking (no real slot assignment yet).
 * - getAvailableSlots: List available appointment slots (for future authenticated flows).
 * - requestBooking: Authenticated real booking using booking.create_booking (future-ready).
 */
export const appointmentRouter = createTRPCRouter({
  /**
   * Public booking request from marketing /booking page.
   *
   * Behavior:
   * - Validates payload (matches BookingPage UX).
   * - Delegates to AppointmentService.createPublicBookingRequest.
   * - Returns a friendly, non-sensitive confirmation message.
   *
   * This does NOT create a real appointment/slot yet; it is safe for anonymous users.
   */
  requestBookingPublic: publicProcedure
    .input(publicBookingInputSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await AppointmentService.createPublicBookingRequest(input);

        return {
          status: result.status,
          message: result.message,
        };
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Unable to process your request at the moment. Please try again or call the clinic.";

        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }
    }),

  /**
   * Get available appointment slots.
   *
   * For now:
   * - Publicly readable list of available slots for a given clinic/doctor/date.
   * - Uses AppointmentService.getAvailableSlots (server-side).
   *
   * This is a building block for a richer authenticated booking flow.
   */
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        clinicId: z.string().uuid(),
        doctorId: z.string().uuid().optional(),
        date: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await AppointmentService.getAvailableSlots(input);
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Unable to load available slots at the moment. Please try again.";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  /**
   * Authenticated real booking endpoint (future-ready).
   *
   * Preconditions:
   * - User is authenticated (protectedProcedure).
   * - Client provides slotId and visitReason; clinicId may be derived from config.
   *
   * Behavior:
   * - Resolves/validates patient context.
   * - Calls booking.create_booking via AppointmentService.requestBookingForAuthenticatedUser.
   * - Maps domain errors into typed tRPC errors.
   */
  requestBooking: protectedProcedure
    .input(
      protectedBookingInputSchema.extend({
        clinicId: protectedBookingInputSchema.shape.clinicId.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to book an appointment.",
        });
      }

      const idempotencyKey =
        input.idempotencyKey ??
        `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      try {
        const result =
          await AppointmentService.requestBookingForAuthenticatedUser({
            userId,
            clinicId: input.clinicId ?? "",
            slotId: input.slotId,
            patientId: input.patientId,
            visitReason: input.visitReason,
            idempotencyKey,
          });

        return {
          status: result.status,
          message: result.message,
          appointmentId: result.appointmentId,
          appointmentNumber: result.appointmentNumber,
          idempotent: result.idempotent,
        };
      } catch (error) {
        if (error instanceof SlotNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof SlotUnavailableError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        if (error instanceof BookingInProgressError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        if (error instanceof BookingError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        // Fallback for unexpected errors
        const message =
          error instanceof Error && error.message
            ? error.message
            : "We could not complete your booking. Please try again or contact the clinic.";

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});