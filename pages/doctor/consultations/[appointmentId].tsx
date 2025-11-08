// pages/doctor/consultations/[appointmentId].tsx
"use client";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
// import { ConsultationForm } from "@/components/forms/ConsultationForm";
// import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
// import { MCForm } from "@/components/forms/MCForm";

export default function ConsultationPage() {
  const router = useRouter();
  const { appointmentId } = router.query;
  
  // Fetch patient history and current appointment details here

  return (
    <ProtectedRoute>
      <DoctorLayout>
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column: Patient History */}
          <div className="col-span-1">
            <h2 className="text-2xl font-semibold">Patient History</h2>
            <div className="mt-4">(Placeholder for Patient History Timeline)</div>
          </div>
          
          {/* Right Column: Consultation Forms */}
          <div className="col-span-2">
            <h2 className="text-2xl font-semibold">Consultation Notes</h2>
            <div className="mt-4 space-y-8">
              <div>{/* <ConsultationForm appointmentId={appointmentId} /> */} (Placeholder for Consultation Form)</div>
              <div>{/* <PrescriptionForm /> */} (Placeholder for Prescription Form)</div>
              <div>{/* <MCForm /> */} (Placeholder for MC Form)</div>
            </div>
          </div>
        </div>
      </DoctorLayout>
    </ProtectedRoute>
  );
}
