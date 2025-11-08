// components/admin/UserTable.tsx
"use client";
import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
// Table components from a library like TanStack Table would be imported here

export function UserTable() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const { data, isLoading, error } = api.admin.getUsers.useQuery({
    page,
    filter,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / 10);

  // TanStack Table setup (useTable, getHeaderGroups, etc.) would go here

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">Failed to load users.</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          placeholder="Search by name..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button>Create User</Button>
      </div>
      
      {/* Table rendering would go here */}
      <div className="border rounded-lg">
        <p className="p-4"> (Placeholder for TanStack React Table)</p>
        <p className="p-4"> {users.length} users found.</p>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
          Previous
        </Button>
        <span>Page {page} of {pageCount}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount, p+1))} disabled={page === pageCount}>
          Next
        </Button>
      </div>
    </div>
  );
}
