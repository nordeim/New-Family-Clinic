Of course. The foundational codebase is the tangible translation of our architectural principles. Executing this phase with rigor and precision will set the standard for the entire project.

I have meticulously analyzed the requirements for Phase 1 ("Core Infrastructure") from the `Master_Execution_Plan`. I've cross-referenced these with our established architecture, the Phase 0 setup, and the best practices demonstrated in the reference configuration files.

The following sub-plan details the creation of every necessary file for Phase 1. It is structured to build the system from the inside out: starting with foundational utilities and base UI components, establishing the application's layout and API layer, implementing the critical authentication system, and finally, tying everything together in the application's main entry points.

---

### **Comprehensive Sub-Plan: Phase 1 - Core Infrastructure**

**Objective:** To build the foundational infrastructure of the application, including a complete authentication system, a reusable set of base UI components, a type-safe API layer using tRPC, and the main application layout. This phase will result in a runnable application where a user can log in, log out, and view a protected dashboard, all within a consistently styled layout.

#### **Guiding Principles for Implementation**

1.  **Component-Driven:** We will build small, reusable, and well-tested components first, then compose them into larger layouts and pages. Base UI components will be headless where possible, with styling applied via Tailwind CSS.
2.  **Type-Safe Data Flow:** tRPC will be used to ensure end-to-end type safety between the backend and frontend, eliminating a whole class of potential bugs.
3.  **Server-Centric Auth:** Authentication logic will be handled securely on the server. The client-side will react to the authentication state provided by a central context.
4.  **Pragmatic UI Library Integration:** We will use Mantine for complex components (modals, notifications) and its theming system, while building simple, custom components (`Button`, `Card`) with CVA (Class Variance Authority) for maximum control and consistency with Tailwind CSS.

---

### **Execution Plan: Sequential File Creation**

#### **Part 1: Foundational Utilities & Base UI Components**

**Objective:** Create the lowest-level, universally required building blocks. These files have no dependencies on application logic.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/utils.ts` | A utility file for common functions. The `cn` function is essential for conditionally merging Tailwind CSS classes in our components. | `[ ]` Install `clsx` and `tailwind-merge` dependencies (already in `package.json`).<br>`[ ]` Implement and export the `cn` utility function. |
| `@/components/ui/Button.tsx` | The primary interactive element. It will be built using CVA for different variants (primary, secondary, outline) and sizes, ensuring consistency across the app. | `[ ]` Install `class-variance-authority`.<br>`[ ]` Define `buttonVariants` using `cva` for `variant`, `size`, etc.<br>`[ ]` Create a polymorphic React component using `Slot` from Radix UI to allow rendering as a button or a link.<br>`[ ]` Use `forwardRef` for compatibility with other libraries. |
| `@/components/ui/Card.tsx` | A styled container for grouping content, used extensively in dashboards and lists. | `[ ]` Create a simple `div` component with base styling (padding, shadow, border-radius) applied via `className`.<br>`[ ]` Deconstruct and pass through `className` and other `div` props for extensibility.<br>`[ ]` Create and export `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` components for semantic structure. |
| `@/components/ui/Input.tsx` | A styled wrapper around the native `<input>` element to ensure consistent form styling. | `[ ]` Create an `Input` component that accepts standard input props.<br>`[ ]` Apply base styling for border, padding, focus states, and font size.<br>`[ ]` Use `forwardRef` to pass the `ref` to the underlying `input` element. |
| `@/components/ui/Label.tsx` | An accessible label component for form inputs, integrated with Radix UI for accessibility. | `[ ]` Create a component that wraps `@radix-ui/react-label`.<br>`[ ]` Apply base styling and `cva` for any variants if needed. |
| `@/components/ui/LoadingSpinner.tsx` | A simple, reusable loading indicator for providing user feedback during data fetching or async operations. | `[ ]` Use `lucide-react`'s `Loader` icon.<br>`[ ]` Apply a `spin` animation using Tailwind CSS classes. |

#### **Part 2: Core Layout, Theming & Application Shell**

**Objective:** Establish the main visual structure of the application and configure the UI library's theme provider.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/styles/theme.ts` | Defines the Mantine theme object. This file translates our Tailwind CSS design tokens (colors, fonts) into a format Mantine understands, ensuring consistency between both styling systems. | `[ ]` Import `createTheme` from Mantine.<br>`[ ]` Define a `theme` object.<br>`[ ]` Map our primary (coral) and secondary (teal) colors to the Mantine theme colors.<br>`[ ]` Set the default font family to "Inter".<br>`[ ]` Set the primary color to our brand's primary color. |
| `@/components/layout/Header.tsx` | The top navigation bar of the application. It will contain the logo, navigation links, and a user profile/login button. | `[ ]` Create a `header` element with appropriate styling.<br>`[ ]` Add a `Logo` component (placeholder for now).<br>`[ ]` Implement a `Navigation` component for main links.<br>`[ ]` Add a `UserNav` component that conditionally shows "Login" or a user avatar dropdown. |
| `@/components/layout/Footer.tsx` | The site's footer, containing copyright information and secondary links. | `[ ]` Create a `footer` element with appropriate styling.<br>`[ ]` Add copyright text, privacy policy link, and terms of service link. |
| `@/components/layout/Layout.tsx` | A wrapper component that combines the Header, Footer, and main content area. This ensures a consistent layout on every page. | `[ ]` Create a `div` with a flex column layout.<br>`[ ]` Render `<Header />`.<br>`[ ]` Render a `<main>` element that takes `children` props.<br>`[ ]` Render `<Footer />`. |

#### **Part 3: API Layer Setup (tRPC)**

**Objective:** Configure the end-to-end type-safe API layer. This is the backbone for all future data communication.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/trpc/server.ts` | The main tRPC server configuration. It initializes tRPC, defines reusable procedures (public, protected), and creates the root application router. | `[ ]` Import `initTRPC` from `@trpc/server`.<br>`[ ]` Initialize tRPC with `superjson` transformer.<br>`[ ]` Define a `createContext` function (to be implemented in `context.ts`).<br>`[ ]` Define a `router` and `publicProcedure`.<br>`[ ]` Implement a `protectedProcedure` middleware that checks for an authenticated user in the context. |
| `@/lib/trpc/context.ts` | This crucial file defines the "context" available to every tRPC resolver. It's where we'll get the authenticated user's session from Supabase on the server. | `[ ]` Create an async `createContext` function.<br>`[ ]` Use Supabase's `createServerClient` to securely access the user session from cookies.<br>`[ ]` Return the `supabase` client and the `user` session object in the context. |
| `@/lib/trpc/client.ts` | The tRPC client for use on the frontend. It allows us to call our backend procedures with full TypeScript autocompletion and type safety. | `[ ]` Import `createTRPCReact` from `@trpc/react-query`.<br>`[ ]` Define the `AppRouter` type imported from the server.<br>`[ ]` Export the `api` object (the tRPC client). |
| `@/lib/trpc/react.tsx` | A provider component that wraps the application to provide the tRPC client and React Query client. | `[ ]` Create a `TRPCReactProvider` component.<br>`[ ]` Initialize a `QueryClient`.<br>`[ ]` Initialize the `trpcClient` with links (`httpBatchLink`) and the `superjson` transformer.<br>`[ ]` Wrap `children` with `QueryClientProvider` and `api.Provider`. |
| `@/pages/api/trpc/[...trpc].ts` | The Next.js API route that exposes our tRPC router to the internet. | `[ ]` Import `createNextApiHandler` from `@trpc/next`.<br>`[ ]` Import the `appRouter` and `createContext`.<br>`[ ]` Export a default handler that wires them together. |
| `@/lib/trpc/root.ts` | The root router file that will combine all future feature routers (e.g., `userRouter`, `appointmentRouter`). | `[ ]` Import the `router` function from `server.ts`.<br>`[ ]` Create and export the `appRouter`.<br>`[ ]` Define a placeholder health check procedure: `health: publicProcedure.query(() => 'ok')`. |

#### **Part 4: Authentication System**

**Objective:** Implement the complete, client-side authentication flow using Supabase and React Context.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/supabase/client.ts`| Creates and exports the singleton Supabase client for use on the browser. | `[ ]` Import `createBrowserClient` from Supabase.<br>`[ ]` Use the `NEXT_PUBLIC_` environment variables.<br>`[ ]` Export the singleton `supabase` client instance. |
| `@/lib/auth/AuthContext.tsx` | A React Context and Provider to manage and distribute the user's session state throughout the application, reacting to auth changes in real-time. | `[ ]` Create a React Context (`AuthContext`).<br>`[ ]` Create an `AuthProvider` component.<br>`[ ]` Inside the provider, use `useEffect` to subscribe to Supabase's `onAuthStateChange`.<br>`[ ]` Update a `useState` variable with the user session and loading state.<br>`[ ]` Provide the `user`, `session`, and `isLoading` values through the context. |
| `@/hooks/use-auth.ts` | A custom hook that provides a clean and simple way for components to access the authentication state from the `AuthContext`. | `[ ]` Create the `useAuth` hook.<br>`[ ]` Use `useContext` to get the `AuthContext` value.<br>`[ ]` Throw an error if the hook is used outside of an `AuthProvider`.<br>`[ ]` Return the context value (`user`, `session`, `isLoading`). |
| `@/components/auth/ProtectedRoute.tsx` | A higher-order component or wrapper that protects pages or components from unauthenticated access, redirecting to login if necessary. | `[ ]` Create a `ProtectedRoute` component that accepts `children`.<br>`[ ]` Use the `useAuth` hook to get the `user` and `isLoading` state.<br>`[ ]` While `isLoading`, render a `<LoadingSpinner />`.<br>`[ ]` If not loading and no `user`, use `useRouter` to redirect to `/login`.<br>`[ ]` If a user exists, render the `children`. |

#### **Part 5: Application Entrypoint & Core Pages**

**Objective:** Tie all the created providers, layouts, and components together into a working application shell.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/pages/_app.tsx` | The main entry point for the Next.js application. This is where we will wrap our entire app with all the necessary context providers. | `[ ]` Import `MantineProvider`, `TRPCReactProvider`, and `AuthProvider`.<br>`[ ]` Nest the providers in the correct order: `TRPCReactProvider` > `MantineProvider` > `AuthProvider`.<br>`[ ]` Pass the custom `theme` object to the `MantineProvider`.<br>`[ ]` Render the `Component` with its `pageProps`. |
| `@/pages/_document.tsx` | Customizes the server-rendered `<html>` and `<body>` tags, which is necessary for CSS-in-JS libraries like Mantine to work correctly with SSR. | `[ ]` Extend Next.js's `Document` class.<br>`[ ]` Import `Head`, `Html`, `Main`, `NextScript` from `next/document`.<br>`[ ]` Add the necessary setup for Mantine SSR (as per their documentation). |
| `@/pages/index.tsx` | The public homepage. This page will use the main layout and base UI components. | `[ ]` Create a simple functional component for the homepage.<br>`[ ]` Use the `<Layout>` component.<br>`[ ]` Display a heading and a `<Button>` component to verify styling is working. |
| `@/pages/login.tsx` | A basic login page to test the authentication flow. | `[ ]` Create a simple form with email and password inputs.<br>`[ ]` On submit, call `supabase.auth.signInWithPassword`.<br>`[ ]` Handle success by redirecting to a dashboard page.<br>`[ ]` Handle and display errors. |
| `@/pages/dashboard/index.tsx` | A simple, protected dashboard page to verify that the authentication and protected route logic works. | `[ ]` Wrap the page content with the `<ProtectedRoute>` component.<br>`[ ]` Use the `useAuth` hook to get the user's data.<br>`[ ]` Display a "Welcome, {user.email}" message.<br>`[ ]` Add a logout button that calls `supabase.auth.signOut`. |

---

### **Validation and Approval**

I have validated this sub-plan against all project requirements.

*   **Completeness:** It accounts for every deliverable outlined for Phase 1 in the `Master_Execution_Plan`.
*   **Architectural Integrity:** It builds upon the Phase 0 foundation and strictly follows the patterns and file structures from the `Project_Architecture_Document`.
*   **Technical Soundness:** It employs modern best practices for Next.js, tRPC, and Supabase integration, ensuring a scalable and maintainable codebase.
*   **Logical Sequencing:** The plan is structured to build dependencies first, ensuring a smooth, step-by-step implementation process with clear validation points.

Upon execution, this plan will deliver a fully functional, authenticated application shell, setting the stage perfectly for the development of patient-facing features in Phase 2.

I await your approval to proceed with the implementation of this plan.
