import { randomUUID } from "crypto";

export type ContactPreference = "whatsapp" | "call" | "either";

export interface RequestBookingInput {
  name: string;
  phone: string;
  reason: string;
  preferredTime: string;
  contactPreference: ContactPreference;
  idempotencyKey?: string;
}

export interface RequestBookingResult {
  requestId: string;
  status: "received";
  message: string;
}

/**
 * AppointmentService
 *
 * Phase 2 (lightweight):
 * - Provides a real, typed entry point for creating booking requests.
 * - Currently uses an in-memory store to simulate persistence.
 * - Designed so we can later swap implementation to call:
 *   - database booking_requests table
 *   - booking.create_booking() stored procedure
 *   - without changing caller code.
 *
 * Notes:
 * - This keeps changes low-risk while enabling real tRPC + tests wiring.
 * - Idempotency is enforced by idempotencyKey.
 */

const inMemoryStore = new Map<string, RequestBookingResult>();

const normalizePhone = (phone: string): string =>
  phone.replace(/\D/g, "");

const isValidSingaporePhone = (phone: string): boolean => {
  const digits = normalizePhone(phone);
  if (digits.length !== 8) return false;
  const first = digits[0];
  return first === "6" || first === "8" || first === "9";
};

const sanitize = (value: string, max = 500): string =>
  value.trim().slice(0, max);

export const AppointmentService = {
  async createBookingRequest(input: RequestBookingInput): Promise<RequestBookingResult> {
    const name = sanitize(input.name, 120);
    const phone = normalizePhone(input.phone);
    const reason = sanitize(input.reason, 500);
    const preferredTime = sanitize(input.preferredTime, 200);
    const contactPreference = input.contactPreference;

    if (!name) {
      throw new Error("Name is required");
    }
    if (!isValidSingaporePhone(phone)) {
      throw new Error("Invalid Singapore mobile number");
    }
    if (!reason || reason.length < 4) {
      throw new Error("Reason is too short");
    }
    if (!preferredTime) {
      throw new Error("Preferred time is required");
    }
    if (!["whatsapp", "call", "either"].includes(contactPreference)) {
      throw new Error("Invalid contact preference");
    }

    const idempotencyKey = input.idempotencyKey || randomUUID();

    const existing = inMemoryStore.get(idempotencyKey);
    if (existing) {
      return existing;
    }

    const requestId = randomUUID();

    const result: RequestBookingResult = {
      requestId,
      status: "received",
      message:
        "Your request has been received. Our clinic team will contact you shortly to confirm your appointment.",
    };

    inMemoryStore.set(idempotencyKey, result);

    return result;
  },
};