Of course. Having established the patient-facing MVP, we now turn our focus to the professional side of the platform. Phase 3, the "Doctor Portal," is critical for clinic operations and empowers clinicians to manage their day and deliver care efficiently.

My approach will be to meticulously plan the creation of each file, ensuring the Doctor Portal is intuitive, fast, and secure. It must provide doctors with the information they need at a glance while streamlining the complex workflows of consultation, prescription, and certification. I have thoroughly reviewed the `Master_Execution_Plan` for Phase 3 and will align this plan with our existing architecture, database schema, and established coding patterns.

Here is the comprehensive sub-plan for implementing Phase 3.

---

### **Comprehensive Sub-Plan: Phase 3 - Doctor Portal**

**Objective:** To build the core features of the doctor-facing portal. This includes a secure login, a daily dashboard summarizing the schedule, tools for managing availability, a patient lookup feature, and a complete consultation workflow. This workflow will allow a doctor to document a visit, write a prescription, and generate a medical certificate (MC).

#### **Guiding Principles for Implementation**

1.  **Workflow Optimization:** Every UI/UX decision will be optimized for speed and clarity to minimize clicks and reduce the cognitive load on busy doctors. We will use keyboard shortcuts, intelligent defaults, and templating where possible.
2.  **Information Density & Clarity:** The dashboard and consultation views will be designed to present complex patient information in a clear, scannable format, highlighting critical data like allergies and chronic conditions.
3.  **Security & Privacy:** All data access will be strictly governed by our established RLS policies and tRPC `protectedProcedure`. No patient data will be exposed without proper authorization.
4.  **Component Reusability:** We will reuse and adapt components built in Phase 2 where applicable (e.g., date pickers, patient info cards) but create new, specialized components for the unique needs of the clinical workflow.

---

### **Execution Plan: Sequential File Creation**

The plan is structured to first build the backend API layer, then the foundational layout and dashboard, and finally the detailed workflow components.

#### **Part 1: API Layer Expansion (tRPC Routers for Doctor)**

**Objective:** Create the secure backend endpoints that will provide all necessary data for the Doctor Portal.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/trpc/routers/doctor.router.ts` | The tRPC router for all doctor-specific data and actions. This will be the workhorse for the portal. | `[ ]` Create a new `router` using `protectedProcedure` with middleware to verify the user's role is 'doctor'.<br>`[ ]` Implement `getDashboardSummary`: Fetches today's appointments, key patient alerts, and quick stats (e.g., number of patients waiting).<br>`[ ]` Implement `getScheduleByDate`: Fetches a detailed list of appointments for a given date.<br>`[ ]` Implement `manageAvailability`: A mutation to update `appointment_slots` (e.g., block time for a break).<br>`[ ]` Implement `searchPatients`: A procedure for securely searching for patients within the doctor's clinic. |
| `@/lib/trpc/routers/consultation.router.ts`| The tRPC router dedicated to the clinical consultation workflow. | `[ ]` Create a new `router` with role-protected procedures.<br>`[ ]` Implement `startConsultation`: Creates a new `medical_records` entry linked to an appointment.<br>`[ ]` Implement `saveConsultation`: A mutation to update the `medical_records` with diagnosis, notes, etc. Use Zod for input validation.<br>`[ ]` Implement `getPatientHistory`: Fetches a timeline of a specific patient's past medical records. |
| `@/lib/trpc/routers/prescription.router.ts`| The tRPC router for creating and managing prescriptions. | `[ ]` Create a new `router` with role-protected procedures.<br>`[ ]` Implement `createPrescription`: A mutation that creates a `prescriptions` header and multiple `prescription_items`.<br>`[ ]` Implement `searchMedications`: A procedure to query a drug database (initially a local JSON, later a national drug index). |
| `@/lib/trpc/routers/mc.router.ts` | The tRPC router for generating Medical Certificates. | `[ ]` Create a new `router` with role-protected procedures.<br>`[ ]` Implement `generateMc`: A mutation that takes consultation details and returns data needed to generate a PDF, updating the `medical_records` table accordingly. |
| `@/lib/trpc/root.ts` | (Update) Merge the new doctor-specific routers into the main `appRouter`. | `[ ]` Import the `doctorRouter`, `consultationRouter`, `prescriptionRouter`, and `mcRouter`.<br>`[ ]` Add them to the `appRouter` object. |

#### **Part 2: Doctor Portal Foundation & Dashboard**

**Objective:** Build the secure entry point and main landing page for doctors.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/components/doctor/DoctorLayout.tsx` | A specialized layout for the Doctor Portal, including a dedicated sidebar for clinical navigation. | `[ ]` Create a layout with a fixed sidebar and a main content area.<br>`[ ]` Sidebar should contain links to: Dashboard, Schedule, Patients, etc.<br>`[ ]` Include the main `Header` but perhaps with doctor-specific actions. |
| `@/pages/doctor/login.tsx` | The secure login page for doctors and other staff. It might be the same as the patient login but on a different path. | `[ ]` Create a login form similar to the patient login.<br>`[ ]` On successful login, check the user's role. If 'doctor', redirect to `/doctor/dashboard`. If not, redirect to their respective portals. |
| `@/components/doctor/TodaySchedule.tsx` | A key dashboard component showing a chronological list of today's appointments. | `[ ]` Use the `api.doctor.getDashboardSummary.useQuery` hook.<br>`[ ]` Display appointments in a list format, showing time, patient name, and visit reason.<br>`[ ]` Highlight the current/next appointment.<br>`[ ]` Each item should link to the consultation page for that patient. |
| `@/pages/doctor/dashboard/index.tsx` | The main dashboard for doctors, providing an at-a-glance view of their day. | `[ ]` Wrap the page in a `ProtectedRoute` that also checks for the 'doctor' role.<br>`[ ]` Use the `<DoctorLayout>` component.<br>`[ ]` Display key metrics (e.g., "Patients waiting: 3", "Appointments remaining: 8").<br>`[ ]` Render the `<TodaySchedule />` component. |

#### **Part 3: Schedule & Patient Management**

**Objective:** Create the tools for doctors to manage their time and look up patient information.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/components/doctor/ScheduleCalendar.tsx`| A visual calendar component for viewing the week's or month's schedule. | `[ ]` Use a library like `react-big-calendar` or build a custom grid.<br>`[ ]` Use `api.doctor.getScheduleByDate.useQuery` to populate the calendar.<br>`[ ]` Allow date navigation.<br>`[ ]` Clicking an appointment opens a summary popover/modal. |
| `@/pages/doctor/schedule/index.tsx` | The main schedule management page. | `[ ]` Use `<ProtectedRoute>` and `<DoctorLayout>`.<br>`[ ]` Render the `<ScheduleCalendar />`.<br>`[ ]` Add controls to switch between day, week, and month views. |
| `@/components/doctor/PatientSearch.tsx` | A search bar component for finding patients by name, NRIC, or phone number. | `[ ]` Create an input field with debouncing to prevent excessive API calls.<br>`[ ]` On input change, call the `api.doctor.searchPatients.useQuery` hook.<br>`[ ]` Display results in a dropdown list. |
| `@/pages/doctor/patients/[patientId]/history.tsx` | A detailed view of a single patient's complete medical history. | `[ ]` Use `<ProtectedRoute>` and `<DoctorLayout>`.<br>`[ ]` Get `patientId` from the URL.<br>`[ ]` Use `api.consultation.getPatientHistory.useQuery` to fetch all past records.<br>`[ ]` Display records in a reverse chronological timeline, showing key details of each visit. |

#### **Part 4: Consultation Workflow**

**Objective:** Build the end-to-end interface for a clinical consultation.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/components/forms/ConsultationForm.tsx` | The main form for documenting a patient visit, including vitals, diagnosis, and notes. | `[ ]` Use `react-hook-form` for state management.<br>`[ ]` Create sections for: Vitals, Chief Complaint, Examination Findings, Diagnosis (with ICD-10 search), Treatment Plan.<br>`[ ]` Implement an auto-save feature to prevent data loss. |
| `@/components/forms/PrescriptionForm.tsx` | A dynamic form for adding multiple medications to a prescription. | `[ ]` Use `react-hook-form`'s `useFieldArray` to manage a dynamic list of medications.<br>`[ ]` For each medication, include fields for name (with autocomplete from `api.prescription.searchMedications`), dosage, frequency, and duration.<br>`[ ]` Calculate total cost as items are added. |
| `@/components/forms/MCForm.tsx` | A simple form for generating a Medical Certificate. | `[ ]` Include fields for start date and number of days.<br>`[ ]` Add a text area for diagnosis/reason.<br>`[ ]` A "Generate PDF" button will trigger the `api.mc.generateMc.useMutation`. |
| `@/pages/doctor/consultations/[appointmentId].tsx`| The main page that brings the entire consultation workflow together. | `[ ]` Use `<ProtectedRoute>` and `<DoctorLayout>`.<br>`[ ]` Fetch appointment and patient details.<br>`[ ]` Display a two-column layout: Patient History on the left, new Consultation Form on the right.<br>`[ ]` Use tabs or an accordion to switch between the `<ConsultationForm>`, `<PrescriptionForm>`, and `<MCForm>`.<br>`[ ]` Include a "Save & End Consultation" button that triggers the save mutations. |

---

### **Validation and Approval**

I have validated this sub-plan against all project requirements for Phase 3.

*   **Completeness:** The plan covers all features specified for the "Doctor Portal" in the `Master_Execution_Plan`, from schedule management to the full consultation workflow.
*   **Architectural Integrity:** It builds seamlessly on the existing tRPC API layer and component structure, introducing a new role-specific layout (`DoctorLayout`) and routers protected by role-based access control. This maintains our clean separation of concerns.
*   **Technical Soundness:** The plan utilizes efficient data fetching patterns, robust form management with `react-hook-form`, and role-based security at the API level. The focus on workflow optimization is evident in the design of the main consultation page.
*   **Feasibility:** The work is broken down into logical, deliverable parts (API -> Layout -> Components -> Pages), which is a manageable sequence for the development team. The complexity of each component is acknowledged and can be built incrementally.

This plan provides a clear and robust roadmap for building the professional-grade tools that clinicians need to deliver effective care. The resulting portal will be secure, efficient, and deeply integrated with the rest of the platform.

I await your approval to proceed with the implementation of this plan.
