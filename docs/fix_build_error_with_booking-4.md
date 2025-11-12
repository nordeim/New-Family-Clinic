I have fixed the new build-breaking type error in `UserTable` by aligning it with the current stubbed `admin.getUsers` implementation, using a minimal and type-safe approach without inventing behavior or widening types.

Issue recap

Build error:

- File: [`components/admin/UserTable.tsx`](components/admin/UserTable.tsx:1)
- Message (original):
  - `Type error: Argument of type '{ page: number; filter: string; }' is not assignable to parameter of type 'void | unique symbol'.`
- Root cause:
  - `admin.getUsers` in [`lib/trpc/routers/admin.router.ts`](lib/trpc/routers/admin.router.ts:47) is currently defined as:

    - `getUsers: adminProcedure.query(async () => { return []; }),`

    i.e.:
    - No input schema.
    - Returns a bare array `[]` (no `users`/`total` object).
  - `UserTable` was:
    - Calling `useQuery({ page, filter })` (mismatched signature).
    - Assuming `data` is `{ users, total }`, which contradicts the stub.

Goal:

- Make `UserTable` compile cleanly against the current router signature.
- Keep behavior as a harmless placeholder until real pagination/search is implemented.

Concrete changes

1) lib/trpc/routers/admin.router.ts (for reference only, no change in this step)

Key behavior:

- `getUsers`:

  - `getUsers: adminProcedure.query(async () => { return []; }),`

So the type of `api.admin.getUsers.useQuery()` resolves to:

- `data: unknown[]` (effectively `never[]` in some generics), with no `users` or `total` properties.

2) components/admin/UserTable.tsx

File: [`components/admin/UserTable.tsx`](components/admin/UserTable.tsx:1)

Final state after fixes:

- Query call:

  - Before (invalid):
    - `api.admin.getUsers.useQuery({ page, filter });`
  - After (matched to stub signature):
    - `const { data, isLoading, error } = api.admin.getUsers.useQuery();`

- Data handling:

  - Before:
    - Assumed shape:
      - `const users = data?.users ?? [];`
      - `const total = data?.total ?? 0;`
      - `const pageCount = Math.ceil(total / 10);`
  - After:
    - Treat `data` as a simple array from the stub:
      - `const usersCount = Array.isArray(data) ? data.length : 0;`
      - `const pageCount = 1; // placeholder until real pagination is wired`

- Render:

  - Before:
    - `"{users.length} users found."`
  - After:
    - `"{usersCount} users found."`

- The pagination UI remains visually present but uses `pageCount = 1` (no complex logic based on nonexistent `total`), which is acceptable as a placeholder consistent with the stubbed backend.

Why this resolves the build error

- The `useQuery` call now matches the procedure’s signature:
  - No input args passed to a query without `.input(...)`.
- We no longer access nonexistent `data.users` or `data.total`, so:
  - TS no longer complains about `never[]` vs `{ users: ...; total: ... }`.
- We avoid introducing new `any` or fake types:
  - All adjustments are based on the actual current behavior of `getUsers`.

Impact and alignment

- No runtime regressions:
  - Previously, `UserTable` relied on a contract that didn’t exist; now it gracefully reflects the stubbed server behavior.
- Code remains forward-compatible:
  - Once `getUsers` is enhanced to accept input and return `{ users, total }`, we can update `UserTable` accordingly without hacks.
- Stays consistent with the Meticulous Approach:
  - Diagnose: mismatch between stub router and optimistic UI.
  - Fix: align client with server’s current contract using minimal, explicit changes.
  - No relaxation of lint/type rules.

With this change plus the prior fixes (booking pages, admin router), `npm run build` should now proceed past the `UserTable` error. If any new issues appear, they can be addressed iteratively with similarly scoped, architecture-aligned corrections.
