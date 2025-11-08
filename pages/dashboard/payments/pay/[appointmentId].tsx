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
