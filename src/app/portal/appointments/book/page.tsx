"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

/**
 * Authenticated Patient Booking Page
 *
 * Purpose:
 * - Provide a simple, real slot-selection UI for logged-in patients.
 * - Uses:
 *   - api.appointment.getAvailableSlots to list available slots.
 *   - api.appointment.requestBooking to create a real appointment
 *     via booking.create_booking (through AppointmentService).
 *
 * Notes:
 * - This is an MVP vertical slice:
 *   - Single clinic (clinicId can be wired from config/props later).
 *   - Simple list of next available slots.
 *   - Minimal error handling but production-safe messages.
 * - Requires that the tRPC caller provides session.user.id in ctx (protectedProcedure).
 */

const DEFAULT_CLINIC_ID = ""; // TODO: inject from config/system settings.

type Slot = {
  id: string;
  clinic_id: string;
  doctor_id: string | null;
  slot_date: string;
  slot_time: string;
  duration_minutes: number | null;
  is_available: boolean;
};

export default function PatientBookAppointmentPage() {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [visitReason, setVisitReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    data: slots,
    isLoading,
    isError,
  } = api.appointment.getAvailableSlots.useQuery(
    {
      clinicId: DEFAULT_CLINIC_ID || "00000000-0000-0000-0000-000000000000",
    },
    {
      enabled: Boolean(DEFAULT_CLINIC_ID),
    },
  );

  const requestBooking = api.appointment.requestBooking.useMutation();

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setFeedback("Please select a slot first.");
      return;
    }
    if (!visitReason || visitReason.trim().length < 4) {
      setFeedback("Please provide a brief reason for your visit.");
      return;
    }

    const idempotencyKey = `portal-booking-${selectedSlot.id}-${Date.now()}`;

    try {
      setSubmitting(true);
      setFeedback(null);

      const result = await requestBooking.mutateAsync({
        clinicId: selectedSlot.clinic_id,
        slotId: selectedSlot.id,
        visitReason: visitReason.trim(),
        idempotencyKey,
      });

      if (result.status === "success") {
        setFeedback(
          result.appointmentNumber
            ? `Your appointment is confirmed. Number: ${result.appointmentNumber}.`
            : "Your appointment is confirmed.",
        );
        setTimeout(() => {
          router.push("/portal/appointments");
        }, 1500);
      } else {
        setFeedback(
          result.message ||
            "We received your request. Please check your appointments or contact the clinic.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "We could not complete your booking. Please try again or contact the clinic.";
      setFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff7f2] text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Book an Appointment</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/portal/appointments")}
            className="text-[10px]"
          >
            Back to My Appointments
          </Button>
        </div>

        <p className="text-[10px] text-slate-600">
          Choose an available slot below and tell us briefly why you&apos;re visiting. This flow
          creates a real appointment in the clinic system using the same engine that staff use,
          ensuring no double-bookings.
        </p>

        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold text-slate-800">
            1 — Select an available slot
          </h2>
          {(!DEFAULT_CLINIC_ID || isError) && (
            <p className="text-[9px] text-red-600">
              Booking configuration is incomplete. Please contact the clinic administrator.
            </p>
          )}
          {isLoading && (
            <p className="text-[9px] text-slate-600">Loading available slots...</p>
          )}
          {!isLoading && slots && slots.length === 0 && (
            <p className="text-[9px] text-slate-600">
              No available slots were found. Please try again later or contact the clinic.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {slots?.map((slot) => {
              const normalizedSlot = slot as unknown as Slot;
              const isSelected = selectedSlot?.id === normalizedSlot.id;
              return (
                <Card
                  key={normalizedSlot.id}
                  onClick={() => handleSelectSlot(normalizedSlot)}
                  className={`cursor-pointer border text-[9px] p-2 ${
                    isSelected
                      ? "border-[#ff6b6b] bg-[#fff0ec]"
                      : "border-slate-200 hover:border-[#ff6b6b40]"
                  }`}
                >
                  <div className="font-semibold text-slate-800">
                    {normalizedSlot.slot_date} • {normalizedSlot.slot_time}
                  </div>
                  <div className="text-[8px] text-slate-600">
                    Duration: {normalizedSlot.duration_minutes ?? 15} minutes
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold text-slate-800">
            2 — Reason for visit
          </h2>
          <Textarea
            value={visitReason}
            onChange={(e) => setVisitReason(e.target.value)}
            rows={3}
            placeholder="E.g. Follow-up for hypertension, new cough/fever, medication review."
            className="text-[10px] rounded-xl bg-white"
          />
        </section>

        <section className="space-y-2">
          <Button
            disabled={submitting || !selectedSlot || !visitReason}
            onClick={handleSubmit}
            className="w-full h-9 rounded-full text-[10px] bg-[#ff6b6b] hover:bg-[#e05555] shadow-md disabled:opacity-60"
          >
            {submitting ? "Booking your appointment..." : "Confirm Appointment"}
          </Button>
          {feedback && (
            <p className="text-[9px] text-slate-700">{feedback}</p>
          )}
          <p className="text-[8px] text-slate-500">
            For emergencies, please call 995 or go to the nearest A&E immediately.
          </p>
        </section>
      </div>
    </main>
  );
}