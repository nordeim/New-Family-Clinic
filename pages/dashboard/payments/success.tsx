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
