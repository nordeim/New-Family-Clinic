"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * MVP Booking Page
 *
 * Phase 1:
 * - Provides a clear, dedicated entry point for booking from landing CTAs.
 * - Purely client-side UX: collects details and shows a confirmation message.
 * - No real booking persistence yet (to be wired in Phase 2 via tRPC/appointment service).
 *
 * Design goals:
 * - Senior-friendly, warm, aligned with "Healthcare with Heart".
 * - Minimal fields: name, phone, visit reason, preferred date/time.
 * - Clear disclaimer: clinic will confirm via call/WhatsApp; no emergencies.
 */

const SCROLL_OFFSET = 80;

function scrollToForm() {
  const el = document.getElementById("booking-form");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const top = rect.top + window.scrollY - SCROLL_OFFSET;
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    window.scrollTo(0, top);
  } else {
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export default function BookingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Ensure we start near the form for a focused experience
    const handle = window.setTimeout(scrollToForm, 150);
    return () => window.clearTimeout(handle);
  }, []);

  const requestBooking = api.appointment.requestBooking.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const get = (id: string) =>
      (form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.value ?? "").trim();

    const setError = (id: string, message: string) => {
      const el = form.querySelector<HTMLElement>(`[data-error-for="${id}"]`);
      if (el) el.textContent = message;
    };

    const clearErrors = () => {
      form
        .querySelectorAll<HTMLElement>("[data-error-for]")
        .forEach((el) => {
          el.textContent = "";
        });
    };

    const showToast = (message: string) => {
      const toast = document.getElementById("booking-toast");
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 2600);
    };

    clearErrors();

    const name = get("bk-name");
    const phoneRaw = get("bk-phone");
    const reason = get("bk-reason");
    const when = get("bk-when");

    let valid = true;

    if (!name) {
      setError("bk-name", "Please enter your full name.");
      valid = false;
    }

    const digits = phoneRaw.replace(/\D/g, "");
    const firstDigit = digits[0] ?? "";
    if (!(digits.length === 8 && ["6", "8", "9"].includes(firstDigit))) {
      setError(
        "bk-phone",
        "Enter a valid Singapore mobile number (8 digits, starting with 6/8/9)."
      );
      valid = false;
    }

    if (!reason || reason.length < 4) {
      setError("bk-reason", "Tell us briefly why you are visiting.");
      valid = false;
    }

    if (!when) {
      setError("bk-when", "Select or enter a preferred date/time.");
      valid = false;
    }

    if (!valid) return;

    const contactPrefInput = form.querySelector<HTMLInputElement>(
      'input[name="bk-contact"]:checked'
    );
    const contactPreference =
      (contactPrefInput?.value as "whatsapp" | "call" | "either" | undefined) ?? "whatsapp";

    const idempotencyKey =
      (window.crypto && "randomUUID" in window.crypto
        ? window.crypto.randomUUID()
        : `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`);

    try {
      setSubmitting(true);
      const result = await requestBooking.mutateAsync({
        name,
        phone: phoneRaw,
        reason,
        preferredTime: when,
        contactPreference,
        idempotencyKey,
      });

      form.reset();
      showToast(
        result?.message ??
          "Thank you. We’ve received your request. Our team will contact you shortly to confirm your appointment."
      );
    } catch (error) {
      // Surface a friendly message; avoid leaking implementation details
      const message =
        error instanceof Error && error.message
          ? error.message
          : "We could not submit your request. Please try again or call the clinic.";
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-900">
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-4 text-[10px] text-[#ff6b6b] hover:underline"
        >
          ← Back to Home
        </button>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Book an Appointment with Gabriel Family Clinic
          </h1>
          <p className="mt-2 text-[12px] text-slate-600 max-w-2xl">
            Share a few simple details and our care team will personally confirm your slot via
            WhatsApp or phone. No complicated portals, no long forms — just warm, human support.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-[#2e7d68]">
            <span className="px-2 py-[3px] rounded-full bg-[#2e7d6815]">
              Same-day & next-day slots available
            </span>
            <span className="px-2 py-[3px] rounded-full bg-[#2e7d6815]">
              CHAS & Medisave friendly
            </span>
            <span className="px-2 py-[3px] rounded-full bg-[#2e7d6815]">
              Senior-friendly, Healthier SG aligned
            </span>
          </div>
        </header>

        <section
          id="booking-form"
          className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-[#ff6b6b26]"
        >
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            Step 1 — Tell us how to reach you
          </h2>
          <p className="text-[10px] text-slate-600 mb-3">
            We will confirm your appointment via call or WhatsApp within clinic hours. For
            emergencies, please call 995 or go to the nearest A&E immediately.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="bk-name"
                  className="text-[9px] font-medium text-slate-800"
                >
                  Full Name
                </label>
                <Input
                  id="bk-name"
                  placeholder="E.g. Lim Mei Ling"
                  className="h-8 text-[10px] rounded-xl bg-white"
                />
                <p
                  data-error-for="bk-name"
                  className="min-h-[10px] text-[8px] text-[#dc2626]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="bk-phone"
                  className="text-[9px] font-medium text-slate-800"
                >
                  Mobile Number (Singapore)
                </label>
                <Input
                  id="bk-phone"
                  type="tel"
                  placeholder="E.g. 91234567"
                  className="h-8 text-[10px] rounded-xl bg-white"
                />
                <p
                  data-error-for="bk-phone"
                  className="min-h-[10px] text-[8px] text-[#dc2626]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="bk-reason"
                className="text-[9px] font-medium text-slate-800"
              >
                Reason for Visit
              </label>
              <Textarea
                id="bk-reason"
                rows={3}
                placeholder="E.g. Fever and cough for 2 days, follow-up for diabetes, health screening enquiry."
                className="text-[10px] rounded-xl bg-white"
              />
              <p
                data-error-for="bk-reason"
                className="min-h-[10px] text-[8px] text-[#dc2626]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="bk-when"
                  className="text-[9px] font-medium text-slate-800"
                >
                  Preferred Date & Time
                </label>
                <Input
                  id="bk-when"
                  type="text"
                  placeholder="E.g. Today after 6pm, Sat 10–12pm"
                  className="h-8 text-[10px] rounded-xl bg-white"
                />
                <p
                  data-error-for="bk-when"
                  className="min-h-[10px] text-[8px] text-[#dc2626]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-medium text-slate-800">
                  Contact Preference
                </span>
                <div className="flex flex-wrap gap-2 text-[9px] text-slate-700">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="bk-contact"
                      value="whatsapp"
                      defaultChecked
                      className="size-3"
                    />
                    WhatsApp
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="bk-contact"
                      value="call"
                      className="size-3"
                    />
                    Call
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="bk-contact"
                      value="either"
                      className="size-3"
                    />
                    Either is fine
                  </label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                "mt-2 w-full h-9 rounded-full text-[10px]",
                "bg-[#ff6b6b] hover:bg-[#e05555] shadow-md",
                submitting && "opacity-80 cursor-wait"
              )}
            >
              {submitting ? "Submitting..." : "Submit Booking Request"}
            </Button>

            <p className="text-[8px] text-slate-500 mt-1">
              By submitting, you consent to our clinic contacting you for appointment scheduling
              and follow-up. No payment is collected online. For life-threatening conditions,
              please call 995 immediately.
            </p>
          </form>
        </section>
      </div>

      <div
        id="booking-toast"
        className="fixed right-4 bottom-4 px-4 py-2 rounded-full bg-[#2e7d68] text-white text-[9px] shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2"
      />
    </div>
  );
}