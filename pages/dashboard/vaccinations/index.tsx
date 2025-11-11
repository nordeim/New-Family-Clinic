// pages/dashboard/vaccinations/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * pages/dashboard/vaccinations/index.tsx
 *
 * NOTE:
 * - The `health` tRPC router does not yet expose `getPatientVaccinations`.
 * - To keep types and build clean, this page renders a static placeholder and
 *   does not call a non-existent procedure.
 * - When the endpoint is implemented in `lib/trpc/routers/health.router.ts`,
 *   wire it back here using `api.health.getPatientVaccinations.useQuery()`.
 */
export default function VaccinationsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold">My Vaccination Records</h1>
        <div className="mt-8 space-y-4">
          <p className="text-gray-600">
            Vaccination history is coming soon. This page is intentionally static until
            a typed tRPC endpoint is implemented and connected.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
