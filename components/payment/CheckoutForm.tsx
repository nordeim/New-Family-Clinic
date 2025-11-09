// components/payment/CheckoutForm.tsx
"use client";
import { useEffect, useState } from "react";
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
