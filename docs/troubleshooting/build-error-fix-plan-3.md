# Build Error Analysis & Resolution Plan: Hybrid Paths & Missing Dependencies

**File:** `docs/troubleshooting/build-error-fix-plan-3.md`  
**Date:** November 8, 2025  
**Status:** Proposed

---

## 1. Analysis of Compounded Build Errors

After fixing the initial `tsconfig.json` alias, a new, more complex set of errors emerged. The root cause is multi-faceted, stemming from the project's hybrid file structure (a mix of root-level and `src/` directories) and incomplete setup.

### 1.1. Root Causes

1.  **Incorrect Path Alias Strategy:** The previous fix (`"@/*": ["./*"]`) was too broad. It broke resolution for files still located in the `src/` directory (e.g., `src/env.js`) and did not fully resolve the UI component issue.
2.  **Case-Sensitivity Mismatch:** The application code imports UI components using PascalCase (e.g., `Badge`), while the `shadcn/ui` generator creates files in lowercase (e.g., `badge.tsx`). This fails on case-sensitive filesystems.
3.  **Missing NPM Dependencies:** The project is still missing a critical dependency for Stripe payments (`@stripe/react-stripe-js`).
4.  **Missing Custom Components:** A non-standard `StarRating` component is being imported but does not exist in the codebase.

---

## 2. Comprehensive Implementation Plan

This plan addresses all four issues in a specific, sequential order.

### Step 1: Implement a Robust Path Alias Configuration
- **Action:** Update `tsconfig.json` to use specific aliases for each major directory, accommodating the hybrid file structure. This is more precise and maintainable than a single wildcard.
- **New `paths` configuration:**
  ```json
  "paths": {
    "@/components/*": ["./components/*"],
    "@/lib/*": ["./lib/*"],
    "@/styles/*": ["./styles/*"],
    "@/hooks/*": ["./hooks/*"],
    "@/types/*": ["./types/*"],
    "@/env": ["./src/env.js"]
  }
  ```

### Step 2: Install Remaining Dependencies
- **Action:** Install the missing Stripe React package.
- **Command:** `npm install @stripe/react-stripe-js`

### Step 3: Create Placeholder for Custom Component
- **Action:** Create a placeholder file for the missing `StarRating` component to allow the build to pass.
- **File:** `components/ui/StarRating.tsx`
- **Content:** A basic, empty React component.

### Step 4: Correct Import Casing
- **Action:** Find the files importing UI components with incorrect casing and fix them.
- **Files to Fix:**
  - In `components/doctor/TodaySchedule.tsx`: Change `from '@/components/ui/Badge'` to `from '@/components/ui/badge'`.
  - In `components/feedback/FeedbackWidget.tsx`: Change `from '@/components/ui/Textarea'` to `from '@/components/ui/textarea'`.

### Step 5: Validate the Complete Fix
- **Action:** Clear the Next.js cache and run the build command.
- **Commands:**
  ```bash
  rm -rf .next
  npm run build
  ```
- **Success Criteria:** The build completes successfully with no errors.

---

## 3. Risk Assessment

- **Risk Level:** Low.
- **Reasoning:** This plan consists of highly targeted, corrective actions. Each step addresses a specific, verifiable error from the build log. The `tsconfig.json` change is the most significant, but it's a configuration fix that makes the project structure explicit and is easily reversible.
