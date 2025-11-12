/**
 * config/clinic.ts
 *
 * Centralized clinic-level configuration.
 *
 * For the current single-clinic deployment, we maintain a single DEFAULT_CLINIC_ID.
 * In future multi-clinic scenarios, this should be replaced with:
 * - A dynamic lookup based on hostname / tenant_code, or
 * - A per-user clinic selection mechanism.
 *
 * NOTE:
 * - This value MUST be aligned with the `clinic.clinics.id` in your database.
 * - In local/dev, set this to the seeded clinic's UUID.
 * - Do NOT hardcode production IDs in code for public repos; use environment variables
 *   or an indirection if necessary.
 */

// TODO: Replace with the actual primary clinic UUID from your seeded database.
export const DEFAULT_CLINIC_ID = process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID ?? "";