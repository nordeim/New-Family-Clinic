// @/components/doctor/TodaySchedule.tsx

"use client";

import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Link from "next/link";
import { Badge } from "@/components/ui/badge"; // Use lowercase filename to match on-disk module
import { cn } from "@/lib/utils";

// Extend dayjs with the plugin needed to parse time strings like "10:30:00"
dayjs.extend(customParseFormat);

/**
 * A skeleton loader component to provide a good perceived performance
 * while the schedule data is being fetched.
 */
function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-md border p-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * A key dashboard component for doctors, showing a summary of their appointments for the current day.
 */
export function TodaySchedule() {
  const { data, isLoading, error } = api.doctor.getDashboardSummary.useQuery();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ScheduleSkeleton />
        ) : error ? (
          <div className="text-center text-red-500">
            <p>Could not load schedule.</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : !data || data.appointments.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <p>No appointments scheduled for today.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.appointments.map((appt) => (
              <li key={appt.id}>
                <Link
                  href={`/doctor/consultations/${appt.id}`}
                  className="block rounded-lg border p-3 transition-all hover:bg-neutral-50 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="font-semibold text-primary">
                        {dayjs(appt.appointment_time, "HH:mm:ss").format("hh:mm A")}
                      </p>
                      <p className="text-neutral-700 font-medium">
                        {appt.patients?.users?.full_name ?? "Patient Name Missing"}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(appt.status)}>
                      {appt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Assuming a Badge component exists at @/components/ui/Badge.tsx
// If not, here is a basic implementation:
/*
// @/components/ui/Badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-green-500 text-white",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
*/
