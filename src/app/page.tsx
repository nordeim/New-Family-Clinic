"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const rect = el.getBoundingClientRect()
  const offset = 80
  const top = rect.top + window.scrollY - offset
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (prefersReduced) {
    window.scrollTo(0, top)
  } else {
    window.scrollTo({ top, behavior: "smooth" })
  }
}

function useLandingInteractions() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const link = target.closest<HTMLElement>("[data-scroll-target]")
      if (!link) return
      const href = link.getAttribute("data-scroll-target")
      if (!href || !href.startsWith("#")) return
      const id = href.slice(1)
      e.preventDefault()
      scrollToId(id)
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [])

  useEffect(() => {
    const toggle = document.querySelector<HTMLButtonElement>("[data-senior-toggle]")
    const body = document.body
    const KEY = "gfc_senior_mode"

    const applyFromStorage = () => {
      try {
        const stored = window.localStorage.getItem(KEY)
        if (stored === "on") {
          body.classList.add("senior-mode")
          if (toggle) toggle.setAttribute("aria-pressed", "true")
        }
      } catch {
        // ignore
      }
    }

    const showToast = (message: string) => {
      const toast = document.getElementById("gfc-toast")
      if (!toast) return
      toast.textContent = message
      toast.classList.add("is-visible")
      window.setTimeout(() => toast.classList.remove("is-visible"), 2600)
    }

    const handleToggle = () => {
      const isOn = body.classList.toggle("senior-mode")
      if (toggle) toggle.setAttribute("aria-pressed", isOn ? "true" : "false")
      try {
        window.localStorage.setItem(KEY, isOn ? "on" : "off")
      } catch {
        // ignore
      }
      showToast(
        isOn
          ? "Senior-friendly mode enabled: larger text & higher contrast."
          : "Senior-friendly mode disabled."
      )
    }

    applyFromStorage()
    if (toggle) toggle.addEventListener("click", handleToggle)

    return () => {
      if (toggle) toggle.removeEventListener("click", handleToggle)
    }
  }, [])

  useEffect(() => {
    const quickForm = document.getElementById(
      "quick-booking-form"
    ) as HTMLFormElement | null
    const contactForm = document.getElementById(
      "contact-form"
    ) as HTMLFormElement | null

    const setError = (id: string, msg: string) => {
      const el = document.querySelector<HTMLElement>(
        `[data-error-for="${id}"]`
      )
      if (el) el.textContent = msg
    }

    const clearErrors = (form: HTMLFormElement) => {
      form
        .querySelectorAll<HTMLElement>("[data-error-for]")
        .forEach((el) => (el.textContent = ""))
    }

    const showToast = (message: string) => {
      const toast = document.getElementById("gfc-toast")
      if (!toast) return
      toast.textContent = message
      toast.classList.add("is-visible")
      window.setTimeout(() => toast.classList.remove("is-visible"), 2600)
    }

    const validatePhoneSG = (phone: string) => {
      const digits = phone.replace(/\D/g, "")
      if (digits.length !== 8) return false
      const first = digits[0]
      return first === "6" || first === "8" || first === "9"
    }

    const validateEmail = (email: string) => {
      if (!email) return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const handleQuickSubmit = (e: Event) => {
      if (!quickForm) return
      e.preventDefault()
      clearErrors(quickForm)
      const name = (document.getElementById("qb-name") as HTMLInputElement | null)
        ?.value.trim() || ""
      const phone = (document.getElementById("qb-phone") as HTMLInputElement | null)
        ?.value.trim() || ""
      const reason = (document.getElementById("qb-reason") as HTMLSelectElement | null)
        ?.value.trim() || ""
      const slot = (document.getElementById("qb-slot") as HTMLSelectElement | null)
        ?.value.trim() || ""

      let valid = true
      if (!name) {
        setError("qb-name", "Please enter your full name.")
        valid = false
      }
      if (!validatePhoneSG(phone)) {
        setError("qb-phone", "Enter a valid Singapore mobile number.")
        valid = false
      }
      if (!reason) {
        setError("qb-reason", "Select a reason for your visit.")
        valid = false
      }
      if (!slot) {
        setError("qb-slot", "Select a preferred slot.")
        valid = false
      }

      if (!valid) return
      quickForm.reset()
      showToast(
        "Thank you, we’ve recorded your request. Our team will call to confirm your slot."
      )
    }

    const handleContactSubmit = (e: Event) => {
      if (!contactForm) return
      e.preventDefault()
      clearErrors(contactForm)
      const name = (document.getElementById("cf-name") as HTMLInputElement | null)
        ?.value.trim() || ""
      const email = (document.getElementById("cf-email") as HTMLInputElement | null)
        ?.value.trim() || ""
      const message = (
        document.getElementById("cf-message") as HTMLTextAreaElement | null
      )?.value.trim() || ""

      let valid = true
      if (!name) {
        setError("cf-name", "Please enter your name.")
        valid = false
      }
      if (!validateEmail(email)) {
        setError("cf-email", "Enter a valid email address.")
        valid = false
      }
      if (!message || message.length < 8) {
        setError(
          "cf-message",
          "Tell us a bit more so we can assist you meaningfully."
        )
        valid = false
      }

      if (!valid) return
      contactForm.reset()
      showToast("Thank you. Your message has been recorded.")
    }

    if (quickForm) quickForm.addEventListener("submit", handleQuickSubmit)
    if (contactForm) contactForm.addEventListener("submit", handleContactSubmit)

    return () => {
      if (quickForm) quickForm.removeEventListener("submit", handleQuickSubmit)
      if (contactForm)
        contactForm.removeEventListener("submit", handleContactSubmit)
    }
  }, [])

  useEffect(() => {
    const yearEl = document.getElementById("gfc-year")
    if (yearEl) yearEl.textContent = new Date().getFullYear().toString()
  }, [])
}

export default function LandingPage() {
  useLandingInteractions()

  return (
    <div className="gfc-landing bg-[#fff7f2] text-slate-900 min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-[#fff7f2]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#ff6b6b] text-white flex items-center justify-center shadow-md text-base">
              🏥
            </div>
            <div className="flex flex-col">
              <div className="font-semibold text-sm">
                Gabriel Family Clinic
              </div>
              <div className="text-[10px] text-slate-500">
                Healthcare with Heart · Serangoon · Singapore
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px]">
              <span className="px-2 py-[2px] rounded-full bg-[#ff6b6b1f] text-[#e05555] border border-[#ff6b6b40]">
                EN
              </span>
              <span className="px-2 py-[2px] rounded-full text-slate-500 border border-transparent">
                中文
              </span>
              <span className="px-2 py-[2px] rounded-full text-slate-500 border border-transparent">
                BM
              </span>
              <span className="px-2 py-[2px] rounded-full text-slate-500 border border-transparent">
                தமிழ்
              </span>
            </div>
            <a
              href="tel:+6591234567"
              className="hidden sm:inline-flex text-[10px] px-3 py-1 rounded-full border border-transparent text-[#e05555] hover:bg-[#ff6b6b1a] transition"
            >
              Call Now
            </a>
            <Button
              className="hidden sm:inline-flex rounded-full h-7 px-4 text-[10px] bg-[#ff6b6b] hover:bg-[#e05555] shadow-md"
              onClick={() => {
                window.location.href = "/booking";
              }}
            >
              Book Appointment
            </Button>
            <button
              type="button"
              data-senior-toggle
              aria-pressed="false"
              className="w-8 h-8 rounded-full border border-[#ff6b6b40] text-[11px] font-semibold text-[#e05555] flex items-center justify-center hover:bg-[#ff6b6b10] transition"
            >
              A+
            </button>
          </div>
        </div>
        {/* Simple nav */}
        <nav className="max-w-5xl mx-auto px-4 pb-2 flex flex-wrap gap-3 items-center text-[10px] text-slate-500">
          <span className="font-semibold text-[10px] text-slate-600">
            Healthcare with Heart
          </span>
          <div className="flex flex-wrap gap-3">
            {[
              ["Home", "#top"],
              ["Why Us", "#why-us"],
              ["Services", "#services"],
              ["Our Doctors", "#doctors"],
              ["For Patients", "#for-patients"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <button
                key={href}
                data-scroll-target={href}
                className="hover:text-[#ff6b6b] transition"
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main id="top">
        <section className="py-10">
          <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-[1.7fr_minmax(0,1.3fr)] gap-8 items-stretch">
            <div>
              <h1 className="font-semibold text-3xl sm:text-[2.3rem] leading-tight text-slate-900">
                Healthcare with Heart,{" "}
                <span className="text-[#ff6b6b]">
                  right in your neighborhood.
                </span>
              </h1>
              <p className="mt-3 text-[13px] text-slate-600 max-w-xl">
                Same-day family care, senior-friendly service, and Healthier SG
                aligned chronic care — thoughtfully designed for Singapore
                families and grandparents.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  className="rounded-full h-10 px-6 bg-[#ff6b6b] hover:bg-[#e05555] text-xs shadow-lg"
                  onClick={() => {
                    window.location.href = "/booking";
                  }}
                >
                  Book an Appointment
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-6 text-xs border border-[#ff6b6b33] bg-white shadow-sm hover:bg-[#fff7f2]"
                  onClick={() => scrollToId("contact")}
                >
                  View Clinic Hours
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap gap-5 text-[10px] text-slate-600">
                <div>
                  <div className="text-[9px] uppercase tracking-wide text-slate-400">
                    Google Rating
                  </div>
                  <div className="text-sm font-semibold text-[#e05555]">
                    4.9★
                  </div>
                  <div>From our happy families</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wide text-slate-400">
                    Same-Day Slots
                  </div>
                  <div className="text-sm font-semibold text-[#e05555]">
                    Available
                  </div>
                  <div>Urgent but non-emergency care</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wide text-slate-400">
                    CHAS / Medisave
                  </div>
                  <div className="text-sm font-semibold text-[#e05555]">
                    Accepted
                  </div>
                  <div>Transparent subsidies & fees</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "MOH-compliant Care",
                  "PDPA-Safe Records",
                  "Healthier SG Ready",
                ].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center px-3 py-[3px] rounded-full bg-[#2e7d6815] text-[9px] text-[#2e7d68]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Booking Card */}
            <aside
              id="hero-book"
              className="bg-white/95 border border-[#ff6b6b33] shadow-xl rounded-2xl p-4 flex flex-col gap-3"
            >
              <h2 className="text-sm font-semibold text-slate-900">
                Next Available Slots
              </h2>
              <ul className="text-[10px] text-slate-600 space-y-1">
                <li className="flex justify-between">
                  <span>Today</span>
                  <span>4:30 PM · Dr. Tan</span>
                </li>
                <li className="flex justify-between">
                  <span>Today</span>
                  <span>6:00 PM · Dr. Lee</span>
                </li>
                <li className="flex justify-between">
                  <span>Tomorrow</span>
                  <span>9:00 AM · Dr. Kumar</span>
                </li>
              </ul>
              <form
                id="quick-booking-form"
                className="mt-1 flex flex-col gap-2"
                noValidate
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="qb-name"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Full Name
                  </label>
                  <Input
                    id="qb-name"
                    placeholder="E.g. Lim Mei Ling"
                    className="h-8 text-[10px] rounded-xl bg-white"
                  />
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="qb-name"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="qb-phone"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Mobile Number
                  </label>
                  <Input
                    id="qb-phone"
                    type="tel"
                    placeholder="E.g. 91234567"
                    className="h-8 text-[10px] rounded-xl bg-white"
                  />
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="qb-phone"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="qb-reason"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Visit Reason
                  </label>
                  <select
                    id="qb-reason"
                    className={cn(
                      "h-8 text-[10px] rounded-xl border px-2 bg-white",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b33]"
                    )}
                  >
                    <option value="">Select one</option>
                    <option value="acute">Flu / Fever / Cough</option>
                    <option value="chronic">Chronic Check-up</option>
                    <option value="screening">Health Screening</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="other">Other</option>
                  </select>
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="qb-reason"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="qb-slot"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Preferred Slot
                  </label>
                  <select
                    id="qb-slot"
                    className={cn(
                      "h-8 text-[10px] rounded-xl border px-2 bg-white",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b33]"
                    )}
                  >
                    <option value="">Select a sample slot</option>
                    <option value="today-430">
                      Today · 4:30 PM · Dr. Tan
                    </option>
                    <option value="today-600">
                      Today · 6:00 PM · Dr. Lee
                    </option>
                    <option value="tomorrow-900">
                      Tomorrow · 9:00 AM · Dr. Kumar
                    </option>
                  </select>
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="qb-slot"
                  />
                </div>
                <Button
                  type="submit"
                  className="mt-1 w-full h-8 rounded-full text-[9px] bg-[#ff6b6b] hover:bg-[#e05555] shadow-md"
                >
                  Request Callback to Confirm
                </Button>
                <p className="text-[8px] text-slate-500">
                  No payment required online. Our team will confirm your slot via
                  call or WhatsApp.
                </p>
              </form>
            </aside>
          </div>
        </section>

        {/* Why Us */}
        <section id="why-us" className="py-10 bg-[#fdefea]">
          <div className="max-w-5xl mx-auto px-4">
            <header className="text-center max-w-xl mx-auto mb-7">
              <h2 className="text-xl font-semibold text-slate-900">
                Why Families Choose Gabriel Family Clinic
              </h2>
              <p className="text-[12px] text-slate-600">
                Built for grandparents, busy parents, and little ones — with
                warmth, clarity, and genuine care.
              </p>
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-[10px]">
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                <div className="text-lg mb-1">👵</div>
                <h3 className="font-semibold text-xs mb-1">
                  Senior-Friendly by Design
                </h3>
                <p className="text-slate-600">
                  Large text, clear wayfinding, and gentle guidance for seniors
                  to use independently.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                <div className="text-lg mb-1">🔍</div>
                <h3 className="font-semibold text-xs mb-1">
                  Transparent & Honest
                </h3>
                <p className="text-slate-600">
                  Upfront pricing, CHAS & Medisave support, and no hidden
                  fees.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                <div className="text-lg mb-1">🩺</div>
                <h3 className="font-semibold text-xs mb-1">
                  Trusted Family Doctors
                </h3>
                <p className="text-slate-600">
                  Continuity of care with doctors who know your family’s story.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                <div className="text-lg mb-1">🇸🇬</div>
                <h3 className="font-semibold text-xs mb-1">
                  Healthier SG Ready
                </h3>
                <p className="text-slate-600">
                  Preventive care and chronic management aligned with MOH’s
                  Healthier SG.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-10">
          <div className="max-w-5xl mx-auto px-4">
            <header className="text-center max-w-xl mx-auto mb-7">
              <h2 className="text-xl font-semibold text-slate-900">
                Essential Care, Clearly Presented
              </h2>
              <p className="text-[12px] text-slate-600">
                Everyday family medicine, chronic care, screenings, and
                vaccinations — no clutter, no confusion.
              </p>
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-[10px]">
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-xs mb-1">Family Medicine</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Flu, fever, cough, cold</li>
                  <li>Minor injuries & infections</li>
                  <li>Child & adult consults</li>
                </ul>
                <div className="mt-2 text-[10px] font-semibold text-[#2e7d68]">
                  From $28 consultation
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-xs mb-1">Chronic Care</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Diabetes, Hypertension, Lipids</li>
                  <li>Medication review</li>
                  <li>Personalised plans</li>
                </ul>
                <div className="mt-2 text-[10px] font-semibold text-[#2e7d68]">
                  Subsidies available
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-xs mb-1">
                  Health Screening
                </h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Basic & executive packages</li>
                  <li>Age & risk-based</li>
                  <li>Clear explanation</li>
                </ul>
                <div className="mt-2 text-[10px] font-semibold text-[#2e7d68]">
                  From $98 per package
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-xs mb-1">Vaccinations</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Influenza, Pneumococcal</li>
                  <li>Child & adult vaccines</li>
                  <li>HPV & travel</li>
                </ul>
                <div className="mt-2 text-[10px] font-semibold text-[#2e7d68]">
                  MOH schedule supported
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Doctors */}
        <section id="doctors" className="py-10 bg-[#fdefea]">
          <div className="max-w-5xl mx-auto px-4">
            <header className="text-center max-w-xl mx-auto mb-7">
              <h2 className="text-xl font-semibold text-slate-900">
                Meet Our Doctors
              </h2>
              <p className="text-[12px] text-slate-600">
                A small, dedicated team that remembers your name, your story,
                and your health goals.
              </p>
            </header>
            <div className="grid gap-4 md:grid-cols-3 text-[10px]">
              {[
                {
                  name: "Dr. Sarah Tan",
                  role: "Family Physician · MBBS (Singapore)",
                  langs: "Speaks: English, Chinese",
                  bio: "Gentle with seniors and kids, focused on chronic care and preventive health.",
                },
                {
                  name: "Dr. Daniel Lee",
                  role: "Family Physician · MMed (Family Med)",
                  langs: "Speaks: English",
                  bio: "Passionate about men's health, mental wellness, and long-term care.",
                },
                {
                  name: "Dr. Priya Kumar",
                  role: "Family Physician",
                  langs: "Speaks: English, Tamil",
                  bio: "Focused on women's health, child health, and Healthier SG-aligned preventive care.",
                },
              ].map((d) => (
                <article
                  key={d.name}
                  className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#ff6b6b1a] text-[#ff6b6b] flex items-center justify-center text-[9px] mb-2">
                    Dr
                  </div>
                  <h3 className="font-semibold text-xs mb-[2px]">
                    {d.name}
                  </h3>
                  <p className="text-[9px] text-[#2e7d68] mb-[2px]">
                    {d.role}
                  </p>
                  <p className="text-[8px] text-slate-500 mb-[4px]">
                    {d.langs}
                  </p>
                  <p className="text-[9px] text-slate-600">{d.bio}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* For Patients */}
        <section id="for-patients" className="py-10">
          <div className="max-w-5xl mx-auto px-4">
            <header className="text-center max-w-xl mx-auto mb-7">
              <h2 className="text-xl font-semibold text-slate-900">
                Simple for Patients, Powerful for Families
              </h2>
              <p className="text-[12px] text-slate-600">
                Designed so any grandparent can use it independently — and every
                caregiver has clarity.
              </p>
            </header>
            <div className="grid gap-4 md:grid-cols-3 text-[10px]">
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#ff6b6b1a] text-[#ff6b6b] flex items-center justify-center text-[9px] mb-1">
                  1
                </div>
                <h3 className="font-semibold text-xs mb-1">
                  Book in under 60 seconds
                </h3>
                <p className="text-slate-600">
                  Choose a time, leave your number — we handle the rest.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#ff6b6b1a] text-[#ff6b6b] flex items-center justify-center text-[9px] mb-1">
                  2
                </div>
                <h3 className="font-semibold text-xs mb-1">
                  Easy check-in
                </h3>
                <p className="text-slate-600">
                  Just your mobile number at the counter. No complicated IDs.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#ff6b6b1a] text-[#ff6b6b] flex items-center justify-center text-[9px] mb-1">
                  3
                </div>
                <h3 className="font-semibold text-xs mb-1">
                  Clear follow-up
                </h3>
                <p className="text-slate-600">
                  Simple instructions and reminders for long-term health.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials & Contact */}
        <section
          id="contact"
          className="py-10 bg-[#fdefea]"
        >
          <div className="max-w-5xl mx-auto px-4 grid gap-6 lg:grid-cols-[1.6fr_minmax(0,1.4fr)] text-[10px]">
            <div>
              <header className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  What Our Patients Say
                </h2>
                <p className="text-[12px] text-slate-600">
                  Real words from our neighborhood families.
                </p>
              </header>
              <div className="space-y-3">
                <figure className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                  <blockquote className="text-slate-700 mb-1">
                    &quot;The doctors take time to explain everything to my mother in
                    simple terms. Clinic staff are patient and kind.&quot;
                  </blockquote>
                  <figcaption className="text-[9px] text-slate-500">
                    — Wei Ling, 42
                  </figcaption>
                </figure>
                <figure className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                  <blockquote className="text-slate-700 mb-1">
                    &quot;Senior-friendly, no long wait, and clear on fees. I feel
                    safe bringing my parents here.&quot;
                  </blockquote>
                  <figcaption className="text-[9px] text-slate-500">
                    — Mr. Tan, 51
                  </figcaption>
                </figure>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Visit or Contact Us
              </h2>
              <p className="text-slate-600">
                📍 Blk 123 Serangoon Ave 3, #01-01, Singapore 550123
              </p>
              <p className="text-slate-600">
                📞{" "}
                <a
                  href="tel:+6591234567"
                  className="text-[#ff6b6b] hover:underline"
                >
                  +65 9123 4567
                </a>
              </p>
              <p className="text-slate-600">
                💬{" "}
                <a
                  href="https://wa.me/6591234567"
                  className="text-[#ff6b6b] hover:underline"
                >
                  WhatsApp us
                </a>
              </p>
              <p className="text-slate-600">
                ✉️{" "}
                <a
                  href="mailto:hello@gabrielfamilyclinic.sg"
                  className="text-[#ff6b6b] hover:underline"
                >
                  hello@gabrielfamilyclinic.sg
                </a>
              </p>
              <p className="text-slate-600">
                ⏰ Mon–Fri: 8:30am–9:00pm · Sat–Sun: 9:00am–5:00pm
              </p>

              <form id="contact-form" className="mt-2 flex flex-col gap-2" noValidate>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cf-name"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Name
                  </label>
                  <Input
                    id="cf-name"
                    placeholder="Your full name"
                    className="h-8 text-[10px] rounded-xl bg-white"
                  />
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="cf-name"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cf-email"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Email
                  </label>
                  <Input
                    id="cf-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-8 text-[10px] rounded-xl bg-white"
                  />
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="cf-email"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cf-message"
                    className="text-[9px] font-medium text-slate-800"
                  >
                    Message
                  </label>
                  <Textarea
                    id="cf-message"
                    rows={3}
                    placeholder="How can we help?"
                    className="text-[10px] rounded-xl bg-white"
                  />
                  <p
                    className="min-h-[10px] text-[8px] text-[#dc2626]"
                    data-error-for="cf-message"
                  />
                </div>
                <Button
                  type="submit"
                  className="mt-1 w-full h-8 rounded-full text-[9px] bg-[#ff6b6b] hover:bg-[#e05555] shadow-md"
                >
                  Send Message
                </Button>
                <p className="text-[8px] text-slate-500">
                  For emergencies, please dial 995. Do not submit emergency
                  requests here.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-6 mt-2">
        <div className="max-w-5xl mx-auto px-4 grid gap-2 md:grid-cols-2 items-center">
          <div>
            <div className="text-sm font-semibold">
              Gabriel Family Clinic
            </div>
            <div className="text-[10px] text-slate-500">
              Healthcare with Heart for every generation.
            </div>
          </div>
          <div className="flex md:justify-end gap-3 text-[9px]">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              PDPA
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
          </div>
          <div className="flex flex-wrap gap-2 text-[8px] text-slate-500">
            <span className="px-2 py-[2px] rounded-full bg-white/5">
              PDPA Compliant
            </span>
            <span className="px-2 py-[2px] rounded-full bg-white/5">
              MOH Guidelines Aligned
            </span>
          </div>
          <div className="text-[8px] text-slate-600">
            © <span id="gfc-year" /> Gabriel Family Clinic. All rights
            reserved.
          </div>
        </div>
      </footer>

      <div
        id="gfc-toast"
        className="fixed right-4 bottom-4 px-4 py-2 rounded-full bg-[#2e7d68] text-white text-[9px] shadow-lg opacity-0 pointer-events-none transition-all duration-300 translate-y-2"
      />
    </div>
  )
}