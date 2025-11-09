// lib/jobs/queue.ts
"use server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { JobPayloads, JobType } from "./types";

const MAX_ATTEMPTS = 5;

// All job handlers are defined in this map.
const jobHandlers = {
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

    const handler = jobHandlers[job.queue as JobType];
    if (!handler) {
      await this.markAsFailed(job.id, "No handler found for queue.");
      return;
    }

    try {
      await handler(job.payload);
      await this.markAsCompleted(job.id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      if (job.attempts + 1 >= MAX_ATTEMPTS) {
        await this.markAsFailed(job.id, message);
      } else {
        await this.retryJob(job.id, message);
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
