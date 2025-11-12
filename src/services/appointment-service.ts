import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

/**
 * AppointmentService
 *
 * Responsibilities:
 * - Provide a thin, well-typed façade over the booking-related database logic.
 * - Hide direct SQL details from tRPC routers and React components.
 * - Orchestrate:
 *   - Patient resolution (for authenticated flows).
 *   - Slot lookup from clinic.appointment_slots.
 *   - Invocation of booking.create_booking(...) for concurrency-safe bookings.
 *   - Mapping of results/errors into clear domain responses.
 *
 * Notes:
 * - This service is intentionally conservative and minimal. It is designed to be
 *   a safe foundation aligned with the existing schema/migrations.
 * - Public/anonymous flows should NOT create full PHI records. They can create
 *   "booking requests" or leads, or remain as soft requests handled by staff.
 * - Authenticated flows (portal users) may leverage the full pipeline.
 */

/**
 * Domain types
 */

export const protectedBookingInputSchema = z.object({
  clinicId: z.string().uuid().optional(),
  slotId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  visitReason: z
    .string()
    .min(1, "Visit reason is required")
    .max(500, "Visit reason too long"),
  idempotencyKey: z
    .string()
    .min(1, "Idempotency key is required")
    .max(255),
});

export type ProtectedBookingInput = z.infer<typeof protectedBookingInputSchema>;

export const publicBookingInputSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(1).max(32),
  reason: z.string().min(4).max(500),
  preferredTime: z.string().min(1).max(200),
  contactPreference: z.enum(["whatsapp", "call", "either"]),
  idempotencyKey: z.string().min(1).max(255).optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingInputSchema>;

export type BookingStatus =
  | "success"
  | "pending"
  | "failed"
  | "conflict";

export interface BookingResult {
  status: BookingStatus;
  message: string;
  requestId?: string;
  appointmentId?: string;
  appointmentNumber?: string;
  idempotent?: boolean;
}

/**
 * Domain errors for mapping in tRPC layer.
 */

export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingError";
  }
}

export class SlotNotFoundError extends BookingError {
  constructor() {
    super("Selected slot no longer exists. Please choose another time.");
    this.name = "SlotNotFoundError";
  }
}

export class SlotUnavailableError extends BookingError {
  constructor() {
    super("Sorry, this slot has just been taken. Please choose another time.");
    this.name = "SlotUnavailableError";
  }
}

export class BookingInProgressError extends BookingError {
  constructor() {
    super(
      "A booking is already in progress for this slot. Please wait a moment or try a different time.",
    );
    this.name = "BookingInProgressError";
  }
}

/**
 * Internal helpers
 */

function getSupabase() {
  // Server-side admin client; NEVER expose to client.
  return createSupabaseAdminClient();
}

/**
 * Resolve patient for authenticated user.
 *
 * NOTE:
 * - This is a minimal implementation to keep behavior safe.
 * - It assumes a mapping from auth user id to clinic.users/clinic.patients exists
 *   or will be introduced. For now, it tries to find an existing patient record.
 */
async function resolvePatientForUser(opts: {
  userId: string;
  clinicId: string;
}): Promise<string | null> {
  const supabase = getSupabase();

  // Attempt to find an existing patient row for this user + clinic.
  const { data, error } = await supabase
    .from("clinic.patients")
    .select("id")
    .eq("clinic_id", opts.clinicId)
    .eq("user_id", opts.userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    // For now, surface as null and let caller decide; do not auto-create PHI
    // until the identity model is fully aligned.
    // eslint-disable-next-line no-console
    console.warn(
      "[AppointmentService] Failed to resolve patient for user",
      error.message,
    );
    return null;
  }

  return data?.id ?? null;
}

/**
 * Call booking.create_booking stored procedure to create a real appointment.
 *
 * This is used for authenticated flows where we:
 * - Know the clinicId
 * - Have a validated slotId
 * - Have (or can resolve) a patientId
 * - Have a trustworthy userId from the auth context
 */
async function callBookingProcedure(input: {
  idempotencyKey: string;
  userId: string;
  clinicId: string;
  slotId: string;
  patientId: string;
  visitReason: string;
}): Promise<BookingResult> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("booking.create_booking", {
    p_idempotency_key: input.idempotencyKey,
    p_user_id: input.userId,
    p_clinic_id: input.clinicId,
    p_slot_id: input.slotId,
    p_patient_id: input.patientId,
    p_visit_reason: input.visitReason,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[AppointmentService] booking.create_booking failed", error);
    throw new BookingError(
      "We could not complete your booking at this time. Please try again or call the clinic.",
    );
  }

  // The function returns a JSONB payload. We expect a shape like:
  // {
  //   status: 'success' | 'error' | 'conflict',
  //   code?: 'slot_not_found' | 'slot_unavailable' | 'in_progress',
  //   idempotent?: boolean,
  //   result?: { appointment_id: UUID, appointment_number: TEXT }
  // }

  const status = data?.status as string | undefined;
  const code = data?.code as string | undefined;
  const idempotent = Boolean(data?.idempotent);
  const result = (data?.result ?? {}) as {
    appointment_id?: string;
    appointment_number?: string;
  };

  if (status === "success") {
    return {
      status: "success",
      message: idempotent
        ? "You already have a confirmed appointment for this slot."
        : "Your appointment has been confirmed.",
      requestId: undefined,
      appointmentId: result.appointment_id,
      appointmentNumber: result.appointment_number,
      idempotent,
    };
  }

  if (status === "error" || status === "conflict") {
    if (code === "slot_not_found") {
      throw new SlotNotFoundError();
    }
    if (code === "slot_unavailable") {
      throw new SlotUnavailableError();
    }
    if (code === "in_progress") {
      throw new BookingInProgressError();
    }

    throw new BookingError(
      "We could not complete your booking. Please try again or contact the clinic.",
    );
  }

  // Unknown shape; treat as failure.
  throw new BookingError(
    "Unexpected response from booking system. Please try again later or call the clinic.",
  );
}

/**
 * AppointmentService facade.
 *
 * NOTE:
 * - Methods are static for simplicity and easy usage from tRPC routers.
 * - All database calls are server-side only.
 */
export class AppointmentService {
  /**
   * Get available slots for public/portal display.
   * Filters to future available slots; can be extended with doctor/date filters.
   */
  static async getAvailableSlots(input: {
    clinicId: string;
    doctorId?: string;
    date?: string;
  }) {
    const supabase = getSupabase();

    let query = supabase
      .from("clinic.appointment_slots")
      .select(
        "id, clinic_id, doctor_id, slot_date, slot_time, duration_minutes, is_available",
      )
      .eq("clinic_id", input.clinicId)
      .eq("is_available", true);

    if (input.doctorId) {
      query = query.eq("doctor_id", input.doctorId);
    }

    if (input.date) {
      query = query.eq("slot_date", input.date);
    }

    const { data, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[AppointmentService] getAvailableSlots query failed",
        error,
      );
      throw new BookingError(
        "Unable to load available slots at the moment. Please try again.",
      );
    }

    return data ?? [];
  }

  /**
   * Perform a real booking for an authenticated user using booking.create_booking.
   *
   * Preconditions (enforced by caller):
   * - ctx.session.user.id is available as userId.
   * - slotId comes from a trusted source (e.g., getAvailableSlots).
   */
  static async requestBookingForAuthenticatedUser(input: {
    userId: string;
    clinicId: string;
    slotId: string;
    patientId?: string;
    visitReason: string;
    idempotencyKey: string;
  }): Promise<BookingResult> {
    const parsed = protectedBookingInputSchema.parse({
      clinicId: input.clinicId,
      slotId: input.slotId,
      visitReason: input.visitReason,
      idempotencyKey: input.idempotencyKey,
    });

    const clinicId = parsed.clinicId ?? input.clinicId;
    if (!clinicId) {
      throw new BookingError("Clinic is not configured for booking.");
    }

    let patientId = input.patientId;

    if (!patientId) {
      const resolved = await resolvePatientForUser({
        userId: input.userId,
        clinicId,
      });
      if (!resolved) {
        throw new BookingError(
          "We could not find your patient profile. Please contact the clinic to complete your registration.",
        );
      }
      patientId = resolved;
    }

    return callBookingProcedure({
      idempotencyKey: parsed.idempotencyKey,
      userId: input.userId,
      clinicId,
      slotId: parsed.slotId,
      patientId,
      visitReason: parsed.visitReason,
    });
  }

  /**
   * Create a public booking request from the marketing /booking page.
   *
   * Behavior:
   * - Accepts minimal details from the public form.
   * - Persists them as a lead into booking.public_booking_requests.
   * - Returns a friendly confirmation message.
   * - Does NOT create real appointments / slots; staff/admin will follow up.
   *
   * This is safe for production and gives the clinic an operational queue.
   */
  static async createPublicBookingRequest(
    input: PublicBookingInput,
  ): Promise<BookingResult> {
    const parsed = publicBookingInputSchema.parse(input);
    const supabase = getSupabase();

    const { error } = await supabase
      .from("booking.public_booking_requests")
      .insert({
        name: parsed.name,
        phone: parsed.phone,
        contact_preference: parsed.contactPreference,
        preferred_time_text: parsed.preferredTime,
        reason: parsed.reason,
        source: "web",
        status: "new",
        idempotency_key: parsed.idempotencyKey ?? null,
      });

    if (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[AppointmentService] Failed to persist public booking request",
        error,
      );

      return {
        status: "failed",
        message:
          "We could not save your request due to a system issue. Please try again or call the clinic.",
      };
    }

    return {
      status: "pending",
      message:
        "Thank you. We’ve received your request. Our care team will contact you shortly to confirm your appointment.",
    };
  }
}