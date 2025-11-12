"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Admin Booking Leads Dashboard
 *
 * Purpose:
 * - Provide staff/admin with a simple view over booking.public_booking_requests:
 *   - See new leads coming from the public /booking page.
 *   - Filter by status.
 *   - Update status as they contact/confirm/cancel.
 *   - (Future) Link to real appointments once created.
 *
 * Notes:
 * - This is an internal tool; access control is enforced at the tRPC layer
 *   via adminProcedure in lib/trpc/middlewares/adminAuth.ts.
 * - UI is intentionally minimal and table-like for clarity and speed.
 */

const STATUS_OPTIONS = ["all", "new", "contacted", "confirmed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

export default function AdminBookingLeadsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new");
  const [limit, setLimit] = useState(50);

  // NOTE: admin router is mounted under appRouter as "admin" (ensure in server/api/root).
  const leadsQuery = api.admin.listPublicBookingRequests.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit,
  });

  const updateStatusMutation =
    api.admin.updatePublicBookingRequestStatus.useMutation();

  const refetch = () => {
    leadsQuery.refetch().catch(() => undefined);
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: nextStatus as
          | "new"
          | "contacted"
          | "confirmed"
          | "cancelled",
      });
      await refetch();
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status. Please try again.",
      );
    }
  };

  const leads = leadsQuery.data ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              Booking Leads
            </h1>
            <p className="text-[10px] text-slate-600">
              View and manage appointment requests submitted from the public
              booking page. Use this as your call-back queue to contact patients
              and confirm actual appointment slots.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex flex-col text-[8px] text-slate-600">
              Filter by status
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="mt-1 border border-slate-200 rounded-md px-2 py-1 text-[9px] bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all"
                      ? "All statuses"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-[8px] text-slate-600">
              Max rows
              <Input
                type="number"
                min={10}
                max={200}
                value={limit}
                onChange={(e) =>
                  setLimit(
                    Number.isNaN(Number(e.target.value))
                      ? 50
                      : Math.min(
                          200,
                          Math.max(10, Number(e.target.value)),
                        ),
                  )
                }
                className="mt-1 h-7 w-20 text-[9px]"
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="mt-4 sm:mt-5 h-7 text-[9px]"
            >
              Refresh
            </Button>
          </div>
        </header>

        {leadsQuery.isLoading && (
          <p className="text-[9px] text-slate-600">
            Loading leads...
          </p>
        )}

        {leadsQuery.isError && (
          <p className="text-[9px] text-red-600">
            Failed to load leads. Please check your connection or permissions.
          </p>
        )}

        {!leadsQuery.isLoading && leads.length === 0 && (
          <p className="text-[9px] text-slate-600">
            No booking leads found for the selected filter.
          </p>
        )}

        {leads.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[8px] font-semibold text-slate-700 px-2">
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Name</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Preferred Time</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {leads.map((lead: any) => (
              <Card
                key={lead.id}
                className="grid grid-cols-12 gap-2 items-center px-2 py-2 text-[8px]"
              >
                <div className="col-span-2 text-slate-600">
                  {new Date(lead.created_at).toLocaleString()}
                </div>
                <div className="col-span-2">{lead.name}</div>
                <div className="col-span-2">{lead.phone}</div>
                <div className="col-span-2 text-slate-600">
                  {lead.preferred_time_text}
                </div>
                <div className="col-span-2">
                  <span
                    className={`px-2 py-[2px] rounded-full ${
                      lead.status === "new"
                        ? "bg-blue-50 text-blue-700"
                        : lead.status === "contacted"
                        ? "bg-amber-50 text-amber-700"
                        : lead.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  {lead.status !== "contacted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[7px]"
                      onClick={() =>
                        handleStatusChange(lead.id, "contacted")
                      }
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {lead.status !== "confirmed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[7px]"
                      onClick={() =>
                        handleStatusChange(lead.id, "confirmed")
                      }
                    >
                      Mark Confirmed
                    </Button>
                  )}
                  {lead.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[7px] text-red-600 border-red-200"
                      onClick={() =>
                        handleStatusChange(lead.id, "cancelled")
                      }
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                <div className="col-span-12 mt-1 text-slate-600">
                  <span className="font-semibold">Reason:</span>{" "}
                  {lead.reason}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}