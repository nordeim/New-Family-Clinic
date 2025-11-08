// components/doctor/TodaySchedule.tsx
"use client";
import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import dayjs from "dayjs";

export function TodaySchedule() {
  const { data, isLoading, error } = api.doctor.getDashboardSummary.useQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500">Could not load schedule.</p>;
  }
  
  if (!data || data.appointments.length === 0) {
    return <p>No appointments scheduled for today.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {data.appointments.map((appt) => (
            <li key={appt.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-semibold">{dayjs(appt.appointment_time, "HH:mm:ss").format("hh:mm A")}</p>
                <p className="text-neutral-600">{appt.patients?.users?.full_name ?? "Patient Name"}</p>
              </div>
              <span className="text-sm font-medium text-primary">{appt.status}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
