# components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "hooks": "~/hooks"
  },
  "registries": {}
}

```

# components/admin/AdminLayout.tsx
```tsx
// components/admin/AdminLayout.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building,
  BarChart3,
  Settings,
} from "lucide-react";
import React from "react";

const sidebarNavItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Clinics", href: "/admin/clinics", icon: Building },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 flex-col border-r bg-neutral-50 md:flex">
        <nav className="flex flex-col gap-2 p-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-all hover:bg-neutral-200",
                router.pathname.startsWith(item.href) && "bg-primary/10 text-primary font-semibold"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-white p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

```

# components/admin/MetricCard.tsx
```tsx
// components/admin/MetricCard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string; // e.g., "+5.2%" or "-1.8%"
  icon: React.ElementType;
}

export function MetricCard({ title, value, change, icon: Icon }: MetricCardProps) {
  const isPositive = change && change.startsWith("+");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs text-neutral-500 flex items-center",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

```

# components/admin/UserTable.tsx
```tsx
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

```

# components/analytics/AppointmentTrendsChart.tsx
```tsx
// components/analytics/AppointmentTrendsChart.tsx
import * as React from "react";

/**
 * Minimal placeholder for AppointmentTrendsChart.
 * Keeps the admin analytics page compiling while you restore the real chart implementation.
 * Replace with the real chart implementation (e.g., Recharts / Chart.js / ApexCharts) when ready.
 */
export function AppointmentTrendsChart() {
  return (
    <div className="rounded-md border p-4">
      <h3 className="font-semibold">Appointment trends</h3>
      <p className="text-sm text-neutral-600">Chart placeholder — implement real chart when ready.</p>
    </div>
  );
}

export default AppointmentTrendsChart;

```

# components/analytics/PatientDemographicsChart.tsx
```tsx
// components/analytics/PatientDemographicsChart.tsx
import * as React from "react";

export function PatientDemographicsChart() {
  // Minimal placeholder; replace with the real chart implementation.
  return (
    <div className="rounded-md border p-4">
      <h3 className="font-semibold">Patient demographics</h3>
      <p className="text-sm text-neutral-600">Chart placeholder — implement real chart when ready.</p>
    </div>
  );
}

export default PatientDemographicsChart;

```

# components/appointment/BookingForm.tsx
```tsx
// @/components/appointment/BookingForm.tsx
"use client";
import { useBookingStore } from "@/hooks/use-booking-store";
// import { DoctorSelection } from './DoctorSelection';
// import { TimeSlotPicker } from './TimeSlotPicker';

export function BookingForm() {
  const step = useBookingStore((state) => state.step);

  return (
    <div>
      {step === 1 && <div>Step 1: Select Clinic (Placeholder)</div>}
      {step === 2 && <div>Step 2: Select Doctor (Placeholder)</div> /* <DoctorSelection /> */}
      {step === 3 && <div>Step 3: Select Time (Placeholder)</div> /* <TimeSlotPicker /> */}
      {step === 4 && <div>Step 4: Confirm Details (Placeholder)</div>}
    </div>
  );
}

```

# components/auth/ProtectedRoute.tsx
```tsx
// @/components/auth/ProtectedRoute.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  // This will be shown for a brief moment before the redirect happens.
  return null;
}

```

# components/common/SkipLink.tsx
```tsx
// components/common/SkipLink.tsx

import React from 'react';

export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:border-2 focus:border-primary focus:rounded-lg"
    >
      Skip to main content
    </a>
  );
}

```

# components/doctor/DoctorLayout.tsx
```tsx
// components/doctor/DoctorLayout.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Users } from "lucide-react";
import React from "react";

const sidebarNavItems = [
  { title: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { title: "Schedule", href: "/doctor/schedule", icon: Calendar },
  { title: "Patients", href: "/doctor/patients", icon: Users },
];

export function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 flex-col border-r bg-neutral-50 md:flex">
        <nav className="flex flex-col gap-2 p-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-all hover:bg-neutral-200",
                router.pathname === item.href && "bg-primary/10 text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 bg-white p-4 md:p-8">{children}</div>
    </div>
  );
}

```

# components/doctor/TodaySchedule.tsx
```tsx
// @/components/doctor/TodaySchedule.tsx

"use client";

import { api } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Link from "next/link";
import { Badge } from "@/components/ui/badge"; // Use lowercase filename to match on-disk module

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

  const extractPatientName = (patients: unknown): string | undefined => {
    if (Array.isArray(patients)) {
      const first = patients[0];
      if (first && typeof first === "object" && "users" in first) {
        const users = (first as Record<string, unknown>).users;
        if (Array.isArray(users)) {
          const u0 = users[0];
          if (u0 && typeof u0 === "object" && "full_name" in u0) return String((u0 as Record<string, unknown>).full_name);
        } else if (users && typeof users === "object" && "full_name" in users) {
          return String((users as Record<string, unknown>).full_name);
        }
      }
      return undefined;
    }

    if (patients && typeof patients === "object" && "users" in patients) {
      const users = (patients as Record<string, unknown>).users;
      if (Array.isArray(users)) {
        const u0 = users[0];
        if (u0 && typeof u0 === "object" && "full_name" in u0) return String((u0 as Record<string, unknown>).full_name);
      } else if (users && typeof users === "object" && "full_name" in users) {
        return String((users as Record<string, unknown>).full_name);
      }
    }

    return undefined;
  };

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
            {data.appointments.map((appt) => {
              // appt.patients can be returned from Supabase as an array or as an object
              // depending on how the select() is written. Normalize safely here.
              const patientName = extractPatientName(appt.patients);

              return (
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
                          {patientName ?? "Patient Name Missing"}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(appt.status)}>
                        {appt.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
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

```

# components/feedback/FeedbackWidget.tsx
```tsx
// @/components/feedback/FeedbackWidget.tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@mantine/core";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { Textarea } from "@/components/ui/textarea"; // Use canonical lowercase path
import { StarRating } from "@/components/ui/StarRating"; // Assuming this component exists
import { getMutationLoading } from "@/lib/utils";

export function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitMutation = api.feedback.submitFeedback.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      // Reset after a delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setRating(0);
        setFeedbackText("");
      }, 3000);
    },
  });

  // Only render the widget if the user is logged in
  if (!user) {
    return null;
  }

  const handleSubmit = () => {
    submitMutation.mutate({
      rating: rating > 0 ? rating : undefined,
      feedbackText: feedbackText || undefined,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    });
  };

  return (
    <>
      <Button
        aria-label="Give feedback"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageSquare />
      </Button>

      <Modal opened={isOpen} onClose={() => setIsOpen(false)} title="Share Your Feedback" centered>
        {isSubmitted ? (
          <div className="text-center py-8">
            <h3 className="font-semibold text-lg">Thank you!</h3>
            <p className="text-neutral-600 mt-2">Your feedback helps us improve.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="font-medium">How would you rate your experience?</label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            <div>
              <label htmlFor="feedback-text" className="font-medium">
                Any additional comments?
              </label>
              <Textarea
                id="feedback-text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think..."
                rows={4}
              />
            </div>
            {submitMutation.error && (
              <p className="text-sm text-red-500">{submitMutation.error.message}</p>
            )}
            <Button
              className="w-full"
              onClick={handleSubmit}
              isLoading={getMutationLoading(submitMutation)}
            >
              Submit Feedback
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

```

# components/forms/PatientRegistrationForm.tsx
```tsx
// @/components/forms/PatientRegistrationForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  patientRegistrationSchema,
  type PatientRegistrationSchema,
} from "@/types/zod-schemas";
import { signup } from "@/lib/auth/actions";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function PatientRegistrationForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientRegistrationSchema>({
    resolver: zodResolver(patientRegistrationSchema),
  });

  const onSubmit = async (data: PatientRegistrationSchema) => {
    setFormError(null);
    const result = await signup(data);
    if (result.error) {
      setFormError(result.error);
    } else {
      setIsSuccess(true);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-semibold">Registration Successful!</h3>
        <p className="mt-2 text-neutral-600">
          Please check your email to verify your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* NRIC Field */}
      <div className="space-y-2">
        <Label htmlFor="nric">NRIC</Label>
        <Input id="nric" {...register("nric")} />
        {errors.nric && <p className="text-sm text-red-500">{errors.nric.message}</p>}
      </div>

      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name (as per NRIC)</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* ... Other fields for Email, Phone, DOB, Password, Confirm Password ... */}
      
      {formError && <p className="text-sm text-red-500">{formError}</p>}
      
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create Account
      </Button>
    </form>
  );
}

```

# components/layout/Footer.tsx
```tsx
// @/components/layout/Footer.tsx
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <p className="text-sm text-neutral-500">
          &copy; {currentYear} Gabriel Family Clinic. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/terms" className="text-neutral-500 hover:text-primary">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-neutral-500 hover:text-primary">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

```

# components/layout/Header.tsx
```tsx
// @/components/layout/Header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl text-primary">
            GFC v2.0
          </Link>
          {/* Future navigation links will go here */}
        </div>
        <div>
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          {/* This will later be a conditional user navigation dropdown */}
        </div>
      </div>
    </header>
  );
}

```

# components/layout/Layout.tsx
```tsx
// @/components/layout/Layout.tsx

import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipLink } from "@/components/common/SkipLink";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * The main layout wrapper for the entire application.
 * It combines the Header, Footer, and main content area to ensure a
 * consistent structure on every page. It also includes an accessibility
 * "Skip to main content" link.
 * @param {LayoutProps} props - The component props.
 * @param {React.ReactNode} props.children - The page content to be rendered inside the layout.
 * @returns A React component.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <SkipLink targetId="main-content" />
      
      <Header />

      <main 
        id="main-content" 
        className="flex-1 w-full"
        // Add tabIndex to make it programmatically focusable for the skip link
        tabIndex={-1} 
        style={{ outline: 'none' }}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}

```

# components/payment/CheckoutForm.tsx
```tsx
// components/payment/CheckoutForm.tsx
"use client";
import { useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { api } from "@/lib/trpc/client";
import { getMutationLoading } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PaymentForm } from "./PaymentForm";
import { PriceBreakdown } from "./PriceBreakdown";
import { env } from "@/env";

// Load Stripe once outside of the component to avoid recreating it on every render.
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

interface CheckoutFormProps {
  appointmentId: string;
}

export function CheckoutForm({ appointmentId }: CheckoutFormProps) {
  const createPaymentIntent = api.payment.createPaymentIntent.useMutation();

  const { data, error } = {
    data: createPaymentIntent.data,
    error: createPaymentIntent.error,
  };
  const isCreatingIntent = getMutationLoading(createPaymentIntent);

  useEffect(() => {
    // Automatically create the payment intent when the component mounts
    if (appointmentId) {
      createPaymentIntent.mutate({ appointmentId });
    }
  }, [appointmentId, createPaymentIntent]);
  
  const { clientSecret, totalAmount, subsidyAmount, originalAmount } = data ?? {};

  const options = clientSecret ? { clientSecret } : undefined;

  if (isCreatingIntent) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }
  
  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      {totalAmount != null && (
        <PriceBreakdown 
          originalAmount={originalAmount!}
          subsidyAmount={subsidyAmount!}
          totalAmount={totalAmount!}
        />
      )}
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <PaymentForm totalAmount={totalAmount!} />
        </Elements>
      )}
    </div>
  );
}

```

# components/payment/PaymentForm.tsx
```tsx
// components/payment/PaymentForm.tsx
"use client";
import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";

interface PaymentFormProps {
  totalAmount: number;
}

export function PaymentForm({ totalAmount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/payments/success`,
      },
    });

    // This point will only be reached if there is an immediate error. Otherwise, the user
    // is redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setErrorMessage(error.message ?? "An unexpected error occurred.");
    } else {
      setErrorMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && <div className="text-sm text-red-500">{errorMessage}</div>}
      <Button
        className="w-full"
        isLoading={isLoading}
        disabled={!stripe || !elements}
        size="lg"
      >
        Pay S${totalAmount.toFixed(2)}
      </Button>
    </form>
  );
}

```

# components/payment/PriceBreakdown.tsx
```tsx
// components/payment/PriceBreakdown.tsx
interface PriceBreakdownProps {
  originalAmount: number;
  subsidyAmount: number;
  totalAmount: number;
}

export function PriceBreakdown({ originalAmount, subsidyAmount, totalAmount }: PriceBreakdownProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(amount);

  return (
    <div className="space-y-2 rounded-lg border bg-neutral-50 p-4">
      <div className="flex justify-between">
        <span>Consultation Fee</span>
        <span>{formatCurrency(originalAmount)}</span>
      </div>
      {subsidyAmount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>CHAS Subsidy</span>
          <span>- {formatCurrency(subsidyAmount)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-2 font-bold text-lg">
        <span>Total Payable</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}

```

# components/telemedicine/VideoCall.tsx
```tsx
// components/telemedicine/VideoCall.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertCircle } from "lucide-react";

interface VideoCallProps {
  roomUrl: string;
  displayName: string; // The user's name to display in the call
}

export function VideoCall({ roomUrl, displayName }: VideoCallProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const [callState, setCallState] = useState<"loading" | "joined" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!videoContainerRef.current) return;

    const frame = DailyIframe.createFrame(videoContainerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        position: "absolute",
        width: "100%",
        height: "100%",
        border: "0",
      },
    });
    callFrameRef.current = frame;

    const handleJoined = () => setCallState("joined");
    const extractErrorMessage = (e: unknown) => {
      if (e instanceof Error) return e.message;
      if (typeof e === "object" && e !== null && "errorMsg" in e) {
        const v = (e as Record<string, unknown>).errorMsg;
        return typeof v === "string" ? v : String(v);
      }
      return String(e ?? "An unknown error occurred.");
    };

    const handleError = (e: unknown) => {
      const message = extractErrorMessage(e);
      console.error("Daily.co error:", message);
      setErrorMessage(message);
      setCallState("error");
    };
    const handleLeft = () => {
      // Could redirect or show a "Call ended" message
      console.log("Left the call");
    };

    frame.on("joined-meeting", handleJoined);
    frame.on("error", handleError);
    frame.on("left-meeting", handleLeft);

    frame.join({ url: roomUrl, userName: displayName }).catch(handleError);

    return () => {
      frame.off("joined-meeting", handleJoined);
      frame.off("error", handleError);
      frame.off("left-meeting", handleLeft);
      callFrameRef.current?.destroy();
    };
  }, [roomUrl, displayName]);

  return (
    <div
      ref={videoContainerRef}
      className="relative h-full w-full min-h-[500px] rounded-lg bg-black"
    >
      {callState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <LoadingSpinner className="text-white" />
          <p className="mt-4">Joining your secure consultation...</p>
        </div>
      )}
      {callState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-900/50 p-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="mt-4 font-semibold">Could not join the call</p>
          <p className="mt-2 text-sm text-red-200">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

```

# components/ui/Button.tsx
```tsx
// @/components/ui/Button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-secondary text-white hover:bg-secondary/90",
        outline:
          "border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

```

# components/ui/Button.tsx.example
```example
// components/ui/Button.tsx.example
// Example of using an ARIA label for an icon-only button
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// In a Modal component:
<Button variant="ghost" size="icon" aria-label="Close modal">
  <X className="h-4 w-4" />
</Button>

```

# components/ui/Card.tsx
```tsx
// @/components/ui/Card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

```

# components/ui/Input.tsx
```tsx
// @/components/ui/Input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

```

# components/ui/Label.tsx
```tsx
// @/components/ui/Label.tsx
"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

```

# components/ui/LoadingSpinner.tsx
```tsx
// @/components/ui/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Loader2
      style={{ width: size, height: size }}
      className={cn("animate-spin text-primary", className)}
    />
  );
}

```

# components/ui/Skeleton.tsx
```tsx
// components/ui/Skeleton.tsx
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200", className)}
      {...props}
    />
  );
}

export { Skeleton };

```

# components/ui/StarRating.tsx
```tsx
// components/ui/StarRating.tsx
import * as React from "react";

export function StarRating({
  rating,
  onRatingChange,
  max = 5,
}: {
  rating: number;
  onRatingChange: (r: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        return (
          <button
            key={idx}
            type="button"
            aria-label={`Rate ${idx}`}
            onClick={() => onRatingChange(idx)}
            className={`text-xl ${idx <= rating ? "text-yellow-500" : "text-neutral-300"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;

```

# components/ui/badge.tsx
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        success:
          "border-transparent bg-green-100 text-green-800 [a&]:hover:bg-green-100/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

```

# components/ui/textarea.tsx
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  rows?: number;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        rows={rows}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);

export default Textarea;

```

# eslint.config.js
```js
// eslint.config.js
// Note: Next.js 14+ is moving towards flat config, but `next/core-web-vitals` is not yet fully compatible.
// We will use the standard `.eslintrc.json` for now for maximum stability with the Next.js ecosystem.
// This is a pragmatic choice to avoid experimental config issues.
// The content will be in `.eslintrc.json` as follows:

```

# hooks/use-auth.ts
```ts
// @/hooks/use-auth.ts
"use client";
import { useContext } from "react";
import { AuthContext } from "@/lib/auth/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

```

# hooks/use-booking-store.ts
```ts
// @/hooks/use-booking-store.ts
import { create } from "zustand";

type BookingState = {
  step: number;
  clinicId: string | null;
  doctorId: string | null;
  date: Date | null;
  timeSlot: string | null;
  actions: {
    setClinic: (clinicId: string) => void;
    setDoctor: (doctorId: string) => void;
    // ... other actions
    reset: () => void;
  };
};

export const useBookingStore = create<BookingState>((set) => ({
  step: 1,
  clinicId: null,
  doctorId: null,
  date: null,
  timeSlot: null,
  actions: {
    setClinic: (clinicId) => set({ clinicId, step: 2 }),
    setDoctor: (doctorId) => set({ doctorId, step: 3 }),
    reset: () => set({ step: 1, clinicId: null, doctorId: null, date: null, timeSlot: null }),
  },
}));

```

# hooks/use-queue-status.ts
```ts
// @/hooks/use-queue-status.ts
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";

type QueueStatus = {
  current_number: string;
  // ... other fields
};

export function useQueueStatus(clinicId: string) {
  const { data: initialData } = api.clinic.getQueueStatus.useQuery({ clinicId });
  const [status, setStatus] = useState<QueueStatus | null>(initialData ?? null);

  useEffect(() => {
    if (!clinicId) return;

    const channel = supabase
      .channel(`queue-updates-${clinicId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_management",
          filter: `clinic_id=eq.${clinicId}`,
        },
        (payload) => {
          setStatus(payload.new as QueueStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId]);

  return status;
}

```

# lib/auth/AuthContext.tsx
```tsx
// @/lib/auth/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { user, session, isLoading };

  // Render a full-page loader while initially fetching the session
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

```

# lib/auth/actions.ts
```ts
// @/lib/auth/actions.ts
"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { patientRegistrationSchema } from "@/types/zod-schemas";
import { env } from "@/env";

export async function signup(formData: unknown) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Use a service role client to insert into non-auth tables
  const supabaseAdmin = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const parsed = patientRegistrationSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data.", details: parsed.error.flatten() };
  }

  const { email, password, fullName, phone, dateOfBirth, nric: _nric } = parsed.data;

  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Could not sign up user." };
  }
  const userId = authData.user.id;

  // 2. Create the corresponding public.users record
  const { error: userError } = await supabaseAdmin.from("users").insert({
    id: userId,
    full_name: fullName,
    email: email,
    phone: phone,
    role: "patient",
  });
  
  if (userError) {
    // This is a critical failure. We should ideally roll back the auth user creation.
    // For now, we'll log it and return an error.
    console.error("Failed to create public.users record:", userError);
    return { error: "Failed to create user profile. Please contact support." };
  }
  
  // 3. Create the patient profile
  const { error: patientError } = await supabaseAdmin.from("patients").insert({
    user_id: userId,
    date_of_birth: dateOfBirth,
    // A placeholder clinicId for now. A real app would have a selection.
    clinic_id: "your-default-clinic-uuid", 
    patient_number: `P-${Date.now()}`, // Placeholder logic
    nric_hash: "...", // Hash the NRIC server-side
    nric_encrypted: "...", // Encrypt the NRIC server-side
    gender: "prefer_not_to_say", // Default or from form
  });

  if (patientError) {
    console.error("Failed to create patient profile:", patientError);
    return { error: "Failed to create patient profile. Please contact support." };
  }

  return { error: null, success: true };
}

```

# lib/integrations/daily.ts
```ts
// lib/integrations/daily.ts
"use server";
import { env } from "@/env";

/**
 * A server-side adapter for the Daily.co REST API.
 * This class handles the creation and management of video call rooms.
 */
export class DailyVideoProvider {
  private apiKey: string;
  private apiUrl = "https://api.daily.co/v1";

  constructor() {
    if (!env.DAILY_API_KEY) {
      throw new Error("DAILY_API_KEY is not set in environment variables.");
    }
    this.apiKey = env.DAILY_API_KEY;
  }

  /**
   * Creates a new, private, short-lived video call room for a specific appointment.
   * @param appointmentId - The unique ID of the appointment to associate with the room.
   * @returns The newly created room object, including its URL.
   */
  async createRoom(appointmentId: string): Promise<{ url: string; name: string }> {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // Expires in 2 hours

    const response = await fetch(`${this.apiUrl}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        name: `gfc-appt-${appointmentId}`,
        privacy: "private",
        properties: {
          exp: expiryTime,
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 2,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Failed to create Daily.co room:", errorBody);
      throw new Error(`Daily.co API error: ${errorBody.info || response.statusText}`);
    }

    const room = await response.json();
    return { url: room.url, name: room.name };
  }
}

export const dailyVideoProvider = new DailyVideoProvider();

```

# lib/integrations/resend.ts
```ts
// lib/integrations/resend.ts
import { Resend } from "resend";
import { env } from "@/env";
import type { EmailProvider } from "@/lib/notifications/types";
import type { ReactElement } from "react";

class ResendEmailProvider implements EmailProvider {
  private client: Resend;

  constructor() {
    if (typeof window !== "undefined") {
      throw new Error("ResendEmailProvider can only be used on the server.");
    }
    this.client = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(props: {
    to: string;
    subject: string;
    body: ReactElement;
  }): Promise<{ id: string }> {
    const { to, subject, body } = props;
    try {
      const { data, error } = await this.client.emails.send({
        from: `Gabriel Family Clinic <no-reply@${env.RESEND_DOMAIN}>`, // Assuming RESEND_DOMAIN is in env
        to,
        subject,
        react: body,
      });

      if (error || !data) {
        throw error ?? new Error("Resend API returned no data.");
      }

      console.log(`Email sent successfully to ${to}. ID: ${data.id}`);
      return { id: data.id };
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error("Resend email sending failed.");
    }
  }
}

export const resendEmailProvider = new ResendEmailProvider();

```

# lib/integrations/stripe.ts
```ts
// lib/integrations/stripe.ts
import Stripe from "stripe";
import { env } from "@/env";

/**
 * A singleton instance of the Stripe SDK, initialized with the secret key.
 * This should never be exposed to the client-side.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20", // Align with installed stripe types
  typescript: true,
});

/**
 * A dedicated service class to encapsulate all Stripe interactions.
 */
export class StripeService {
  /**
   * Creates a Stripe PaymentIntent.
   * @param amount - The amount to charge, in the smallest currency unit (e.g., cents).
   * @param currency - The currency code (e.g., 'sgd').
   * @param metadata - An object containing metadata to associate with the payment.
   * @returns The created Stripe PaymentIntent.
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Stripe.MetadataParam
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Securely constructs and verifies a webhook event from Stripe.
   * @param body - The raw request body from the webhook.
   * @param signature - The value of the 'stripe-signature' header.
   * @returns The verified Stripe.Event object.
   */
  async constructWebhookEvent(
    body: Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  }

  /**
   * Creates a refund for a given charge.
   * @param chargeId - The ID of the charge to refund.
   * @param amount - The amount to refund in cents. If omitted, a full refund is issued.
   * @returns The created Stripe Refund object.
   */
  async createRefund(
    chargeId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    return stripe.refunds.create({
      charge: chargeId,
      amount,
    });
  }
}

export const stripeService = new StripeService();

```

# lib/integrations/twilio.ts
```ts
// lib/integrations/twilio.ts
import twilio from "twilio";
import { env } from "@/env";
import { type SmsProvider } from "@/lib/notifications/types";

class TwilioSmsProvider implements SmsProvider {
  private client: twilio.Twilio;

  constructor() {
    // Should only be initialized on the server
    if (typeof window !== "undefined") {
      throw new Error("TwilioSmsProvider can only be used on the server.");
    }
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  async sendSms(to: string, body: string): Promise<{ id: string }> {
    // Add +65 prefix for Singapore numbers if not present
    const formattedTo = to.startsWith("+") ? to : `+65${to}`;
    
    try {
      const message = await this.client.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to: formattedTo,
      });
      console.log(`SMS sent successfully to ${formattedTo}. SID: ${message.sid}`);
      return { id: message.sid };
    } catch (error) {
      console.error(`Failed to send SMS to ${formattedTo}:`, error);
      throw new Error("Twilio SMS sending failed.");
    }
  }
}

export const twilioSmsProvider = new TwilioSmsProvider();

```

# lib/jobs/queue.ts
```ts
// lib/jobs/queue.ts
"use server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { JobPayloads, JobType, JobRecord } from "./types";

const MAX_ATTEMPTS = 5;

// All job handlers are defined in this map. Use a permissive record type so handlers
// can be added incrementally. Replace with concrete types when job types are known.
const jobHandlers: Record<string, (payload: unknown) => Promise<void>> = {
  // Add handlers here
};

export async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayloads[T],
  runAt?: Date
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("jobs").insert({
    queue: type, // We use the queue name to identify the job type
    payload,
    run_at: runAt?.toISOString() ?? new Date().toISOString(),
  });

  if (error) {
    console.error(`Failed to enqueue job of type ${type}:`, error);
  }
}

export class JobProcessor {
  private supabase = createSupabaseAdminClient();

  public async run() {
    const { data: job, error } = await this.supabase
      .rpc("claim_job") // A DB function for atomic claiming
      .single();

    if (error || !job) {
      if (error && error.code !== "PGRST116") { // PGRST116 is "No rows returned"
        console.error("Error claiming job:", error);
      }
      return; // No job found
    }

  const jobRecord = job as unknown as JobRecord;
  const handler = jobHandlers[jobRecord.queue as JobType];
    if (!handler) {
      await this.markAsFailed(jobRecord.id, "No handler found for queue.");
      return;
    }

    try {
  await handler(jobRecord.payload);
  await this.markAsCompleted(jobRecord.id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (jobRecord.attempts + 1 >= MAX_ATTEMPTS) {
        await this.markAsFailed(jobRecord.id, message);
      } else {
        await this.retryJob(jobRecord.id, message);
      }
    }
  }

  private async markAsCompleted(jobId: number) {
    await this.supabase.from("jobs").update({ status: "completed" }).eq("id", jobId);
  }

  private async markAsFailed(jobId: number, errorMessage: string) {
    await this.supabase.from("jobs").update({ status: "failed", last_error: errorMessage }).eq("id", jobId);
  }

  private async retryJob(jobId: number, errorMessage: string) {
    const backoffSeconds = Math.pow(2, (await this.supabase.from("jobs").select("attempts").eq("id", jobId).single()).data!.attempts) * 60;
    const nextRunAt = new Date(Date.now() + backoffSeconds * 1000);

    await this.supabase.from("jobs").update({
      status: "pending",
      last_error: errorMessage,
      run_at: nextRunAt.toISOString(),
    }).eq("id", jobId);
  }
}

```

# lib/jobs/types.ts
```ts
// lib/jobs/types.ts
// Minimal, permissive job typing to satisfy type-checking in queue implementation.
// This is intentionally generic and can be replaced with more specific payloads
// when actual job types are known.

export type JobPayloads = Record<string, unknown>;

// JobType is the set of keys present in JobPayloads. For now, allow any string.
export type JobType = keyof JobPayloads & string;

export interface JobRecord {
  id: number;
  queue: string;
  payload: unknown;
  attempts: number;
  status: "pending" | "completed" | "failed";
  run_at: string;
  last_error?: string | null;
}

// No default export — keep the file focused on type exports only.

```

# lib/notifications/templates/AppointmentConfirmationEmail.tsx
```tsx
// lib/notifications/templates/AppointmentConfirmationEmail.tsx
import * as React from 'react';

interface AppointmentConfirmationEmailProps {
  patientName: string;
  appointmentDate: string; // e.g., "Tuesday, 15 November 2025"
  appointmentTime: string; // e.g., "10:30 AM"
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
}

export const AppointmentConfirmationEmail: React.FC<Readonly<AppointmentConfirmationEmailProps>> = ({
  patientName,
  appointmentDate,
  appointmentTime,
  doctorName,
  clinicName,
  clinicAddress,
}) => (
  <div>
    <h1>Your Appointment is Confirmed!</h1>
    <p>Dear {patientName},</p>
    <p>This email confirms your upcoming appointment at Gabriel Family Clinic.</p>
    
    <h2>Appointment Details:</h2>
    <ul>
      <li><strong>Date:</strong> {appointmentDate}</li>
      <li><strong>Time:</strong> {appointmentTime}</li>
      <li><strong>Doctor:</strong> {doctorName}</li>
      <li><strong>Clinic:</strong> {clinicName}</li>
      <li><strong>Address:</strong> {clinicAddress}</li>
    </ul>

    <p>Please arrive 10 minutes early. If you need to reschedule, please contact us at least 24 hours in advance.</p>
    <p>We look forward to seeing you.</p>
    <br/>
    <p>Sincerely,</p>
    <p>The Gabriel Family Clinic Team</p>
  </div>
);

```

# lib/notifications/types.ts
```ts
// lib/notifications/types.ts
import type { ReactElement } from "react";

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ id: string }>;
}

export interface EmailProvider {
  sendEmail(props: {
    to: string;
    subject: string;
    body: ReactElement;
  }): Promise<{ id:string }>;
}

```

# lib/supabase/admin.ts
```ts
// lib/supabase/admin.ts
// Minimal Supabase admin client shim used to satisfy imports during build.
// Replace with your canonical admin client implementation that uses the service role key.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  process.env.SUPABASE_ANON_KEY ??
  "";

if (!url || !key) {
  // Non-fatal at build time; will surface runtime issues if env is not configured.
  // Keep this as a temporary shim if you don't have the canonical implementation restored yet.
  // TODO: Replace with project canonical admin client and ensure secrets come from secure store.
  // eslint-disable-next-line no-console
  console.warn("lib/supabase/admin: created client with empty URL or key — set env vars in runtime.");
}

export const createSupabaseAdminClient = () => createClient(url, key);
export const supabaseAdmin = createClient(url, key);
export default supabaseAdmin;


```

# lib/supabase/client.ts
```ts
// lib/supabase/client.ts
// Minimal Supabase client shim — replace with full implementation/config in secure code path.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// TODO: Replace this stub with the project's canonical supabase client implementation
export const supabase = createClient(url, key);
export default supabase;

```

# lib/trpc/client.ts
```ts
// @/lib/trpc/client.ts
import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "./root";

export const api = createTRPCReact<AppRouter>();

```

# lib/trpc/context.ts
```ts
// @/lib/trpc/context.ts
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
  };
}

```

# lib/trpc/middlewares/adminAuth.ts
```ts
// lib/trpc/middlewares/adminAuth.ts
import { TRPCError } from "@trpc/server";
import { t } from "../server";

/**
 * Reusable middleware to enforce 'admin' or 'superadmin' role.
 * Throws a TRPCError if the user is not authenticated or lacks the required role.
 */
export const adminProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  // Fetch the user's role from our public.users table
  const { data: userProfile, error } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (error || !userProfile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not retrieve user profile.",
    });
  }

  if (userProfile.role !== "admin" && userProfile.role !== "superadmin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now non-nullable
      userProfile: userProfile,
    },
  });
});

```

# lib/trpc/middlewares/doctorAuth.ts
```ts
// lib/trpc/middlewares/doctorAuth.ts
import { TRPCError } from "@trpc/server";
import { t } from "../server"; // Assuming t is exported from server.ts

/**
 * This is a reusable middleware for tRPC procedures that enforces two conditions:
 * 1. The user must be authenticated.
 * 2. The user's role must be 'doctor'.
 *
 * It enriches the context with a non-nullable `user` object and a `doctorProfile` object.
 */
export const doctorProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  // 1. Check for authenticated user
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }

  // 2. Fetch the user's profile to check their role
  const { data: userProfile, error: userError } = await ctx.supabase
    .from("users")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (userError || !userProfile) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not retrieve user profile." });
  }

  // 3. Enforce 'doctor' role
  if (userProfile.role !== "doctor") {
    throw new TRPCError({ code: "FORBIDDEN", message: "User is not a doctor." });
  }
  
  // 4. Fetch the doctor's specific profile
  const { data: doctorProfile, error: doctorError } = await ctx.supabase
    .from("doctors")
    .select("id, clinic_id")
    .eq("user_id", ctx.user.id)
    .single();

  if (doctorError || !doctorProfile) {
     throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not retrieve doctor profile." });
  }

  // 5. Pass down the enriched context
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now non-nullable
      doctorProfile: doctorProfile, // Add doctor-specific profile
    },
  });
});

```

# lib/trpc/react.tsx
```tsx

// Re-export canonical TRPC React provider and client from the src implementation.
// This avoids duplication between `lib/` and `src/` and keeps the transformer
// configuration in one place (`src/trpc/react.tsx`).

export { TRPCReactProvider, api } from "../../src/trpc/react";

```

# lib/trpc/root.ts
```ts
// lib/trpc/root.ts

import { router } from "./server";
import { patientRouter } from "./routers/patient.router";
import { appointmentRouter } from "./routers/appointment.router";
import { clinicRouter } from "./routers/clinic.router";
import { doctorRouter } from "./routers/doctor.router";
import { consultationRouter } from "./routers/consultation.router";
import { feedbackRouter } from "./routers/feedback.router";
import { telemedicineRouter } from "./routers/telemedicine.router";
import { healthRouter } from "./routers/health.router";
import { adminRouter } from "./routers/admin.router";
import { paymentRouter } from "./routers/payment.router";
import { userRouter } from "./routers/user.router"; // For user preferences

/**
 * This is the primary router for your entire server.
 * All feature routers are merged here to create a single type-safe API.
 */
export const appRouter = router({
  // PUBLIC & PATIENT-FACING ROUTERS
  patient: patientRouter,
  appointment: appointmentRouter,
  clinic: clinicRouter,
  payment: paymentRouter,
  user: userRouter,
  feedback: feedbackRouter,
  telemedicine: telemedicineRouter,
  health: healthRouter,

  // DOCTOR PORTAL ROUTERS
  doctor: doctorRouter,
  consultation: consultationRouter,

  // ADMIN PORTAL ROUTERS
  admin: adminRouter,
  // reports: reportsRouter, // Placeholder for a future phase
});

// Export the type definition of the API router.
// This is used by the tRPC client to provide end-to-end type safety.
export type AppRouter = typeof appRouter;

```

# lib/trpc/routers/admin.router.ts
```ts
// lib/trpc/routers/admin.router.ts

import { router } from "../server";
import { adminProcedure } from "../middlewares/adminAuth";
import { z } from "zod";
import { enqueueJob } from "@/lib/jobs/queue";

export const adminRouter = router({
  /**
   * Fetches key metrics for the main admin dashboard.
   */
  getDashboardMetrics: adminProcedure.query(async ({ ctx }) => {
    const { count: totalPatients, error: patientError } = await ctx.supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: appointmentsToday, error: apptError } = await ctx.supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", new Date().toISOString().split("T")[0]);

    if (patientError || apptError) {
      console.error("Error fetching dashboard metrics:", patientError || apptError);
      throw new Error("Failed to fetch dashboard metrics.");
    }

    // Placeholder for revenue calculation
    const monthlyRevenue = 54321.90;

    return {
      totalPatients: totalPatients ?? 0,
      appointmentsToday: appointmentsToday ?? 0,
      monthlyRevenue: monthlyRevenue,
    };
  }),

  /**
   * Fetches a paginated and filterable list of all users in the system.
   */
  getUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(5).max(100).default(10),
      filter: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const query = ctx.supabase
        .from("users")
        .select("id, full_name, email, role, is_active, created_at", { count: "exact" });
      
      if (input.filter) {
        query.ilike('full_name', `%${input.filter}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      if (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users.");
      }

  // Return `total` for compatibility with existing frontend components
  return { users: data, total: count ?? 0 };
    }),

  /**
   * Updates a specific user's role and active status.
   */
  updateUser: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      role: z.enum(["patient", "doctor", "staff", "admin", "superadmin"]),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("users")
        .update({ role: input.role, is_active: input.isActive })
        .eq("id", input.userId);
      
      if (error) {
        console.error(`Error updating user ${input.userId}:`, error);
        throw new Error("Failed to update user.");
      }
      return { success: true };
    }),

  /**
   * Enqueues jobs to send a broadcast message to a target audience.
   */
  sendBroadcast: adminProcedure
    .input(z.object({
      channel: z.enum(["sms", "email"]),
      message: z.string().min(10, "Message must be at least 10 characters."),
      clinicId: z.string().uuid("Please select a clinic."),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch all patients for the selected clinic who have opted in to the specified channel.
      const { data: patients, error } = await ctx.supabase
        .from("patients")
        .select("users!inner(id, phone, email, notification_preferences)")
        .eq("clinic_id", input.clinicId);

      if (error) {
        console.error(`Error fetching patients for broadcast for clinic ${input.clinicId}:`, error);
        throw new Error("Could not fetch recipients for broadcast.");
      }

      let recipientsQueued = 0;
      const jobPromises: Promise<void>[] = [];

      // 2. Enqueue a job for each eligible patient.
      for (const patient of patients) {
        // The user profile is nested inside the patient data. Supabase may
        // return nested relations as arrays depending on the query, so normalize.
        const user = Array.isArray(patient.users) ? patient.users[0] : patient.users;
        if (!user) continue;

        type NotificationPrefs = {
          sms?: { enabled?: boolean };
          email?: { enabled?: boolean };
        } | null | undefined;

  const prefs = user.notification_preferences as NotificationPrefs; // Narrowed type for notification preferences

        if (input.channel === "sms" && prefs?.sms?.enabled && user.phone) {
          jobPromises.push(enqueueJob("send-sms", { to: user.phone, message: input.message }));
          recipientsQueued++;
        } else if (input.channel === "email" && prefs?.email?.enabled && user.email) {
          jobPromises.push(enqueueJob("send-email", { to: user.email, subject: "An Update from Gabriel Family Clinic", message: input.message }));
          recipientsQueued++;
        }
      }
      
      await Promise.all(jobPromises);

      return { success: true, recipientsQueued };
    }),
});

```

# lib/trpc/routers/appointment.router.ts
```ts
// @/lib/trpc/routers/appointment.router.ts
import { router, publicProcedure, protectedProcedure } from "../server";
import { z } from "zod";
import { createAppointmentSchema } from "@/types/zod-schemas";

export const appointmentRouter = router({
  getAvailableDoctors: publicProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("doctors")
        .select(`
          id,
          consultation_fee,
          users (
            full_name,
            display_name
          )
        `)
        .eq("clinic_id", input.clinicId)
        .eq("is_active", true); // Assuming doctors table has an is_active field

      if (error) {
        throw new Error("Failed to fetch available doctors.");
      }
      return data;
    }),
  
  getAvailableSlots: publicProcedure
    .input(z.object({ doctorId: z.string().uuid(), date: z.string() }))
    .query(async ({ ctx, input }) => {
      // This is a simplified query. A real-world scenario would involve
      // a function that generates slots based on doctor's working hours
      // and checks against existing appointments.
      const { data, error } = await ctx.supabase
        .from("appointment_slots")
        .select("slot_time, is_available")
        .eq("doctor_id", input.doctorId)
        .eq("slot_date", input.date)
        .order("slot_time");
      
      if (error) {
        throw new Error("Failed to fetch available slots.");
      }
      return data;
    }),

  createAppointment: protectedProcedure
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      // The robust implementation for this would be to call the 
      // `booking.create_booking` stored procedure defined in the database migrations.
      // This ensures atomicity and prevents race conditions.
      const { data, error } = await ctx.supabase.rpc("create_booking", {
        p_idempotency_key: crypto.randomUUID(), // A real app would get this from client
        p_user_id: ctx.user.id,
        p_clinic_id: input.clinicId,
        // p_slot_id: needs to be derived or passed from client
        p_patient_id: "...", // needs to be fetched based on user_id
        p_visit_reason: input.visitReason,
      });

      if (error) {
        console.error("Error creating appointment:", error);
        throw new Error(`Booking failed: ${error.message}`);
      }
      return data;
    }),
});

```

# lib/trpc/routers/clinic.router.ts
```ts
// @/lib/trpc/routers/clinic.router.ts
import { router, publicProcedure } from "../server";
import { z } from "zod";

export const clinicRouter = router({
  getQueueStatus: publicProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("queue_management")
        .select("current_number, last_called_number, average_wait_time_minutes")
        .eq("clinic_id", input.clinicId)
        .eq("queue_date", new Date().toISOString().split("T")[0])
        .single();
        
      if (error) {
        // It's okay if no queue exists for today, return null
        if (error.code === 'PGRST116') return null; 
        throw new Error("Failed to fetch queue status.");
      }
      return data;
    }),
});

```

# lib/trpc/routers/consultation.router.ts
```ts
// lib/trpc/routers/consultation.router.ts
import { router } from "../server";
import { doctorProcedure } from "../middlewares/doctorAuth";
import { z } from "zod";

const consultationSchema = z.object({
  appointmentId: z.string().uuid(),
  chiefComplaint: z.string(),
  diagnosis: z.string(),
  treatmentPlan: z.string(),
  // ... other fields
});

export const consultationRouter = router({
  getPatientHistory: doctorProcedure
    .input(z.object({ patientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("medical_records")
        .select(`*, appointments(appointment_date)`)
        .eq("patient_id", input.patientId)
        .order("record_date", { ascending: false });

      if (error) throw new Error("Failed to fetch patient history.");
      return data;
    }),

  saveConsultation: doctorProcedure
    .input(consultationSchema)
    .mutation(async ({ ctx, input }) => {
      // In a real app, this would use UPSERT on appointment_id
      const { data: _data, error } = await ctx.supabase
        .from("medical_records")
        .update({
          chief_complaint: input.chiefComplaint,
          primary_diagnosis: input.diagnosis,
          treatment_plan: input.treatmentPlan,
        })
        .eq("appointment_id", input.appointmentId);
      
      if (error) throw new Error("Failed to save consultation notes.");
      return { success: true };
    }),
});

```

# lib/trpc/routers/doctor.router.ts
```ts
// lib/trpc/routers/doctor.router.ts
import { router } from "../server";
import { doctorProcedure } from "../middlewares/doctorAuth";
import { z } from "zod";
import dayjs from "dayjs";

export const doctorRouter = router({
  getDashboardSummary: doctorProcedure.query(async ({ ctx }) => {
    const today = dayjs().format("YYYY-MM-DD");
    const { data: appointments, error } = await ctx.supabase
      .from("appointments")
      .select(`
        id, appointment_time, status,
        patients ( users ( full_name ) )
      `)
      .eq("doctor_id", ctx.doctorProfile.id)
      .eq("appointment_date", today)
      .order("appointment_time");

    if (error) throw new Error("Failed to fetch dashboard summary.");
    
    const waitingCount = appointments.filter(a => a.status === 'in_progress').length;

    return { appointments, waitingCount };
  }),

  getScheduleByDate: doctorProcedure
    .input(z.object({ date: z.string().date() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("appointments")
        .select(`*, patients(users(full_name))`)
        .eq("doctor_id", ctx.doctorProfile.id)
        .eq("appointment_date", input.date)
        .order("appointment_time");
        
      if (error) throw new Error("Failed to fetch schedule.");
      return data;
    }),

  searchPatients: doctorProcedure
    .input(z.object({ searchTerm: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      // Using pg_trgm for fuzzy search, installed in migration 001
      const { data, error } = await ctx.supabase
        .from("patients")
        .select(`id, users ( full_name, email )`)
        .eq("clinic_id", ctx.doctorProfile.clinic_id)
        .ilike("users.full_name", `%${input.searchTerm}%`) // Simplified search for now
        .limit(10);
      
      if (error) throw new Error("Failed to search for patients.");
      return data;
    }),
});

```

# lib/trpc/routers/feedback.router.ts
```ts
// @/lib/trpc/routers/feedback.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";

export const feedbackRouter = router({
  submitFeedback: protectedProcedure
    .input(z.object({
      rating: z.number().min(1).max(5).optional(),
      feedbackText: z.string().max(2000).optional(),
      pageUrl: z.string().url(),
      userAgent: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.rating && !input.feedbackText) {
        // Don't save empty feedback
        return { success: true };
      }

      const { error } = await ctx.supabase.from("user_feedback").insert({
        user_id: ctx.user.id,
        rating: input.rating,
        feedback_text: input.feedbackText,
        page_url: input.pageUrl,
        user_agent: input.userAgent,
      });

      if (error) {
        console.error("Failed to save user feedback:", error);
        throw new Error("Could not submit your feedback at this time.");
      }

      // Optional: Send a notification to a Slack channel about new feedback
      // await notifyTeamOfFeedback(input);

      return { success: true };
    }),
});

```

# lib/trpc/routers/health.router.ts
```ts
// lib/trpc/routers/health.router.ts
import { router, publicProcedure, protectedProcedure } from "../server";

export const healthRouter = router({
  getScreeningPackages: publicProcedure.query(async ({ ctx }) => {
    // `ctx` is intentionally unused for now; mark as used to satisfy lint rules.
    void ctx;
    // Logic to fetch all active health_screening_packages
    return [];
  }),

  getPatientVaccinations: protectedProcedure.query(async ({ ctx }) => {
    // `ctx` is intentionally unused for now; mark as used to satisfy lint rules.
    void ctx;
    // Logic to fetch all vaccination_records for the logged-in user's patient profile
    return [];
  }),
});

```

# lib/trpc/routers/patient.router.ts
```ts
// @/lib/trpc/routers/patient.router.ts
import { router, protectedProcedure } from "../server";

export const patientRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("patients")
      .select(`
        *,
        users (
          full_name,
          email,
          phone
        )
      `)
      .eq("user_id", ctx.user.id)
      .single();

    if (error) {
      console.error("Error fetching patient profile:", error);
      throw new Error("Failed to fetch patient profile.");
    }
    return data;
  }),

  getAppointments: protectedProcedure.query(async ({ ctx }) => {
    const { data: patient, error: patientError } = await ctx.supabase
      .from("patients")
      .select("id")
      .eq("user_id", ctx.user.id)
      .single();

    if (patientError || !patient) {
      throw new Error("Could not find patient profile for the current user.");
    }
    
    const { data, error } = await ctx.supabase
      .from("appointments")
      .select(`
        *,
        doctors (
          users (
            full_name
          )
        ),
        clinics (
          name
        )
      `)
      .eq("patient_id", patient.id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      throw new Error("Failed to fetch appointments.");
    }
    return data;
  }),

  getMedicalRecords: protectedProcedure.query(async ({ ctx }) => {
    // `ctx` may be unused in this placeholder; mark as used to satisfy lint.
    void ctx;
    // Similar logic to getAppointments, fetching from medical_records table
    // Placeholder for brevity
    return [];
  }),
});

```

# lib/trpc/routers/payment.router.ts
```ts
// lib/trpc/routers/payment.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { stripeService } from "@/lib/integrations/stripe";
import { CHASCalculator } from "@/lib/utils/chas-calculator";
import { type ChasCardType } from "@/types/database.types";
import { TRPCError } from "@trpc/server";

export const paymentRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch appointment and patient data to verify ownership and get details
      const { data: appointment, error: apptError } = await ctx.supabase
        .from("appointments")
        .select(`consultation_fee, patients!inner(id, chas_card_type)`)
        .eq("id", input.appointmentId)
        .eq("patients.user_id", ctx.user.id) // Security: ensure user owns this appointment
        .single();

      if (apptError || !appointment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appointment not found or you do not have permission to pay for it.",
        });
      }

  const consultationFee = appointment.consultation_fee ?? 0;
      if (consultationFee <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment is required for this appointment." });
      }

          // 2. Calculate final amount with CHAS subsidy
          // Supabase `select(...!inner(...))` can return an array for nested relations.
          type PatientShape = { id?: string; chas_card_type?: string };
          const patientsField = (appointment as Record<string, unknown>).patients;
          const patient: PatientShape | undefined = Array.isArray(patientsField)
            ? (patientsField[0] as PatientShape)
            : (patientsField as PatientShape | undefined);

      const rawChas = patient?.chas_card_type as unknown;
      const chasCardType: ChasCardType =
        rawChas === "blue" || rawChas === "orange" || rawChas === "green" || rawChas === "none"
          ? (rawChas as ChasCardType)
          : "none";

      const { subsidyAmount, finalAmount } = CHASCalculator.calculate({
        chasCardType,
        consultationFee,
      });
      
      const finalAmountInCents = Math.round(finalAmount * 100);

      // 3. Create a pending payment record in our database
      const { data: paymentRecord, error: paymentError } = await ctx.supabase
        .from("payments")
        .insert({
          appointment_id: input.appointmentId,
          patient_id: patient?.id,
          clinic_id: "...", // Fetch from appointment
          subtotal: consultationFee,
          chas_subsidy_amount: subsidyAmount,
          total_amount: finalAmount,
          status: "pending",
          payment_method: "stripe",
          // These are placeholder values
          payment_number: `PAY-${Date.now()}`,
          receipt_number: `REC-${Date.now()}`,
        })
        .select("id")
        .single();

      if (paymentError || !paymentRecord) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create payment record." });
      }
      
      // 4. Create the Stripe Payment Intent
      try {
        const paymentIntent = await stripeService.createPaymentIntent(
          finalAmountInCents,
          "sgd",
          {
            appointmentId: input.appointmentId,
            paymentId: String(paymentRecord.id), // Our internal payment ID as string
            patientId: patient?.id ?? "",
          }
        );

        // 5. Update our payment record with the Stripe intent ID
        await ctx.supabase
          .from("payments")
          .update({ payment_intent_id: paymentIntent.id })
          .eq("id", paymentRecord.id);

        return {
          clientSecret: paymentIntent.client_secret,
          totalAmount: finalAmount,
          subsidyAmount: subsidyAmount,
          originalAmount: consultationFee,
        };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Stripe payment intent.",
          cause: e,
        });
      }
    }),
});

```

# lib/trpc/routers/telemedicine.router.ts
```ts
// lib/trpc/routers/telemedicine.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";
import { dailyVideoProvider } from "@/lib/integrations/daily";
import { TRPCError } from "@trpc/server";

export const telemedicineRouter = router({
  getTelemedicineSession: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 1. Verify the user (patient or doctor) is part of this appointment
      const { data: appointment, error: apptError } = await ctx.supabase
        .from("appointments")
        .select("id, patient_id, doctor_id")
        .eq("id", input.appointmentId)
        .single();

      if (apptError || !appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found." });
      }

      const { data: doctorProfile } = await ctx.supabase.from("doctors").select("id").eq("user_id", ctx.user.id).single();
      const { data: patientProfile } = await ctx.supabase.from("patients").select("id").eq("user_id", ctx.user.id).single();

      const isDoctorForAppt = doctorProfile?.id === appointment.doctor_id;
      const isPatientForAppt = patientProfile?.id === appointment.patient_id;

      if (!isDoctorForAppt && !isPatientForAppt) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to access this session." });
      }
      
      // 2. Check if a session already exists in our DB
      const { data: existingSession } = await ctx.supabase
        .from("telemedicine_sessions")
        .select("room_url")
        .eq("appointment_id", input.appointmentId)
        .single();

      if (existingSession?.room_url) {
        return { roomUrl: existingSession.room_url };
      }

      // 3. If not, create a new room via the Daily.co provider
      try {
        const room = await dailyVideoProvider.createRoom(input.appointmentId);
        
        // 4. Save the new session details to our database
        const { error: insertError } = await ctx.supabase
          .from("telemedicine_sessions")
          .insert({
            appointment_id: input.appointmentId,
            room_url: room.url,
            room_name: room.name,
            // These would be fetched from the appointment record
            clinic_id: "...",
            patient_id: "...",
            doctor_id: "...",
            session_token: "...", // A JWT or token could be generated here if needed
            scheduled_start: "...",
            scheduled_end: "...",
          });

        if (insertError) throw insertError;

        return { roomUrl: room.url };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("Telemedicine session creation failed:", message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create or retrieve the video session.",
        });
      }
    }),
});

```

# lib/trpc/routers/user.router.ts
```ts
// lib/trpc/routers/user.router.ts
import { router, protectedProcedure } from "../server";
import { z } from "zod";

export const userRouter = router({
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("users")
      .select("notification_preferences")
      .eq("id", ctx.user.id)
      .single();
    return data?.notification_preferences ?? {};
  }),

  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      smsEnabled: z.boolean(),
      emailEnabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("users")
        .update({
          notification_preferences: {
            sms: { appointment_reminders: input.smsEnabled },
            email: { appointment_reminders: input.emailEnabled },
          },
        })
        .eq("id", ctx.user.id);
      
      if (error) throw new Error("Failed to update preferences.");
      return { success: true };
    }),
});

```

# lib/trpc/server.ts
```ts
// @/lib/trpc/server.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { type createContext } from "./context";

export const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `user` as non-nullable
      user: ctx.user,
      supabase: ctx.supabase,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

```

# lib/utils.ts
```ts
// @/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names together.
 * It also handles merging Tailwind CSS classes without style conflicts.
 * @param inputs - A list of class names or conditional class names.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extract `isLoading` state from a mutation-like object returned by
 * various react-query / tRPC hooks without using `any`.
 *
 * The function accepts `unknown` and checks for common shapes:
 * - `{ isLoading: boolean }`
 * - `{ status: string }` where `status === 'loading'`
 */
export function getMutationLoading(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;

  if (typeof o.isLoading === "boolean") return o.isLoading as boolean;
  if (typeof o.status === "string") return (o.status as string) === "loading";

  return false;
}

```

# lib/utils/chas-calculator.ts
```ts
// lib/utils/chas-calculator.ts
import { type ChasCardType } from "@/types/database.types"; // Assuming ENUM type is generated

type SubsidyRates = {
  consultation: number;
  // In a real scenario, this would be far more complex,
  // involving specific chronic conditions, etc.
};

const CHAS_SUBSIDY_RATES: Record<ChasCardType, SubsidyRates> = {
  blue: { consultation: 18.5 },
  orange: { consultation: 11.0 },
  green: { consultation: 7.5 },
  none: { consultation: 0 },
};

interface CalculationInput {
  chasCardType: ChasCardType;
  consultationFee: number;
}

interface CalculationOutput {
  subsidyAmount: number;
  finalAmount: number;
}

export class CHASCalculator {
  /**
   * Calculates the CHAS subsidy for a given consultation.
   * @param input - The patient's CHAS card type and the consultation fee.
   * @returns An object with the subsidy amount and the final payable amount.
   */
  public static calculate(input: CalculationInput): CalculationOutput {
    const { chasCardType, consultationFee } = input;
    const rates = CHAS_SUBSIDY_RATES[chasCardType] ?? CHAS_SUBSIDY_RATES.none;

    const subsidyAmount = Math.min(consultationFee, rates.consultation);
    const finalAmount = Math.max(0, consultationFee - subsidyAmount);

    return {
      subsidyAmount: parseFloat(subsidyAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
  }
}

```

# next.config.js
```js
// next.config.js
// ESM-style Next config (project package.json sets "type": "module")
import "./src/env.js";

import withBundleAnalyzerFactory from "@next/bundle-analyzer";
import withPWAFactory from "next-pwa";
import path from "path";

/**
 * Content Security Policy string built once and normalized
 */
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: *.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  /**
   * Provide a webpack alias guard so runtime resolution matches tsconfig paths.
   * This helps resolve both t3-style "~" imports and "@/..." imports at runtime.
   */
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Map t3-style ~ alias to src
      "~": path.resolve(process.cwd(), "src"),
      // Mirror TypeScript path aliases to runtime
      "@/components": path.resolve(process.cwd(), "components"),
      "@/lib": path.resolve(process.cwd(), "lib"),
      "@/styles": path.resolve(process.cwd(), "styles"),
      "@/hooks": path.resolve(process.cwd(), "hooks"),
      "@/types": path.resolve(process.cwd(), "types"),
      // Also map src variants to be tolerant during migration
      "@/components/src": path.resolve(process.cwd(), "src/components"),
      "@/lib/src": path.resolve(process.cwd(), "src/lib"),
      "@/styles/src": path.resolve(process.cwd(), "src/styles"),
    };
    return config;
  },
};

/**
 * Plugin factories: create configured wrappers.
 * Use factories (not the raw import) per plugin docs.
 */
const withPWA = withPWAFactory({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Chain plugins: bundle analyzer wraps PWA which wraps the base config.
 * Export as default ESM export (package.json: "type": "module").
 */
export default withBundleAnalyzer(withPWA(baseConfig));

```

# next.config.js.bak
```bak
// next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env.js";

import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";

// =================================================================
// 1. BASE NEXT.JS CONFIGURATION
// All core Next.js settings go here.
// =================================================================
/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  
  // Image Optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co", // Allows images from your Supabase storage bucket
      },
    ],
    formats: ["image/avif", "image/webp"], // Serve modern, optimized image formats
  },

  // Enable Gzip compression for server-rendered pages and assets
  compress: true,

  // Remove the "x-powered-by" header for security
  poweredByHeader: false,
};

// =================================================================
// 2. PWA PLUGIN CONFIGURATION
// This wraps the base config to add PWA capabilities.
// =================================================================
const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev for faster reloads
  runtimeCaching: [
    // Add your runtime caching strategies here if needed.
    // Example for caching API calls:
    // {
    //   urlPattern: /^https?.*/api\/.*/,
    //   handler: 'NetworkFirst',
    //   options: {
    //     cacheName: 'api-cache',
    //     expiration: {
    //       maxEntries: 10,
    //       maxAgeSeconds: 60 * 60, // 1 hour
    //     },
    //   },
    // },
  ],
});

// =================================================================
// 3. BUNDLE ANALYZER PLUGIN CONFIGURATION
// This wraps the PWA-enabled config to add bundle analysis.
// =================================================================
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// =================================================================
// 4. EXPORT THE FINAL, CHAINED CONFIGURATION
// The plugins are chained: bundleAnalyzer(pwaConfig(baseConfig))
// =================================================================
export default bundleAnalyzer(withPWAConfig(baseConfig));

```

# next.config.js.bak2
```bak2
// next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env.js";

import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";

// =================================================================
// 1. SECURITY HEADERS CONFIGURATION (from Phase 9)
// Defines a strict Content Security Policy and other security headers.
// =================================================================
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: *.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

// =================================================================
// 2. BASE NEXT.JS CONFIGURATION (Consolidated)
// All core Next.js settings go here.
// =================================================================
/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  
  // Image Optimization configuration (from Phase 8)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Enable Gzip compression (from Phase 8)
  compress: true,

  // Remove the "x-powered-by" header for security (Best Practice)
  poweredByHeader: false,
  
  // Add security headers (from Phase 9)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // Restrict sensitive APIs by default
          },
        ],
      },
    ];
  },
};

// =================================================================
// 3. PWA PLUGIN CONFIGURATION (from Phase 8)
// This wraps the base config to add PWA capabilities.
// =================================================================
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// =================================================================
// 4. BUNDLE ANALYZER PLUGIN CONFIGURATION (from Phase 8)
// This wraps the PWA-enabled config to add bundle analysis.
// =================================================================
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// =================================================================
// 5. EXPORT THE FINAL, CHAINED CONFIGURATION
// The plugins are chained in order: bundleAnalyzer(pwaConfig(baseConfig))
// =================================================================
export default bundleAnalyzer(pwaConfig(baseConfig));

```

# package.json
```json
{
  "name": "gabriel-family-clinic-v2",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "preview": "next build && next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format:write": "prettier --write \"**/*.{ts,tsx,js,jsx,mdx}\" --cache",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,mdx}\" --cache",
    "type-check": "tsc --noEmit",
    "check": "npm run format:check && npm run lint && npm run type-check",
    "clean": "rm -rf .next",
    "build:clean": "npm run clean && npm run build",
    "test": "echo 'No unit tests yet'",
    "test:e2e": "playwright test",
    "test:load": "k6 run tests/load/stress-test.js",
    "db:run-migrations": "node -r dotenv/config scripts/run-migrations.js",
    "db:run-seeds": "node -r dotenv/config scripts/run-seeds.js"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.11.1",
    "@daily-co/daily-js": "^0",
    "@hookform/resolvers": "^5.2.2",
    "@mantine/core": "7.17.8",
    "@mantine/hooks": "7.17.8",
    "@prisma/client": "^6.19.0",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@stripe/react-stripe-js": "^5.3.0",
    "@stripe/stripe-js": "^8.3.0",
    "@supabase/ssr": "^0",
    "@supabase/supabase-js": "2.80.0",
    "@t3-oss/env-nextjs": "0.13.8",
    "@tanstack/react-query": "5.90.7",
    "@trpc/client": "11.7.1",
    "@trpc/next": "11.7.1",
    "@trpc/react-query": "11.7.1",
    "@trpc/server": "11.7.1",
    "class-variance-authority": "^0",
    "clsx": "2.1.1",
    "dayjs": "1.11.19",
    "dotenv": "16.6.1",
    "lucide-react": "0.553.0",
    "micro": "^10",
    "next": "14.2.33",
    "next-auth": "^4.24.13",
    "postgres": "^3",
    "react": "^18",
    "react-dom": "^18",
    "react-hook-form": "^7",
    "react-server-dom-webpack": "^19.2.0",
    "resend": "^3",
    "server-only": "0.0.1",
    "stripe": "^16",
    "superjson": "2.2.5",
    "tailwind-merge": "2.6.0",
    "twilio": "^5",
    "zod": "3.25.76",
    "zustand": "4.5.7"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^16.0.1",
    "@playwright/test": "^1",
    "@types/node": "20.19.24",
    "@types/react": "18.3.26",
    "@types/react-dom": "18.3.7",
    "@typescript-eslint/eslint-plugin": "7.18.0",
    "@typescript-eslint/parser": "7.18.0",
    "autoprefixer": "10.4",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.33",
    "eslint-config-prettier": "9.1.2",
    "k6": "^0",
    "next-pwa": "^5.6.0",
    "postcss": "8.5.6",
    "postcss-preset-mantine": "1.18.0",
    "postcss-simple-vars": "7.0.1",
    "prettier": "3.6.2",
    "prettier-plugin-tailwindcss": "0.7.1",
    "prisma": "^6.19.0",
    "snyk": "^1",
    "tailwindcss": "3.4.18",
    "typescript": "5.9.3"
  },
  "packageManager": "npm@10.5.0"
}

```

# pages/_app.tsx
```tsx
// pages/_app.tsx

import "@/styles/globals.css";
import "@mantine/core/styles.css";

import type { AppType } from "next/app";
import { Inter } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { theme } from "@/styles/theme";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

// Configure the Inter font for self-hosting. This improves performance and prevents layout shift.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // This creates a CSS variable for our font.
});

/**
 * The main App component. It wraps every page with global providers and layout.
 * - TRPCReactProvider: Provides the tRPC client for type-safe API calls.
 * - MantineProvider: Provides the theme and components for the UI library.
 * - AuthProvider: Manages and provides the user's authentication state.
 * - Layout: Provides the consistent Header, Footer, and page structure.
 * - FeedbackWidget: Provides the global user feedback collection tool.
 */
const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    // Use a div as the root wrapper and apply the font variable class.
    // This is semantically more correct than <main> at this top level.
    <div className={cn("font-sans", inter.variable)}>
      <TRPCReactProvider>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <AuthProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <FeedbackWidget />
          </AuthProvider>
        </MantineProvider>
      </TRPCReactProvider>
    </div>
  );
};

export default MyApp;

```

# pages/_document.tsx
```tsx
// pages/_document.tsx (Updated)

import { ColorSchemeScript } from "@mantine/core";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="GFC v2.0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GFC v2.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FF6B6B" />

        <ColorSchemeScript defaultColorScheme="auto" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

```

# pages/admin/analytics/index.tsx
```tsx
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

```

# pages/admin/communications/broadcast.tsx
```tsx
// pages/admin/communications/broadcast.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
// import { MessageComposer } from "@/components/admin/MessageComposer";

export default function BroadcastPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Send Broadcast Message</h1>
          <p className="text-neutral-500">
            Send important announcements to patients of a specific clinic.
          </p>
          <div className="mt-6 max-w-2xl">
            {/* <MessageComposer /> */}
            <p>(Placeholder for Message Composer Component)</p>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

```

# pages/admin/dashboard/index.tsx
```tsx
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
          value={data?.appointmentsToday ?? 0}
          icon={Calendar}
          change="-0.5%"
        />
        <MetricCard
          title="Revenue (This Month)"
          value={`$${(data?.monthlyRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          change="+12.4%"
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

```

# pages/admin/login.tsx
```tsx
// pages/admin/login.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

// Minimal redirecting page: forward to the canonical /login page.
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}

```

# pages/admin/reports/appointments.tsx
```tsx
// pages/admin/reports/appointments.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
// import { ReportChart } from "@/components/admin/ReportChart";
// import { DateRangePicker } from "@/components/ui/DateRangePicker";

export default function AppointmentReportsPage() {
  // State for date range would be managed here
  // const [dateRange, setDateRange] = useState(...);
  
  // Fetch data using api.reports.getAppointmentReport.useQuery({ dateRange })

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Appointment Reports</h1>
            <div>{/* <DateRangePicker value={dateRange} onChange={setDateRange} /> */} (Placeholder for Date Range Picker)</div>
          </div>
          <div className="mt-6">
            {/* <ReportChart data={reportData} type="bar" /> */}
            <div className="p-8 mt-4 border rounded-lg bg-neutral-50">
              (Placeholder for Report Chart Component)
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

```

# pages/admin/users/index.tsx
```tsx
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

```

# pages/api/cron/process-jobs.ts
```ts
// pages/api/cron/process-jobs.ts
import { JobProcessor } from "@/lib/jobs/queue";
import { type NextApiRequest, type NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Simple secret key protection for the cron job
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const processor = new JobProcessor();
  try {
    await processor.run(); // Process one job per invocation
    res.status(200).json({ message: "Job processor ran successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Cron job processor failed:", message);
    res.status(500).json({ message: "Job processor failed.", error: message });
  }
}

```

# pages/api/health.ts
```ts
// @/pages/api/health.ts
import { type NextApiRequest, type NextApiResponse } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/integrations/stripe";

type ServiceStatus = "healthy" | "degraded" | "down";

interface HealthCheckResult {
  status: ServiceStatus;
  details?: string;
}

// Function to check the database connection and perform a simple query.
async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("clinics").select("id").limit(1);
    if (error) throw error;
    return { status: "healthy" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Health Check Error: Database failed.", message);
    return { status: "down", details: message };
  }
}

// Function to check connectivity with the Stripe API.
async function checkStripe(): Promise<HealthCheckResult> {
  try {
    // A lightweight, read-only API call.
    await stripe.customers.list({ limit: 1 });
    return { status: "healthy" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Health Check Error: Stripe API failed.", message);
    return { status: "down", details: message };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const checks = {
    database: await checkDatabase(),
    stripe: await checkStripe(),
  };

  const overallStatus: ServiceStatus = Object.values(checks).some(
    (service) => service.status === "down"
  )
    ? "down"
    : "healthy";

  const responsePayload = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    services: checks,
  };

  const httpStatus = overallStatus === "down" ? 503 : 200;

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(httpStatus).json(responsePayload);
}

```

# pages/api/trpc/[...trpc].ts
```ts
// @/pages/api/trpc/[...trpc].ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { appRouter } from "@/lib/trpc/root";
import { createContext } from "@/lib/trpc/context";
import { env } from "@/env";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    // Pass the context factory directly; the fetch adapter will call it with
    // the required `info` parameter.
    createContext: createContext,
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };

```

# pages/api/webhooks/stripe.ts
```ts
// pages/api/webhooks/stripe.ts
import { type NextApiRequest, type NextApiResponse } from "next";
import { buffer } from "micro";
import { stripeService } from "@/lib/integrations/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const config = {
  api: {
    bodyParser: false, // We need the raw body for webhook verification
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"] as string;
  const buf = await buffer(req);

  let event;
  try {
    event = await stripeService.constructWebhookEvent(buf, sig);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error verifying webhook signature: ${message}`);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);
      
      const paymentId = paymentIntent.metadata.paymentId;
      if (!paymentId) {
        console.error("❌ Missing paymentId in webhook metadata");
        break; // Acknowledge event but log error
      }

      // Update the payment status in our database using an admin client
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          transaction_reference: paymentIntent.latest_charge as string,
        })
        .eq("id", paymentId);

      if (error) {
        console.error(`❌ Failed to update payment record ${paymentId}:`, error);
        // We could return a 500 here to have Stripe retry,
        // but it might cause repeated errors. Logging is safer.
      }
      break;

    // ... handle other event types (e.g., payment_intent.payment_failed)

    default:
      console.log(`🤷‍♀️ Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}

```

# pages/dashboard/index.tsx
```tsx
// @/pages/dashboard/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// import { AppointmentSummary } from "@/components/patient/AppointmentSummary";
// import { MedicalHistory } from "@/components/patient/MedicalHistory";

function DashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Your Health Dashboard</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>{/* <AppointmentSummary /> */} (Placeholder for Appointment Summary)</div>
        <div>{/* <MedicalHistory /> */} (Placeholder for Medical History)</div>
      </div>
    </div>
  );
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

```

# pages/dashboard/payments/pay/[appointmentId].tsx
```tsx
// pages/dashboard/payments/pay/[appointmentId].tsx
"use client";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CheckoutForm } from "@/components/payment/CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function PayForAppointmentPage() {
  const router = useRouter();
  const { appointmentId } = router.query;

  return (
    <ProtectedRoute>
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
            <CardDescription>
              Securely pay for your appointment (ID: {appointmentId})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {typeof appointmentId === "string" ? (
              <CheckoutForm appointmentId={appointmentId} />
            ) : (
              <p>Loading payment details...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

```

# pages/dashboard/payments/success.tsx
```tsx
// pages/dashboard/payments/success.tsx
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center text-center py-20">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-3xl font-bold">Payment Successful!</h1>
      <p className="mt-2 text-neutral-600">
        Thank you. Your payment has been confirmed and a receipt has been sent to your email.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
        <Link href="/dashboard/payments/receipt/placeholder-id">
          <Button variant="outline">View Receipt</Button>
        </Link>
      </div>
    </div>
  );
}

```

# pages/dashboard/profile/notifications.tsx
```tsx
// pages/dashboard/profile/notifications.tsx
"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
// import { NotificationPreferences } from "@/components/settings/NotificationPreferences";

export default function NotificationSettingsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <NotificationPreferences /> */}
            <p>(Placeholder for Notification Preferences Component)</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

```

# pages/dashboard/telemedicine/consultation/[appointmentId].tsx
```tsx
// pages/dashboard/telemedicine/consultation/[appointmentId].tsx
"use client";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VideoCall } from "@/components/telemedicine/VideoCall";
import { api } from "@/lib/trpc/client";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function TelemedicineConsultationPage() {
  const router = useRouter();
  const { appointmentId } = router.query;
  const { user } = useAuth();

  const { data, isLoading, error } =
    api.telemedicine.getTelemedicineSession.useQuery(
      { appointmentId: appointmentId as string },
      {
        enabled: !!appointmentId && !!user,
        retry: false, // Don't retry on error
      }
    );

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold">Video Consultation</h1>
        <div className="mt-6">
          {isLoading && <LoadingSpinner size={48} />}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {data?.roomUrl && (
            <VideoCall
              roomUrl={data.roomUrl}
              displayName={user?.user_metadata?.full_name ?? "Patient"}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

```

# pages/dashboard/vaccinations/index.tsx
```tsx
// pages/dashboard/vaccinations/index.tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/trpc/client";
// import { VaccinationRecordCard } from "@/components/vaccination/VaccinationRecordCard";

export default function VaccinationsPage() {
  const { data: _records, isLoading: _isLoading } = api.health.getPatientVaccinations.useQuery();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold">My Vaccination Records</h1>
        <div className="mt-8 space-y-4">
          {/* {isLoading && <p>Loading records...</p>}
          {records?.map(rec => <VaccinationRecordCard key={rec.id} record={rec} />)} */}
          <p>(Placeholder for a list of VaccinationRecordCard components)</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

```

# pages/doctor/consultations/[appointmentId].tsx
```tsx
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
  const { appointmentId: _appointmentId } = router.query;
  
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

```

# pages/doctor/dashboard/index.tsx
```tsx
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
          Here&apos;s an overview of your day, Dr. [Doctor&apos;s Name].
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

```

# pages/doctor/login.tsx
```tsx
// pages/doctor/login.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

// Minimal redirecting page: forward to the canonical /login page.
export default function DoctorLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}

```

# pages/doctor/patients/[patientId]/history.tsx
```tsx
// pages/doctor/patients/[patientId]/history.tsx
"use client";
import { useRouter } from "next/router";
import { api } from "@/lib/trpc/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PatientHistoryPage() {
  const router = useRouter();
  const { patientId } = router.query;
  
  const { data: _data, isLoading } = api.consultation.getPatientHistory.useQuery(
    { patientId: patientId as string },
    { enabled: !!patientId }
  );

  return (
    <ProtectedRoute>
      <DoctorLayout>
        <h1 className="text-3xl font-bold">Patient Medical History</h1>
        <div className="mt-8">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div>(Placeholder for Timeline of Medical Records)</div>
          )}
        </div>
      </DoctorLayout>
    </ProtectedRoute>
  );
}

```

# pages/doctor/schedule/index.tsx
```tsx
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

```

# pages/health-screening/index.tsx
```tsx
// pages/health-screening/index.tsx
import { api } from "@/lib/trpc/client";
// import { PackageCard } from "@/components/screening/PackageCard";

export default function HealthScreeningPage() {
  const { data: _packages, isLoading: _isLoading } = api.health.getScreeningPackages.useQuery();

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold">Health Screening Packages</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* {isLoading && <p>Loading packages...</p>}
        {packages?.map(pkg => <PackageCard key={pkg.id} package={pkg} />)} */}
        <p>(Placeholder for a grid of PackageCard components)</p>
      </div>
    </div>
  );
}

```

# pages/index.tsx
```tsx
// @/pages/index.tsx
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
          Welcome to Gabriel Family Clinic
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-700">
          Your neighborhood clinic, reimagined.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button size="lg">Book Appointment</Button>
          <Button size="lg" variant="outline">
            Our Services
          </Button>
        </div>
      </div>
      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Core Infrastructure Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This page demonstrates that the core layout, base UI components,
              and styling are all working correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

```

# pages/login.tsx
```tsx
// @/pages/login.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="container mx-auto flex h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Portal Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

```

# pages/register.tsx
```tsx
// @/pages/register.tsx
import { PatientRegistrationForm } from "@/components/forms/PatientRegistrationForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Join Gabriel Family Clinic to manage your health with ease.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}

```

# playwright.config.ts
```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Read from default ".env.local" file.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});

```

# postcss.config.js
```js
// postcss.config.js
export default {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

```

# prettier.config.js
```js
// prettier.config.js
/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
  tabWidth: 2,
  printWidth: 80,
};

export default config;

```

# prisma/schema.prisma
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    // NOTE: When using mysql or sqlserver, uncomment the @db.Text annotations in model Account below
    // Further reading:
    // https://next-auth.js.org/adapters/prisma#create-the-prisma-schema
    // https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string
    url      = env("DATABASE_URL")
}

model Post {
    id        Int      @id @default(autoincrement())
    name      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    createdBy   User   @relation(fields: [createdById], references: [id])
    createdById String

    @@index([name])
}

// Necessary for Next auth
model Account {
    id                       String  @id @default(cuid())
    userId                   String
    type                     String
    provider                 String
    providerAccountId        String
    refresh_token            String? // @db.Text
    access_token             String? // @db.Text
    expires_at               Int?
    token_type               String?
    scope                    String?
    id_token                 String? // @db.Text
    session_state            String?
    user                     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    refresh_token_expires_in Int?

    @@unique([provider, providerAccountId])
}

model Session {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
    id            String    @id @default(cuid())
    name          String?
    email         String?   @unique
    emailVerified DateTime?
    image         String?
    accounts      Account[]
    sessions      Session[]
    posts         Post[]
}

model VerificationToken {
    identifier String
    token      String   @unique
    expires    DateTime

    @@unique([identifier, token])
}

```

# src/app/_components/post.tsx
```tsx
"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

```

# src/app/api/auth/[...nextauth]/route.ts
```ts
import NextAuth from "next-auth/next";
import { authConfig } from "~/server/auth/config";

// `authConfig` is exported from `src/server/auth/config.ts` and is already typed
// as `NextAuthOptions`. Call NextAuth with that typed config directly to avoid
// `any` casts which break the project's ESLint rules.
const handler = NextAuth(authConfig);

export const { GET, POST } = handler;

```

# src/app/api/trpc/[trpc]/route.ts
```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };

```

# src/app/layout.tsx
```tsx
// src/app/layout.tsx
import "~/styles/globals.css";
import { type Metadata } from "next";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Create T3 App",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = { variable: "" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Simple: start in light mode; switch to dark by toggling class on html with JS or a theme switcher
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

```

# src/components/ui/button.tsx
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```

# src/components/ui/card.tsx
```tsx
import * as React from "react"

import { cn } from "~/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

```

# src/components/ui/input.tsx
```tsx
import * as React from "react"

import { cn } from "~/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

```

# src/components/ui/label.tsx
```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "~/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }

```

# src/components/ui/select.tsx
```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "~/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

```

# src/components/ui/textarea.tsx
```tsx
import * as React from "react"

import { cn } from "~/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

```

# src/env.js
```js
// src/env.js
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    APP_ENCRYPTION_KEY: z.string().min(32),
    // Optional integrations keys (make optional so local/CI builds without secrets succeed)
    DAILY_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_DOMAIN: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // Optional public keys used by client-side integrations
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
    DAILY_API_KEY: process.env.DAILY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_DOMAIN: process.env.RESEND_DOMAIN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

```

# src/lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

# src/server/api/root.ts
```ts
import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

```

# src/server/api/routers/post.ts
```ts
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });

    return post ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

```

# src/server/api/trpc.ts
```ts
/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

```

# src/server/auth/config.ts
```ts
// src/server/auth/config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { type DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  providers: [
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),
    // Add more providers here as needed
  ],

  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },

  // NOTE: `trustHost` and `basePath` are not part of NextAuthOptions type in
  // the installed `next-auth` version. If you need custom routing or host
  // trust configuration, set those in the NextAuth handler or framework-level
  // configuration instead of here.
};


```

# src/server/auth/index.ts
```ts
import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };

```

# src/server/db.ts
```ts
import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

```

# src/styles/globals.css
```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CSS variables for the color palette */
    --color-primary: 255 107 107; /* #FF6B6B */
    --color-secondary: 78 205 196; /* #4ECDC4 */
    
    /* Mantine overrides can go here if needed */
  }

  body {
    @apply bg-neutral-100 text-neutral-900;
    font-size: 18px; /* Larger base size for elderly-friendly design */
  }
}

```

# src/trpc/query-client.ts
```ts
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

```

# src/trpc/react.tsx
```tsx
"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import { type AppRouter } from "~/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

```

# src/trpc/server.ts
```ts
import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { createCaller, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);

```

# styles/theme.ts
```ts
// @/styles/theme.ts
"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

// Generating a 10-shade tuple for our primary color
const primaryColor: MantineColorsTuple = [
  "#ffe3e3",
  "#ffc9c9",
  "#ffa8a8",
  "#ff8585",
  "#ff6b6b", // Main shade at index 4
  "#ff5f5f",
  "#ff5c5c",
  "#e64b4b",
  "#cf4343",
  "#b83939",
];

export const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  primaryColor: "primary",
  colors: {
    primary: primaryColor,
  },
  headings: {
    fontFamily: "Inter, sans-serif",
  },
  fontSizes: {
    xs: "14px",
    sm: "16px",
    md: "18px", // Base size
    lg: "20px",
    xl: "22px",
  },
});

```

# tailwind.config.js
```js
// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Implementing the design system from Project_Requirements_Document
      colors: {
        primary: {
          DEFAULT: "#FF6B6B", // coral
          light: "#FF9999",
          dark: "#E55555",
        },
        secondary: {
          DEFAULT: "#4ECDC4", // teal
          light: "#87BBA2", // sage
          background: "#F7E7CE", // sand
        },
        neutral: {
          900: "#1A202C", // Text
          700: "#4A5568", // Secondary text
          500: "#A0AEC0", // Disabled
          100: "#F7FAFC", // Backgrounds
        },
        semantic: {
          success: "#48BB78",
          warning: "#F6AD55",
          error: "#F56565",
          info: "#4299E1",
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        heading: ["Inter", ...fontFamily.sans],
      },
      fontSize: {
        base: "18px", // Larger base for readability
      },
    },
  },
  plugins: [],
};

```

# tsconfig.json
```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "module": "esnext",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*", "src/components/*"],
      "@/lib/*": ["lib/*", "src/lib/*"],
      "@/styles/*": ["styles/*", "src/styles/*"],
      "@/hooks/*": ["hooks/*", "src/hooks/*"],
      "@/types/*": ["types/*", "src/types/*"],
      "@/env": ["src/env.js", "env.js"],
      "~/*": ["src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "playwright.config.ts"
  ],
  "exclude": ["node_modules", "components/ui/Textarea.tsx"]
}

```

# types/database.types.ts
```ts
// types/database.types.ts
// Minimal generated-type stubs used by server utilities. These should be
// replaced by generated Prisma/Supabase types when available.

export type ChasCardType = "blue" | "orange" | "green" | "none";

export default {};

```

# types/zod-schemas.ts
```ts
// @/types/zod-schemas.ts
import { z } from "zod";

// Schema for the patient registration form
export const patientRegistrationSchema = z
  .object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().regex(/^[89]\d{7}$/, { message: "Please enter a valid Singapore mobile number." }),
    nric: z.string().regex(/^[STFG]\d{7}[A-Z]$/i, { message: "Please enter a valid NRIC number." }),
    dateOfBirth: z.string().refine((dob) => new Date(dob) < new Date(), { message: "Date of birth must be in the past." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Point error to the confirmPassword field
  });

export type PatientRegistrationSchema = z.infer<typeof patientRegistrationSchema>;

// Schema for creating a new appointment
export const createAppointmentSchema = z.object({
  clinicId: z.string().uuid(),
  doctorId: z.string().uuid(),
  slotDate: z.string(), // YYYY-MM-DD
  slotTime: z.string(), // HH:MM
  visitReason: z.string().optional(),
});

export type CreateAppointmentSchema = z.infer<typeof createAppointmentSchema>;

```

