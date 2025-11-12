I have fixed the new build-breaking type error in the admin dashboard by aligning the dashboard metrics usage with the actual admin router return shape, using minimal, type-safe changes.

Problem recap

Build failure:

- File: [pages/admin/dashboard/index.tsx](pages/admin/dashboard/index.tsx:1)
- Error:
  - `Property 'appointmentsToday' does not exist on type '{ totalPatients: number; totalAppointmentsToday: number; pendingLeads: number; completedAppointmentsThisWeek: number; }'. Did you mean 'totalAppointmentsToday'?`

Actual API shape (from [lib/trpc/routers/admin.router.ts](lib/trpc/routers/admin.router.ts:64)):

- `getDashboardMetrics` returns:

  - `totalPatients: 0,`
  - `totalAppointmentsToday: 0,`
  - `pendingLeads: 0,`
  - `completedAppointmentsThisWeek: 0,`

No `appointmentsToday` or `monthlyRevenue` fields exist.

Targeted fix

1) pages/admin/dashboard/index.tsx

File: [pages/admin/dashboard/index.tsx](pages/admin/dashboard/index.tsx:1)

Changes:

- Appointments metric:

  - Before:
    - `value={data?.appointmentsToday ?? 0}`
  - After:
    - `value={data?.totalAppointmentsToday ?? 0}`

  This directly matches the `getDashboardMetrics` shape and removes the invalid property access.

- Revenue metric:

  - Previously referenced `data?.monthlyRevenue`, which is not part of the stubbed metrics and causes type mismatch.
  - Updated to a neutral placeholder consistent with the stub:

    - Before:
      - `value={`$${(data?.monthlyRevenue ?? 0).toLocaleString()}`}`
      - `change="+12.4%"`
    - After:
      - `value="$0"`
      - `change="+0.0%"`

  This keeps the card visually present while avoiding reliance on non-existent fields. It is intentionally conservative until real revenue metrics are implemented server-side.

Why this is correct and safe

- Aligns with backend contract:
  - `AdminDashboardPage` now only reads fields that `getDashboardMetrics` actually returns.
- Fix is minimal:
  - No new types, no schema changes, no behavioral surprises.
  - Revenue card becomes a static placeholder instead of referencing undefined data.
- Preserves architecture consistency:
  - Admin metrics remain derived from `api.admin.getDashboardMetrics.useQuery()` as documented.
  - Once metrics expand, the UI can be updated in lockstep.

Summary of booking/admin fixes now in place

These are already applied and not re-touched here, but are relevant to confirm build stability:

- `lib/trpc/routers/admin.router.ts`:
  - `getUsers` returns `[]` (stub).
  - `getDashboardMetrics` returns the four documented fields.
  - Booking leads procedures (`listPublicBookingRequests`, `updatePublicBookingRequestStatus`, `linkPublicBookingRequestToAppointment`) are wired and typed.
  - `_AdminLeadRow` helper type documents the lead shape without causing unused-var lint errors.

- `components/admin/UserTable.tsx`:
  - Uses `api.admin.getUsers.useQuery()` with no args to match stub.
  - Displays a placeholder count using the length of `data` when it is an array.
  - No reliance on nonexistent `users`/`total` fields.

- `src/app/portal/appointments/book/page.tsx`:
  - All `any` removed via `Slot` + `normalizedSlot`.
  - Apostrophe escaped (`you&apos;re`) to satisfy `react/no-unescaped-entities`.

- `src/app/admin/bookings/page.tsx`:
  - Strongly typed `AdminLeadRow`.
  - Leads list renders using that type without `any`.

With the dashboard metric fix, the last reported type mismatch is resolved. The project is ready for another:

- `rm -rf .next`
- `npm run build`

which should now proceed past the `pages/admin/dashboard/index.tsx` error given the current codebase state and documented contracts.
