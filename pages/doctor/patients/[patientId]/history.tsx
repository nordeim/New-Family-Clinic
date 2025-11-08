// pages/doctor/patients/[patientId]/history.tsx
"use client";
import { useRouter } from "next/router";
import { api } from "@/lib/trpc/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PatientHistoryPage() {
  const router = useRouter();
  const { patientId } = router.query;
  
  const { data, isLoading } = api.consultation.getPatientHistory.useQuery(
    { patientId: patientId as string },
    { enabled: !!patientId }
  );

  return (
    <ProtectedRoute>
      <DoctorLayout>
        <h1 className="text-3xl font-bold">Patient Medical History</h1>
        <div className="mt-8">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div>(Placeholder for Timeline of Medical Records)</div>
          )}
        </div>
      </DoctorLayout>
    </ProtectedRoute>
  );
}
