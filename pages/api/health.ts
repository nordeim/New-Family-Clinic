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
