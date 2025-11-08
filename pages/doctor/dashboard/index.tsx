// pages/doctor/dashboard/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { TodaySchedule } from "@/components/doctor/TodaySchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

function DoctorDashboardPage() {
  // const { data } = api.doctor.getDashboardSummary.useQuery(); // Data can be passed down

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-neutral-500">
          Here's an overview of your day, Dr. [Doctor's Name].
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Patients Waiting</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">3</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Appointments Left</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">8 / 15</p></CardContent>
        </Card>
        {/* ... other stat cards */}
      </div>
      <TodaySchedule />
    </div>
  );
}

export default function ProtectedDoctorDashboard() {
  // A more robust ProtectedRoute would accept a `role` prop
  return (
    <ProtectedRoute> 
      <DoctorLayout>
        <DoctorDashboardPage />
      </DoctorLayout>
    </ProtectedRoute>
  );
}
