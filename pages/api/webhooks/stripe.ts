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
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);

      const paymentId = paymentIntent.metadata?.paymentId as string | undefined;
      if (!paymentId) {
        console.error("❌ Missing paymentId in webhook metadata");
        break; // Acknowledge event but log error
      }

      const supabaseAdmin = createSupabaseAdminClient();

      // Mark payment as completed. Keep this focused and safe:
      // - status: "completed"
      // - transaction_reference: latest_charge from Stripe
      // Note:
      // - Paid/outstanding reconciliation can be handled by a dedicated SQL function
      //   or a follow-up job if needed. We avoid over-encoding business rules here.
      const { error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          transaction_reference: paymentIntent.latest_charge as string,
        })
        .eq("id", paymentId);

      if (error) {
        console.error(`❌ Failed to update payment record ${paymentId}:`, error);
        // We keep 200 to avoid infinite Stripe retries; errors are logged for ops review.
      } else {
        console.log(`✅ Payment record ${paymentId} updated to completed.`);
      }

      break;
    }

    // ... handle other event types (e.g., payment_intent.payment_failed)

    default:
      console.log(`🤷‍♀️ Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
