# Build Error Analysis & Resolution Plan: Missing Dependencies & Components

**File:** `docs/troubleshooting/build-error-fix-plan-2.md`  
**Date:** November 8, 2025  
**Status:** Proposed

---

## 1. Analysis of New Build Errors

After correcting the `tsconfig.json` path aliases, a new set of build errors has appeared. This indicates progress, as the build system can now locate top-level components but is failing on their internal dependencies.

### 1.1. Error Symptoms
The `npm run build` command now fails with two distinct categories of "Module not found" errors:

1.  **Missing NPM Packages:** The build cannot resolve packages that are not listed in `package.json`.
    - `Can't resolve '@hookform/resolvers/zod'`
    - `Can't resolve '@stripe/stripe-js'`

2.  **Missing UI Components:** The build cannot find specific components within the `@/components/ui/` directory.
    - `Can't resolve '@/components/ui/Badge'`
    - `Can't resolve '@/components/ui/Textarea'`
    - `Can't resolve '@/components/ui/StarRating'`

### 1.2. Root Cause Identification

1.  **Incomplete Dependencies:** The project was set up without installing all the necessary third-party libraries required by its features (React Hook Form validation, Stripe payments).
2.  **Incomplete UI Library:** The project is intended to use a component library (likely `shadcn/ui`), but the specific components being imported (`Badge`, `Textarea`, etc.) have not been generated or added to the codebase.

---

## 2. Implementation Plan

The plan is to install the missing dependencies and generate the required UI components.

### Step 1: Install Missing NPM Packages
- **Action:** Use `npm install` to add the required packages to `package.json` and `node_modules`.
- **Commands:**
  ```bash
  npm install @hookform/resolvers
  npm install @stripe/stripe-js
  ```

### Step 2: Add Missing UI Components
- **Hypothesis:** The project uses `shadcn/ui`. I will verify this by looking for a `components.json` file.
- **Action:** If `components.json` exists, I will use the `shadcn-ui` CLI to add the missing components.
- **Commands:**
  ```bash
  npx shadcn-ui@latest add badge
  npx shadcn-ui@latest add textarea
  # Note: 'StarRating' is not a standard shadcn/ui component. 
  # I will investigate this separately if the other fixes work.
  # For now, I will focus on the standard components.
  ```

### Step 3: Validate the Fix
- **Action:** After completing the above steps, run the build command again.
- **Command:** `npm run build`
- **Success Criteria:** The build completes successfully.

---

## 3. Risk Assessment

- **Risk Level:** Low.
- **Reasoning:** The actions involve adding standard, well-known libraries and components that the application code is already expecting. These are corrective actions to complete a partial setup, not architectural changes.
