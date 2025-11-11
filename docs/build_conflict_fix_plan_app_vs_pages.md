# Build Conflict Fix Plan — "pages/index.tsx" vs "app/page.tsx"

Date: 2025-11-11  
Owner: AI Coding Agent (Kilo Code)  
Status: Plan + decision recorded; one surgical change required

---

## 1. Issue Summary

Running:

```bash
npm run build
```

Produces:

```text
Conflicting app and page file was found, please remove the conflicting files to continue:
  "pages/index.tsx" - "app/page.tsx"
```

Next.js constraint:

- You cannot have both:
  - `pages/index.tsx` (Pages Router root), and
  - `app/page.tsx` (App Router root)
- defining `/` in the same project. One must own `/`.

Current situation:

- We intentionally implemented the new, production-quality landing page at:
  - `src/app/page.tsx`
- Legacy/demo home exists at:
  - `pages/index.tsx`
- This conflict blocks `next build`.

---

## 2. Design & Architectural Intent

From prior docs and this integration work:

- Direction is to use App Router (`src/app/**`) as the primary surface:
  - `src/app/layout.tsx` already exists.
  - New landing is implemented as `src/app/page.tsx`.
- The old `pages/index.tsx` is:
  - A simple placeholder/demo page.
  - Superseded by the new landing page that better reflects:
    - The "Healthcare with Heart" vision.
    - The meticulous static mockup previously created.

Therefore:

- `app/page.tsx` should own `/`.
- `pages/index.tsx` should be removed or relocated.

---

## 3. Options Considered

### Option A — Delete `pages/index.tsx`

- Pros:
  - Directly resolves the conflict.
  - Keeps `app/page.tsx` as canonical landing page.
- Cons:
  - Loses the legacy demo page (acceptable; superseded).

### Option B — Move `pages/index.tsx` to a non-conflicting route

For example:

- `pages/legacy-home.tsx`
- or `pages/demo/index.tsx`

- Pros:
  - Preserve old UI for reference/testing.
- Cons:
  - Adds another public route that may confuse or be unused.

### Option C — Delete `app/page.tsx` and keep legacy `pages/index.tsx`

- Conflicts with our deliberate work:
  - The new landing page is more aligned with requirements and design.
- Not acceptable.

---

## 4. Selected Approach

We choose a precise, low-risk variant of Option B:

1) Preserve legacy content for reference.
2) Avoid `/` conflict.
3) Keep `/` served by the new `src/app/page.tsx`.

Implementation:

- Rename `pages/index.tsx` → `pages/legacy-home.tsx`

Rationale:

- Next.js no longer treats it as `/`.
- `app/page.tsx` becomes the sole handler for `/` (App Router).
- Original demo is kept at `/legacy-home` (or similar), minimal risk.
- This aligns with our meticulous, reversible, and auditable change policy.

---

## 5. Execution Checklist

Steps to apply (next messages):

1) Move legacy entry:
   - [ ] Rename file:
     - from: `pages/index.tsx`
     - to:   `pages/legacy-home.tsx`
   - No content change required.

2) Rebuild:
   - [ ] Run `npm run lint`
   - [ ] Run `npm run type-check`
   - [ ] Run `npm run build`
   - Confirm:
     - No "Conflicting app and page file" error.
     - `/` renders App Router `src/app/page.tsx` landing page.
     - `/legacy-home` (optional) shows old demo if needed.

3) Document:
   - [ ] Record this change and outcome in an updated build/landing integration report under `docs/`.

---

## 6. Plan Validation

- Minimizes blast radius:
  - Single rename; no behavioral changes to core logic.
- Fully resolves build blocker:
  - Eliminates dual-definition of `/`.
- Preserves history:
  - Legacy page still available if team needs it.
- Aligns with:
  - Our chosen architecture (App Router primary).
  - The Meticulous Approach: explicit reasoning, reversible, documented.

Next step: perform the `pages/index.tsx` → `pages/legacy-home.tsx` rename and re-run build commands.