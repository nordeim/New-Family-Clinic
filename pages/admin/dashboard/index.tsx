// pages/admin/dashboard/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MetricCard } from "@/components/admin/MetricCard";
import { api } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Users, Calendar, DollarSign } from "lucide-react";

function AdminDashboardPage() {
  const { data, isLoading } = api.admin.getDashboardMetrics.useQuery();

  if (isLoading) {
    return <LoadingSpinner size={36} />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Patients"
          value={data?.totalPatients ?? 0}
          icon={Users}
          change="+2.1%"
        />
        <MetricCard
          title="Appointments Today"
          value={data?.totalAppointmentsToday ?? 0}
          icon={Calendar}
          change="-0.5%"
        />
        <MetricCard
          title="Revenue (This Month)"
          value="$0"
          icon={DollarSign}
          change="+0.0%"
        />
      </div>
      <div className="mt-8">
        {/* Placeholder for charts */}
        <h2 className="text-2xl font-semibold">Activity Overview</h2>
        <div className="p-8 mt-4 border rounded-lg bg-neutral-50">
          (Placeholder for Appointment Trends Chart)
        </div>
      </div>
    </div>
  );
}

export default function ProtectedAdminDashboard() {
  // A future ProtectedRoute could accept a `roles` prop for cleaner checks
  return (
    <ProtectedRoute>
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    </ProtectedRoute>
  );
}
