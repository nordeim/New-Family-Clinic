Of course. Building upon our solid Phase 1 foundation, we will now construct the core user-facing functionality of the platform. Phase 2, the "Patient Portal MVP," is where the project begins to deliver tangible value to its primary users.

My approach will be to meticulously plan the creation of each component and service, ensuring that the implementation is secure, scalable, and provides a seamless user experience, especially for our target elderly demographic. I have thoroughly reviewed the `Master_Execution_Plan` for Phase 2 and cross-referenced it with our established architecture and database schema.

Here is the comprehensive sub-plan for implementing Phase 2.

---

### **Comprehensive Sub-Plan: Phase 2 - Patient Portal MVP**

**Objective:** To build the core features of the patient-facing portal. This includes a complete patient registration flow, a multi-step appointment booking system, a patient dashboard for viewing upcoming appointments and basic medical history, and a real-time queue status display. By the end of this phase, a patient will be able to register, book an appointment, view their visit history, and check their queue status on the day of their visit.

#### **Guiding Principles for Implementation**

1.  **Data Flow Integrity:** All data interactions will flow through our type-safe tRPC layer, ensuring that every piece of data displayed or submitted is validated against our Zod schemas, which in turn are derived from the canonical database schema.
2.  **UX for Accessibility:** Forms will be broken down into logical steps to reduce cognitive load. All interactive elements will have clear focus states and ARIA labels. We will use larger fonts and touch targets as defined in our design system.
3.  **State Management:** We will use `Zustand` for managing global UI state (e.g., the state of a multi-step form) and `React Query` (via tRPC) for caching and managing all server state. This keeps our component logic clean and efficient.
4.  **Real-time First:** Features like the queue status will be built using Supabase's real-time capabilities from the start, providing an engaging and modern user experience.

---

### **Execution Plan: Sequential File Creation**

The plan is structured to build from the backend data layer outwards to the frontend components and pages.

#### **Part 1: API Layer Expansion (tRPC Routers & Procedures)**

**Objective:** Create the backend API endpoints that will power all the features of the Patient Portal.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/trpc/routers/patient.router.ts` | The tRPC router for all patient-related data. This will handle fetching profiles, visit history, and medical records. | `[ ]` Create a new `router` using the `protectedProcedure` to ensure only authenticated users can access it.<br>`[ ]` Implement a `getProfile` procedure to fetch the user's patient data.<br>`[ ]` Implement a `getAppointments` procedure to fetch a list of past and upcoming appointments.<br>`[ ]` Implement a `getMedicalRecords` procedure to fetch a list of visit summaries. |
| `@/lib/trpc/routers/appointment.router.ts`| The tRPC router for the appointment booking flow. This will handle fetching available doctors, time slots, and creating new appointments. | `[ ]` Create a new `router` with both `publicProcedure` and `protectedProcedure` as needed.<br>`[ ]` Implement a `getAvailableDoctors` procedure for a given clinic and date.<br>`[ ]` Implement a `getAvailableSlots` procedure for a specific doctor and date.<br>`[ ]` Implement a `createAppointment` procedure that takes patient, doctor, and slot info, and saves it to the database. Use Zod for input validation. |
| `@/lib/trpc/routers/clinic.router.ts` | The tRPC router for public clinic information. | `[ ]` Create a new `router` using `publicProcedure`.<br>`[ ]` Implement a `getQueueStatus` procedure that fetches the real-time queue data for a given clinic. |
| `@/lib/trpc/root.ts` | (Update) Merge the new feature routers into the main `appRouter`. | `[ ]` Import the `patientRouter`, `appointmentRouter`, and `clinicRouter`.<br>`[ ]` Add them to the `appRouter` object under their respective keys. |
| `@/types/zod-schemas.ts` | A centralized file for Zod schemas that will be used for both frontend form validation and backend tRPC input validation, ensuring a single source of truth. | `[ ]` Create a `patientRegistrationSchema` covering all fields from the registration form.<br>`[ ]` Create a `createAppointmentSchema` for validating the booking submission. |

#### **Part 2: Patient Registration Flow**

**Objective:** Build the complete, multi-step user registration journey.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/auth/actions.ts` | Server Actions for handling form submissions securely on the server. This is the modern Next.js approach for mutations, providing a great UX without manual API route creation for simple forms. | `[ ]` Create a `signup` Server Action that takes form data.<br>`[ ]` Inside, call `supabase.auth.signUp` to create the auth user.<br>`[ ]` If successful, insert corresponding records into the `public.users` and `clinic.patients` tables using the `service_role` client.<br>`[ ]` Return success or error states for the form to handle. |
| `@/components/forms/PatientRegistrationForm.tsx` | The frontend component for the registration form, using `react-hook-form` and `zod` for validation. | `[ ]` Use `useForm` with a `zodResolver` pointing to our `patientRegistrationSchema`.<br>`[ ]` Build the form UI using our base `Input` and `Label` components.<br>`[ ]` Implement client-side validation and display error messages.<br>`[ ]` On submit, call the `signup` Server Action and handle the returned state (e.g., show success message or form error). |
| `@/pages/register.tsx` | The public page that hosts the registration form. | `[ ]` Create the page component.<br>`[ ]` Add SEO metadata (title, description).<br>`[ ]` Render the `<PatientRegistrationForm />` component within a `<Card>`. |

#### **Part 3: Appointment Booking Flow**

**Objective:** Create an intuitive, multi-step process for a patient to book an appointment.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/hooks/use-booking-store.ts` | A `Zustand` store to manage the state of the multi-step booking process across different components (e.g., selected doctor, date, time). | `[ ]` Create a Zustand store with state for `step`, `clinicId`, `doctorId`, `date`, `timeSlot`.<br>`[ ]` Define actions to update the state and move between steps (e.g., `setDoctor`, `nextStep`, `reset`). |
| `@/components/appointment/DoctorSelection.tsx` | A component to display a list of available doctors for the patient to choose from. | `[ ]` Use the `api.appointment.getAvailableDoctors.useQuery` tRPC hook to fetch data.<br>`[ ]` Display doctors in a list or grid of `<Card>` components.<br>`[ ]` On selection, update the Zustand store using `useBookingStore`. |
| `@/components/appointment/TimeSlotPicker.tsx` | A component that shows available time slots for a selected doctor and date. | `[ ]` Use the `api.appointment.getAvailableSlots.useQuery` tRPC hook, passing the selected doctor and date from the Zustand store.<br>`[ ]` Render available slots as clickable `<Button>` components.<br>`[ ]` On selection, update the time slot in the Zustand store. |
| `@/components/appointment/BookingForm.tsx` | The main component that orchestrates the multi-step booking flow. | `[ ]` Use the `useBookingStore` to get the current step.<br>`[ ]` Conditionally render components based on the step: `ClinicSelection`, `DoctorSelection`, `TimeSlotPicker`, `ConfirmationStep`.<br>`[ ]` Implement the final submission logic using the `api.appointment.createAppointment.useMutation` tRPC hook. |
| `@/pages/book-appointment.tsx` | The public page that hosts the entire booking flow. | `[ ]` Render the `<BookingForm />` component.<br>`[ ]` Add a title and instructions for the user. |

#### **Part 4: Patient Dashboard & Core Features**

**Objective:** Build the authenticated patient area where users can view their information and history.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/components/patient/AppointmentSummary.tsx` | A card component for the dashboard that shows the next upcoming appointment. | `[ ]` Use the `api.patient.getAppointments.useQuery` hook.<br>`[ ]` Find the next upcoming appointment from the returned list.<br>`[ ]` Display the date, time, doctor, and clinic in a formatted way. Provide a link to the appointment details page. |
| `@/components/patient/MedicalHistory.tsx` | A component that displays a summary list of past visits. | `[ ]` Use the `api.patient.getMedicalRecords.useQuery` hook.<br>`[ ]` Render a list or table of past visits, showing the date, doctor, and primary diagnosis.<br>`[ ]` Each item should link to a detailed medical record page. |
| `@/pages/dashboard/index.tsx` | (Update) The main patient dashboard. This will be the landing page after login. | `[ ]` Use `<ProtectedRoute>` to secure the page.<br>`[ ]` Arrange the dashboard layout using a grid.<br>`[ ]` Render the `<AppointmentSummary />` and `<MedicalHistory />` components. |
| `@/pages/dashboard/appointments/index.tsx` | A page listing all of the patient's past and upcoming appointments. | `[ ]` Use `<ProtectedRoute>`.<br>`[ ]` Fetch data with `api.patient.getAppointments.useQuery`.<br>`[ ]` Separate the list into "Upcoming" and "Past" sections.<br>`[ ]` Render each appointment with key details. |
| `@/pages/dashboard/medical-records/[recordId].tsx` | A detailed view of a single medical record from a past visit. | `[ ]` Use `<ProtectedRoute>`.<br>`[ ]` Get the `recordId` from the URL router.<br>`[ ]` Fetch the specific record's data using a new tRPC procedure.<br>`[ ]` Display all details: diagnosis, prescription, notes, MC information. Add a "Download MC" button. |

#### **Part 5: Real-time Queue Management**

**Objective:** Implement the real-time queue status feature.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/hooks/use-queue-status.ts` | A custom hook that subscribes to real-time queue updates from Supabase for a specific clinic. | `[ ]` Create the `useQueueStatus` hook that takes a `clinicId`.<br>`[ ]` Use `useEffect` to set up a Supabase real-time subscription to the `queue_management` table.<br>`[ ]` Listen for `UPDATE` events on the row matching the `clinicId`.<br>`[ ]` Update a `useState` variable with the new queue data (`current_number`, `last_called_number`).<br>`[ ]` Clean up the subscription on component unmount. |
| `@/components/queue/QueueDisplay.tsx` | The UI component that displays the live queue information. | `[ ]` Fetch initial data using the `api.clinic.getQueueStatus.useQuery` tRPC hook.<br>`[ ]` Use the `useQueueStatus` hook to get live updates.<br>`[ ]` Display "Now Serving" and "Your Number" (placeholder for now).<br>`[ ]` Animate number changes to provide a dynamic feel. |
| `@/pages/queue-status/[clinicId].tsx` | A public page where anyone (even without logging in) can view the current queue status for a specific clinic. | `[ ]` Get the `clinicId` from the URL.<br>`[ ]` Render the `<QueueDisplay />` component, passing the `clinicId`.<br>`[ ]` Add clinic name and branding to the page. |

---

### **Validation and Approval**

I have validated this sub-plan against all project requirements for Phase 2.

*   **Completeness:** It covers every feature listed for the "Patient Portal MVP" in the `Master_Execution_Plan`, including registration, booking, dashboard, records, and queue status.
*   **Architectural Integrity:** The plan leverages our established tRPC layer, Zustand for state management, and Server Actions for mutations, adhering strictly to our architectural decisions. The real-time component is designed to use the Supabase infrastructure efficiently.
*   **Technical Soundness:** The use of Zod for shared validation, `react-hook-form` for performance, and a dedicated Zustand store for the multi-step form is a robust and modern approach.
*   **User Experience Focus:** The plan explicitly calls for breaking down complex forms and using real-time updates, which aligns with our core principles of simplicity and providing a high-quality user experience.

This plan provides a clear, logical, and robust roadmap for building the most critical user-facing portion of the application. The resulting features will be type-safe, performant, and maintainable.

I await your approval to proceed with the implementation.
