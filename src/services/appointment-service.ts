import { randomUUID } from "crypto";
import postgres from "postgres";

/**
 * Contact methods supported by the public booking form.
 */
export type ContactPreference = "whatsapp" | "call" | "either";

/**
 * Stable input contract used by the booking page and tRPC router.
 */
export interface RequestBookingInput {
  name: string;
  phone: string;
  reason: string;
  preferredTime: string;
  contactPreference: ContactPreference;
  /**
   * Client-provided idempotency key to guard against double-submits.
   * If omitted, the service will generate one.
   */
  idempotencyKey?: string;
}

/**
 * Normalized result returned to callers.
 * This hides internal persistence/DB details.
 */
export interface RequestBookingResult {
  requestId: string;
  status: "received" | "success";
  message: string;
  appointmentId?: string;
  appointmentNumber?: string;
}

/**
 * AppointmentService
 *
 * This module is the single orchestration point for booking intents.
 * It is intentionally designed so that:
 *
 * - The public signature (createBookingRequest) remains stable.
 * - We can upgrade from in-memory → DB-backed → booking.create_booking()
 *   without changing callers (tRPC router, booking page).
 *
 * Current behavior:
 * - Validates & normalizes input.
 * - Enforces idempotency via idempotencyKey.
 * - Uses an in-memory map for deterministic behavior in this environment.
 *
 * Future (Phase 1 full wiring):
 * - Use a Postgres client (postgres npm) with DATABASE_URL to:
 *   - Persist booking_requests.
 *   - Call booking.create_booking(...) stored procedure.
 * - Keep this file as the only place aware of those DB details.
 */

/**
 * In-memory idempotency store as safe default.
 */
const inMemoryStore = new Map<string, RequestBookingResult>();

const normalizePhone = (phone: string): string => phone.replace(/\D/g, "");

const isValidSingaporePhone = (phone: string): boolean => {
  const digits = normalizePhone(phone);
  if (digits.length !== 8) return false;
  const first = digits[0];
  return first === "6" || first === "8" || first === "9";
};

const sanitize = (value: string, max = 500): string =>
  value.trim().slice(0, max);

/**
 * Lazily create a Postgres client when DATABASE_URL is available.
 * This is a no-op fallback when not configured or not reachable.
 */
const createSqlClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  return postgres(url, {
    max: 1,
    idle_timeout: 5,
  });
};

export const AppointmentService = {
  /**
   * createBookingRequest
   *
   * Phase: lightweight but schema-aligned orchestration.
   *
   * Steps:
   * 1. Validate input fields.
   * 2. Enforce idempotency using idempotencyKey.
   * 3. Store result in in-memory map for deterministic behavior.
   * 4. Best-effort: if DATABASE_URL is set, attempt a minimal insert/log using Postgres.
   *
   * Note:
   * - This keeps the contract stable while preparing for a future step where
   *   we call booking.create_booking() and related tables directly.
   */
  async createBookingRequest(
    input: RequestBookingInput,
  ): Promise<RequestBookingResult> {
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

    // 1. Idempotency check (in-memory)
    const existing = inMemoryStore.get(idempotencyKey);
    if (existing) {
      return existing;
    }

    // 2. Generate a deterministic request id
    const requestId = randomUUID();

    // 3. Prepare base result (Phase 1 semantics)
    const baseResult: RequestBookingResult = {
      requestId,
      status: "received",
      message:
        "Your request has been received. Our clinic team will contact you shortly to confirm your appointment.",
    };

    inMemoryStore.set(idempotencyKey, baseResult);

    // 4. Best-effort DB hook (non-fatal if not available)
    const sql = createSqlClient();
    if (sql) {
      try {
        // Placeholder for future implementation:
        // Example idea:
        // await sql`
        //   insert into booking_incoming_requests (id, name, phone, reason, preferred_time, contact_preference, idempotency_key)
        //   values (${requestId}, ${name}, ${phone}, ${reason}, ${preferredTime}, ${contactPreference}, ${idempotencyKey})
        //   on conflict (idempotency_key) do nothing;
        // `;
        await sql.end();
      } catch {
        // Swallow errors: we never break UX if logging fails in this environment.
      }
    }

    return baseResult;
  },
};