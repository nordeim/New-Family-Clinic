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
