// @/lib/trpc/routers/clinic.router.ts
import { router, publicProcedure } from "../server";
import { z } from "zod";

export const clinicRouter = router({
  getQueueStatus: publicProcedure
    .input(z.object({ clinicId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("queue_management")
        .select("current_number, last_called_number, average_wait_time_minutes")
        .eq("clinic_id", input.clinicId)
        .eq("queue_date", new Date().toISOString().split("T")[0])
        .single();
        
      if (error) {
        // It's okay if no queue exists for today, return null
        if (error.code === 'PGRST116') return null; 
        throw new Error("Failed to fetch queue status.");
      }
      return data;
    }),
});
