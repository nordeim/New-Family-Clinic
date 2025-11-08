// components/payment/CheckoutForm.tsx
"use client";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { api } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PaymentForm } from "./PaymentForm";
import { PriceBreakdown } from "./PriceBreakdown";
import { env } from "@/env";

// Load Stripe once outside of the component to avoid recreating it on every render.
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  appointmentId: string;
}

export function CheckoutForm({ appointmentId }: CheckoutFormProps) {
  const {
    data,
    isLoading: isCreatingIntent,
    error,
  } = api.payment.createPaymentIntent.useMutation();

  useEffect(() => {
    // Automatically create the payment intent when the component mounts
    if (appointmentId) {
      data.mutate({ appointmentId });
    }
  }, [appointmentId, data.mutate]);
  
  const { clientSecret, totalAmount, subsidyAmount, originalAmount } = data?.data ?? {};

  const options = { clientSecret };

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
