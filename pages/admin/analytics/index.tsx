// pages/admin/analytics/index.tsx (Updated)

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Skeleton } from "@/components/ui/Skeleton"; // Import the new Skeleton component
import dynamic from "next/dynamic";

// Dynamically import the chart components. They will only be loaded on the client-side.
const PatientDemographicsChart = dynamic(
  () => import("@/components/analytics/PatientDemographicsChart"),
  { 
    ssr: false, // This component will not be rendered on the server
    loading: () => <Skeleton className="h-[300px] w-full" /> // Show a skeleton loader while it's loading
  }
);

const AppointmentTrendsChart = dynamic(
  () => import("@/components/analytics/AppointmentTrendsChart"),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
);

export default function AnalyticsDashboardPage() {
  // const { data: demographicsData } = api.reports.getPatientDemographicsReport.useQuery();
  // const { data: trendsData } = api.reports.getAppointmentTrendsReport.useQuery();

  return (
    <ProtectedRoute>
      <AdminLayout>
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold">Patient Demographics</h2>
            <PatientDemographicsChart /* data={demographicsData} */ />
          </div>
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold">Appointment Trends</h2>
            <AppointmentTrendsChart /* data={trendsData} */ />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
