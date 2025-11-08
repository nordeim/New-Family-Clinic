// lib/integrations/stripe.ts
import Stripe from "stripe";
import { env } from "@/env";

/**
 * A singleton instance of the Stripe SDK, initialized with the secret key.
 * This should never be exposed to the client-side.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10", // Use the latest API version
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
      env.STRIPE_WEBHOOK_SECRET
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
