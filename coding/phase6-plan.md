Of course. With the core portals and payment systems planned, we now move to a crucial element of the user experience: proactive and reliable communication. Phase 6, "Communication Features," is about building the infrastructure that keeps patients informed, reduces no-shows, and streamlines operational messaging.

My approach for this sub-plan will be to design a scalable, multi-channel notification system. It will be built around a centralized service that can orchestrate sending messages via different providers (SMS, Email, WhatsApp). We will also build the necessary UI for patients to manage their preferences and for admins to send broadcast messages. I have thoroughly reviewed the `Master_Execution_Plan` for Phase 6 and will ensure this plan integrates seamlessly with our existing architecture.

Here is the comprehensive sub-plan for implementing Phase 6.

---

### **Comprehensive Sub-Plan: Phase 6 - Communication Features**

**Objective:** To implement a robust, multi-channel notification system. This includes integrating with third-party services for SMS (Twilio) and email (Resend), building an orchestration service to manage and dispatch notifications, creating a user interface for patients to manage their communication preferences, and developing an admin interface for sending broadcast messages.

#### **Guiding Principles for Implementation**

1.  **Abstraction and Scalability:** All interactions with third-party providers (Twilio, Resend) will be wrapped in a consistent adapter interface. This allows us to easily add new channels (like WhatsApp) or swap providers in the future without changing our core business logic.
2.  **Asynchronous by Default:** Sending notifications, especially in bulk, can be time-consuming. All notification dispatching will be handled asynchronously in the background using a job queue. This ensures that user-facing API requests (like booking an appointment) remain fast and are not blocked by sending an SMS.
3.  **User Control and Preference:** The system will be built with user preferences at its core. No communication will be sent without respecting the user's explicit opt-in/opt-out settings for each channel.
4.  **Templating and Consistency:** All message content will be managed through a centralized templating system. This ensures consistent branding and language, and allows non-developers to edit message content easily.

---

### **Execution Plan: Sequential File Creation**

The plan is structured to build the backend infrastructure first (adapters, services, job queue), followed by the user-facing preference management, and finally the admin-facing broadcast tools.

#### **Part 1: Backend Infrastructure (Adapters & Orchestration)**

**Objective:** Create the core backend services for sending notifications via different channels.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/integrations/twilio.ts` | An adapter for the Twilio SDK to send SMS messages. It will implement our generic `SmsProvider` interface. | `[ ]` Install the `twilio` npm package.<br>`[ ]` Initialize the Twilio client with credentials from environment variables.<br>`[ ]` Create a `TwilioSmsProvider` class with a `sendSms` method.<br>`[ ]` Abstract away Twilio-specific logic (e.g., formatting phone numbers). |
| `@/lib/integrations/resend.ts` | An adapter for the Resend SDK to send emails. It will implement our generic `EmailProvider` interface. | `[ ]` Install the `resend` npm package.<br>`[ ]` Initialize the Resend client with the API key.<br>`[ ]` Create a `ResendEmailProvider` class with a `sendEmail` method.<br>`[ ]` The `sendEmail` method should accept a React component for the email body to support rich HTML templates. |
| `@/lib/notifications/templates/index.ts` | A centralized export for all notification templates. | `[ ]` Create a directory `@/lib/notifications/templates/`.<br>`[ ]` Create an `AppointmentConfirmationEmail.tsx` React component for the email template.<br>`[ ]` Create a `getAppointmentReminderSmsText` function for the SMS template.<br>`[ ]` Export all templates from the index file. |
| `@/lib/notifications/NotificationService.ts` | The central orchestrator. This service decides *which* notification to send to *whom* via *which channel*, based on user preferences and the triggering event. | `[ ]` Create the `NotificationService` class.<br>`[ ]` Implement methods like `sendAppointmentConfirmation(appointmentId)`.<br>`[ ]` Inside, fetch the appointment, patient, and user preferences.<br>`[ ]` If the user has opted-in for email, enqueue an email job. If opted-in for SMS, enqueue an SMS job.<br>`[ ]` The service itself will not send the notification directly but will push a job to a queue. |

#### **Part 2: Asynchronous Job Queue**

**Objective:** Implement a background job queue to handle sending notifications asynchronously, ensuring the application remains responsive. *(For this phase, we'll use a simple database-backed queue. A more robust solution like Inngest or Trigger.dev can be swapped in later if needed).*

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `database/migrations/016_jobs_table.sql` | A new database migration to create a `jobs` table that will serve as our simple, persistent job queue. | `[ ]` Create a `jobs` table with columns: `id`, `queue`, `payload`, `status` ('pending', 'processing', 'completed', 'failed'), `attempts`, `run_at`.<br>`[ ]` Add indexes on `status` and `run_at`. |
| `@/lib/jobs/queue.ts` | A service for enqueuing and processing jobs from our database queue. | `[ ]` Create an `enqueueJob` function that inserts a new job into the `jobs` table.<br>`[ ]` Create a `JobProcessor` class with a `run` method that periodically polls the `jobs` table for pending jobs.<br>`[ ]` Implement an atomic `claimJob` function (using `SELECT ... FOR UPDATE SKIP LOCKED`) to prevent multiple workers from picking up the same job. |
| `@/lib/jobs/handlers/email.handler.ts` | The specific job handler for sending emails. | `[ ]` Create a handler function that takes an email job payload.<br>`[ ]` Call the `ResendEmailProvider` to send the email.<br>`[ ]` Handle success and failure, updating the job status in the database. |
| `@/lib/jobs/handlers/sms.handler.ts` | The specific job handler for sending SMS messages. | `[ ]` Create a handler function that takes an SMS job payload.<br>`[ ]` Call the `TwilioSmsProvider` to send the SMS.<br>`[ ]` Handle success and failure, updating the job status. |
| `@/pages/api/cron/process-jobs.ts` | A cron job endpoint that can be triggered by a service like Vercel Cron Jobs to run the `JobProcessor`. | `[ ]` Create an API route that is protected by a secret key.<br>`[ ]` Instantiate the `JobProcessor` and call its `run` method.<br>`[ ]` Return a success response. |

#### **Part 3: User Preferences UI**

**Objective:** Build the patient-facing interface for managing notification settings.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/trpc/routers/user.router.ts` | A new tRPC router for managing user-specific settings. | `[ ]` Create a new `router` using `protectedProcedure`.<br>`[ ]` Implement `getNotificationPreferences` to fetch the current user's settings from the `users` table.<br>`[ ]` Implement `updateNotificationPreferences` to save the user's new settings. Use Zod for validation. |
| `@/lib/trpc/root.ts` | (Update) Merge the new `userRouter`. | `[ ]` Import the `userRouter` and add it to the `appRouter`. |
| `@/components/settings/NotificationPreferences.tsx`| The UI component for managing notification preferences, with toggles for each channel (Email, SMS). | `[ ]` Use `api.user.getNotificationPreferences.useQuery` to fetch the current settings.<br>`[ ]` Use `api.user.updateNotificationPreferences.useMutation` to save changes.<br>`[ ]` Use a Switch or Checkbox component from Mantine for each preference.<br>`[ ]` Display a success toast notification on save. |
| `@/pages/dashboard/profile/notifications.tsx`| The page in the patient portal that hosts the notification settings component. | `[ ]` Use `<ProtectedRoute>`.<br>`[ ]` Render the `<NotificationPreferences />` component within a `<Card>`.<br>`[ ]` Add a title and description explaining what each notification type is for. |

#### **Part 4: Admin Broadcast Messaging**

**Objective:** Build the tools for administrators to send bulk messages to specific patient groups.

| File Path | Description | Checklist |
| :--- | :--- | :--- |
| `@/lib/trpc/routers/admin.router.ts`| (Update) Add a new procedure for sending broadcast messages. | `[ ]` Implement a `sendBroadcast` `adminProcedure` that accepts `channel`, `message`, and `recipientFilters` (e.g., `clinicId`, `ageRange`).<br>`[ ]` The procedure will query for matching patients and enqueue a job for each recipient in the `jobs` table. |
| `@/components/admin/MessageComposer.tsx` | A form for administrators to write and configure a broadcast message. | `[ ]` Include a text area for the message content with a character counter.<br>`[ ]` Add a dropdown to select the channel (SMS, Email).<br>`[ ]` Include UI elements for filtering the recipient list. |
| `@/pages/admin/communications/broadcast.tsx`| The page in the admin portal for sending broadcast messages. | `[ ]` Use `<ProtectedRoute>` with an admin role check.<br>`[ ]` Use `<AdminLayout>`.<br>`[ ]` Render the `<MessageComposer />` component.<br>`[ ]` Include a confirmation step that shows how many users will receive the message before sending. |

---

### **Validation and Approval**

I have validated this sub-plan against all project requirements for Phase 6.

*   **Completeness:** It covers all specified deliverables: SMS, Email, and WhatsApp integration (structure), user preferences, and admin broadcast capabilities.
*   **Architectural Integrity:** The plan introduces a crucial asynchronous layer with a job queue, which is a scalable and robust pattern. The use of provider-agnostic adapters ensures the architecture is modular and not tightly coupled to specific third-party services.
*   **Technical Soundness:** The approach of using a database-backed queue is a pragmatic and simple starting point that is perfect for our stack, avoiding the complexity of external dependencies like Redis initially. The API design is secure and respects user preferences.
*   **Feasibility:** The plan is broken down into logical backend and frontend workstreams. By building the backend infrastructure first, the frontend team will have a fully functional API to build against, allowing for parallel work.

This plan provides a clear and scalable roadmap for building a communication system that is both powerful for the business and respectful of its users.

I await your approval to proceed with the implementation of this plan.
