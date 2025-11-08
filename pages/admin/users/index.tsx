// pages/admin/users/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserTable } from "@/components/admin/UserTable";

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-neutral-500">
            View, create, and manage all users on the platform.
          </p>
          <div className="mt-6">
            <UserTable />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
