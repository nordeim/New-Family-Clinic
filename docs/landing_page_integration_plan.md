# Gabriel Family Clinic v2.0 — Landing Page Integration Plan

Date: 2025-11-11  
Owner: AI Coding Agent (Kilo Code)  
Status: Approved plan ONLY (no runtime changes applied yet)

Purpose: Define a meticulous, phased implementation plan to update the Next.js codebase so that the live application’s landing experience closely matches (or improves upon) the static mockup:

- static/index.html
- static/styles/globals.css
- static/js/landing.js

This plan is designed for careful, low-risk execution aligned with AGENT.md, the Meticulous Approach, and existing architecture.

---

## 1. High-Level Goals

1) Make the actual Next.js landing route visually and experientially aligned with the static mockup:
   - "Healthcare with Heart" hero.
   - Clear navigation and CTAs.
   - Why Us, Services, Doctors, Steps, Testimonials, Contact sections.
   - Senior-friendly and mobile-first.

2) Do this without:
   - Breaking existing routing or auth flows.
   - Violating existing ESLint/TS rules or architectural patterns.
   - Introducing uncontrolled tech sprawl.

3) Preserve reusability:
   - Extract design tokens and UI atoms as reusable components.
   - Keep the landing implementation modular so future changes are straightforward.

This document only lists what WILL be changed and how. Actual code edits will follow this plan in subsequent steps.

---

## 2. Integration Strategy Overview

We will:

- Treat static/ as the visual source of truth.
- Map sections into composable React components under src/app/_components or components/.
- Use a single primary entry for the marketing landing:
  - Target: `/` (home) via src/app/page.tsx or existing top-level page.
- Introduce a small, well-scoped landing layout and design system layer that:
  - Reuses/aligns with existing UI primitives where possible (e.g., shadcn-like components).
  - Does NOT break internal app/portal UIs.

Execution will be done in phased commits:

1) Design System Foundation
2) Layout & Shell (header/nav/footer)
3) Content Sections (hero, why us, services, doctors, patients, testimonials/contact)
4) Interactions (smooth scroll, senior mode, lightweight animations)
5) QA & Hardening

Each phase has explicit file-level checklists.

---

## 3. Files To Add / Modify

Note: Paths assume Next.js App Router structure currently present (src/app/layout.tsx etc.). If conflicts exist at execution time, we will adapt with minimal deviation from this list.

### 3.1 New / Updated Landing Entry

1) [NEW] src/app/page.tsx
   - Purpose:
     - Define the main marketing landing page for `/`.
   - Responsibilities:
     - Compose the new landing sections.
     - Use server components where possible, with client subcomponents only for interactive pieces (nav toggle, senior mode).
   - Checklist:
     - [ ] Import and compose LandingHero, LandingWhyUs, LandingServices, LandingDoctors, LandingForPatients, LandingTestimonialsContact.
     - [ ] Ensure top-level metadata aligns with static mockup (title, description).
     - [ ] No blocking data dependencies; purely static content for now.

If src/app/page.tsx already exists:
- [ ] Replace or refactor its content to wrap new landing components (without breaking internal links).

---

### 3.2 Layout Integration

2) [MODIFY] src/app/layout.tsx
   - Purpose:
     - Ensure global layout supports the new aesthetics.
   - Planned changes:
     - [ ] Confirm correct HTML lang + viewport + base fonts are set (DM Sans + Inter).
     - [ ] If not present, add Google Fonts via Next.js font optimization or link tags (keeping in line with repo conventions).
     - [ ] Ensure body className or wrapper allows landing-specific styles to apply without harming app/portal pages.
     - [ ] Do NOT break existing providers (Auth, tRPC, etc).

Result:
- Global shell remains intact.
- Landing styling hooks are available.

---

## 4. Design System & Styles

We should not blindly drop static CSS into Next.js, but port it into a coherent layer consistent with project standards.

3) [NEW] src/app/(landing)/landing.css or src/styles/landing.css
   - Purpose:
     - Encapsulate landing-specific styles derived from static/styles/globals.css.
   - Planned changes:
     - [ ] Extract and adapt design tokens (colors, radii, shadows, breakpoints).
     - [ ] Implement button, card, badge, and layout utilities scoped to landing (e.g., prefix with `.gfc-` or use CSS modules).
     - [ ] Align with existing Tailwind/Mantine/shadcn usage if present, without duplication.
   - Checklist:
     - [ ] No global resets that conflict with App Router or Mantine.
     - [ ] Respect existing ESLint/Next.js CSS constraints.

4) [MODIFY (if used)] src/styles/globals.css or equivalent
   - Only if this repo has a canonical global CSS:
     - [ ] Introduce shared tokens (color palette, typography scale) used by both landing and app.
     - [ ] Ensure changes are additive/non-breaking for existing pages.
   - If such a file does not exist, step (3) remains the primary location.

---

## 5. Landing Components (By Section)

We reconstruct static/index.html into React components. Names/prefixes can be tuned to match repo conventions.

5) [NEW] src/app/_components/landing/LandingHero.tsx
   - Responsibilities:
     - Hero layout + quick booking CTA content (static).
     - Stats, badges, CTAs.
   - Checklist:
     - [ ] Pure server component (no state).
     - [ ] Responsive layout matches mockup.
     - [ ] Uses shared Button / Card atoms where available.

6) [NEW] src/app/_components/landing/LandingQuickBookingCard.tsx
   - Responsibilities:
     - The hero-side card with slots and static form UI.
   - Checklist:
     - [ ] Purely presentational; no backend call.
     - [ ] Validation/interaction delegated to a client component hook or unobtrusive script (see Interactions section).
     - [ ] Props or constants for sample slots.

7) [NEW] src/app/_components/landing/LandingWhyUs.tsx
   - Responsibilities:
     - “Why Families Choose Gabriel Family Clinic” cards.
   - Checklist:
     - [ ] Static content from mockup.
     - [ ] Uses card components; responsive grid.

8) [NEW] src/app/_components/landing/LandingServices.tsx
   - Responsibilities:
     - Services & transparent pricing section.
   - Checklist:
     - [ ] Static structured list.
     - [ ] Aligns with warm and clear copy.

9) [NEW] src/app/_components/landing/LandingDoctors.tsx
   - Responsibilities:
     - Doctor highlight cards.
   - Checklist:
     - [ ] Static sample doctor info (until backed by real data).
     - [ ] Layout consistent with mockup.

10) [NEW] src/app/_components/landing/LandingForPatients.tsx
    - Responsibilities:
      - 3-step “simple for patients” explanation.
    - Checklist:
      - [ ] Static content; minimal markup.

11) [NEW] src/app/_components/landing/LandingTestimonialsContact.tsx
    - Responsibilities:
      - Testimonials and contact block.
    - Checklist:
      - [ ] Static testimonials consistent with mockup.
      - [ ] Contact info from mockup; mailto/tel/WhatsApp links.
      - [ ] Includes non-emergency disclaimer.

12) [NEW] src/app/_components/landing/LandingFooter.tsx
    - Responsibilities:
      - Marketing footer used on landing.
    - Checklist:
      - [ ] PDPA/MOH badges, copyright year.
      - [ ] Re-usable for other public pages if needed.

---

## 6. Navigation & Header Behavior

13) [NEW] src/app/_components/landing/LandingHeader.tsx
    - Responsibilities:
      - Top bar with brand, tagline, language chips (visual), call now, book now, senior-mode toggle.
      - Navigation links for sections (anchor-based).
    - Checklist:
      - [ ] Implement as client component only where needed (for nav toggle/senior mode).
      - [ ] Use Next.js Link for non-anchor routes; anchor tags with `href="#section"` for on-page navigation.

14) [NEW] src/app/_components/landing/LandingNavbar.tsx
    - Responsibilities:
      - Sticky nav with links and mobile menu.
    - Checklist:
      - [ ] CSS + small client logic for hamburger.
      - [ ] ARIA attributes for accessibility.

We may combine Header+Navbar into one module; planned separation clarifies concerns.

---

## 7. Interactions & Client Logic

All behavior from static/js/landing.js must be carefully ported into idiomatic Next.js client components or small hooks.

15) [NEW] src/app/_components/landing/landing-interactions.tsx (or hooks/useLandingInteractions.ts)
    - Responsibilities:
      - Smooth scrolling for anchor links.
      - Mobile nav open/close state.
      - Senior mode toggling with localStorage (in browser only).
      - Toast display for form submissions.
      - Optional intersection-based animations.
    - Checklist:
      - [ ] Mark as "use client".
      - [ ] Avoid direct document/window access during SSR (guard with useEffect).
      - [ ] Respect prefers-reduced-motion.
      - [ ] Keep bundle small and scoped to landing.

16) [NEW] src/app/_components/landing/QuickBookingForm.tsx
    - Responsibilities:
      - Client-side validation logic ported from static quick-booking.
    - Checklist:
      - [ ] Validate name, phone, reason, slot.
      - [ ] Show inline errors.
      - [ ] On success: show toasts / messages only; no API call.
      - [ ] No side effects beyond UI feedback.

17) [NEW] src/app/_components/landing/ContactForm.tsx
    - Responsibilities:
      - Client-side validation matching static implementation.
    - Checklist:
      - [ ] Similar validation and UX to static version.
      - [ ] Clearly state non-emergency usage.

---

## 8. Supporting Utilities / Shared Components

We should reuse or extend existing UI primitives where possible.

18) [REVIEW/MODIFY] src/components/ui/button.tsx and related
    - Checklist:
      - [ ] Ensure we can express landing buttons via existing variants (primary, outline, ghost).
      - [ ] If needed, add a “coral/landing” variant that matches the mockup using design tokens.
      - [ ] Do not break existing usages.

19) [REVIEW/MODIFY] src/components/ui/card.tsx, src/components/ui/input.tsx, src/components/ui/textarea.tsx
    - Checklist:
      - [ ] Ensure styling consistent with landing design system or easily overridable.
      - [ ] For landing components, prefer composition over redefining primitives.

If existing primitives are too divergent, we will:

- [NEW] Add landing-scoped UI wrappers:
  - src/app/_components/landing/ui/LandingButton.tsx
  - src/app/_components/landing/ui/LandingCard.tsx
  - etc.
- Using classes defined in landing.css to keep isolation.

---

## 9. Non-Goals & Safeguards

- No backend changes:
  - Booking and contact forms on landing remain “demo” until requirements for persistence are defined.
- No breaking of auth, portals, or tRPC routes.
- No heavy JS frameworks or CSS-in-JS introduced beyond current stack.
- All new client components:
  - Linted and type-safe.
  - Side-effects encapsulated in useEffect / event handlers and guarded against SSR issues.

---

## 10. Phase-by-Phase Execution Checklist

Phase 1 — Foundation
- [ ] Add landing.css (or equivalent) with extracted tokens and section styles.
- [ ] Adjust layout.tsx only as needed to support fonts and base styling (no breaking changes).

Phase 2 — Structure
- [ ] Implement LandingHeader, LandingNavbar, LandingFooter components.
- [ ] Implement LandingHero + LandingQuickBookingCard.
- [ ] Wire src/app/page.tsx to compose these components.

Phase 3 — Content Sections
- [ ] Implement LandingWhyUs.
- [ ] Implement LandingServices.
- [ ] Implement LandingDoctors.
- [ ] Implement LandingForPatients.
- [ ] Implement LandingTestimonialsContact.

Phase 4 — Interactions
- [ ] Implement landing-interactions client logic (smooth scroll, nav toggle, senior mode).
- [ ] Implement QuickBookingForm and ContactForm client components with validation and toasts.
- [ ] Integrate toasts into landing layout.

Phase 5 — Review & Validation
- [ ] Run npm run lint, npm run type-check, npm run build.
- [ ] Manually verify:
  - Desktop and mobile layout vs static mockup.
  - Smooth scrolling and nav behavior.
  - Senior mode toggle and persistence.
  - Forms validate as expected; no network hooks.
  - No regressions in other routes.
- [ ] Update docs:
  - Add integration notes to docs/task_completion_report_* for this phase.

---

## 11. Validation of Plan Against Objectives

This plan:

- Directly maps static mockup structure to Next.js components.
- Ensures separation of concerns:
  - Styles in a scoped stylesheet.
  - Behavior in focused client components/hooks.
  - Presentation via modular React components.
- Avoids architectural drift by:
  - Leveraging existing UI primitives where suitable.
  - Keeping landing-specific customizations clearly namespaced.
- Provides clear, file-level checklists and phases that can be executed cautiously and verified stepwise.

No code changes beyond planning have been applied in this document. The next step is to implement these phases carefully, following this plan and updating status/QA docs after completion.
