// @/hooks/use-queue-status.ts
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { api } from "@/lib/trpc/client";

type QueueStatus = {
  current_number: string;
  // ... other fields
};

export function useQueueStatus(clinicId: string) {
  const { data: initialData } = api.clinic.getQueueStatus.useQuery({ clinicId });
  const [status, setStatus] = useState<QueueStatus | null>(initialData ?? null);

  useEffect(() => {
    if (!clinicId) return;

    const channel = supabase
      .channel(`queue-updates-${clinicId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_management",
          filter: `clinic_id=eq.${clinicId}`,
        },
        (payload) => {
          setStatus(payload.new as QueueStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId]);

  return status;
}
