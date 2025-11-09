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
