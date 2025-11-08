// pages/doctor/schedule/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
// import { ScheduleCalendar } from "@/components/doctor/ScheduleCalendar";

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <DoctorLayout>
        <h1 className="text-3xl font-bold">Manage Schedule</h1>
        <div className="mt-8">
          {/* <ScheduleCalendar /> */}
          <p>(Placeholder for Schedule Calendar Component)</p>
        </div>
      </DoctorLayout>
    </ProtectedRoute>
  );
}
