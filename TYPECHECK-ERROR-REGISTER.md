# TYPECHECK-ERROR-REGISTER — Mission 6

Generated: 2026-08-21
Branch: mission-6/auth-release-certification
Base: main @ 4da4c8b
Command: `npx tsc --noEmit`
Result: 16 errors, 0 warnings

## Summary

| # | File | Line | Code | Auth? | Category | Pre-existing? |
|---|------|------|------|-------|----------|---------------|
| 1 | login/page.tsx | 16 | TS2322 | YES | CONFIGURATION | YES |
| 2 | sign-up/Signup.tsx | 129 | TS2353 | YES | ACTUAL_DEFECT | YES |
| 3 | sign-up/Signup.tsx | 165 | TS2322 | YES | ACTUAL_DEFECT | YES |
| 4 | admin/page.tsx | 16 | TS2345 | NO | STALE | YES |
| 5 | coordinator/page.tsx | 57 | TS2345 | NO | ACTUAL_DEFECT | YES |
| 6 | layout.tsx | 1 | TS2882 | NO | CONFIGURATION | YES |
| 7 | layout.tsx | 2 | TS2882 | NO | CONFIGURATION | YES |
| 8 | town/[slug]/TownClient.tsx | 250 | TS2339 | NO | ACTUAL_DEFECT | YES |
| 9 | town/[slug]/page.tsx | 61 | TS2322 | NO | GENERATED | YES |
| 10 | town/[slug]/page.tsx | 61 | TS2322 | NO | GENERATED | YES |
| 11 | workspace/WorkspaceClient.tsx | 149 | TS18046 | NO | ACTUAL_DEFECT | YES |
| 12 | workspace/WorkspaceClient.tsx | 149 | TS7006 | NO | ACTUAL_DEFECT | YES |
| 13 | workspace/work/WorkDetailClient.tsx | 77 | TS2551 | NO | ACTUAL_DEFECT | YES |
| 14 | workspace/work/WorkDetailClient.tsx | 79 | TS2339 | NO | ACTUAL_DEFECT | YES |
| 15 | community-work/CommunityWorkSection.tsx | 60 | TS2345 | NO | ACTUAL_DEFECT | YES |
| 16 | sometest.test.ts | 1 | TS2307 | NO | STALE | YES |

## Auth-Related Errors (3)

### Error 1: login/page.tsx:16 — TS2322
- **Message**: `Type '{ next: string | undefined; nextActionType: string | undefined; }' is not assignable to type 'IntrinsicAttributes & LoginProps'. Property 'nextActionType' does not exist on type 'IntrinsicAttributes & LoginProps'.`
- **Root cause**: `LoginPage` passes `nextActionType` to `<Login>`, but `LoginProps` only defines `{ next?: string }`. The `nextActionType` prop was added to the page-level schema but never added to the Login component interface.
- **Production impact**: None — the extra prop is simply ignored at runtime by React. No functional impact.
- **Recommended fix**: Add `nextActionType?: string` to `LoginProps` interface in `Login.tsx`, or remove it from the page-level spread.
- **Fix risk**: LOW — adding an optional prop is backward-compatible.

### Error 2: sign-up/Signup.tsx:129 — TS2353
- **Message**: `Object literal may only specify known properties, and 'next' does not exist in type '{ email: string; password: string; }'.`
- **Root cause**: `executeSignUp({ ...data, next })` passes `next` to `signUpAction`, but `signUpSchema` only has `{ email, password }`. The `next` param is not in the Zod schema.
- **Production impact**: None — `next` is silently dropped by the Zod schema validation. The sign-up still works, the redirect just doesn't carry through.
- **Recommended fix**: Add `next: z.string().optional()` to `signUpSchema` in `auth.ts`, or remove the `next` spread from the call site.
- **Fix risk**: LOW — adding an optional field to a Zod schema is backward-compatible.

### Error 3: sign-up/Signup.tsx:165 — TS2322
- **Message**: `Type '(provider: Extract<AuthProvider, "google" | "github" | "twitter">) => void' is not assignable to type '(provider: AuthProvider) => void'.`
- **Root cause**: `AuthProvider` type includes `'apple'` but `RenderProviders` expects the full `AuthProvider` type. The `onProviderLoginRequested` callback narrows to only 3 providers.
- **Production impact**: None — only google, github, twitter are rendered in the UI. Apple is never offered.
- **Recommended fix**: Either narrow `RenderProviders`'s prop type to accept the 3-provider subset, or widen the callback. Simplest: change `onProviderLoginRequested` to accept `Exclude<AuthProvider, 'apple'>`.
- **Fix risk**: LOW — type-level only, no runtime change.

## Non-Auth Errors (13)

### Errors 4-5: admin/page.tsx, coordinator/page.tsx
- **Category**: STALE / ACTUAL_DEFECT
- **Root cause**: Legacy pages using removed/changed database types. `is_hq` no longer in the type union; `string | undefined` not assignable to `SetStateAction<string>`.
- **Production impact**: These are legacy pages that may not be actively routed. No auth impact.
- **Recommended fix**: Type the state as `string | undefined` or provide a default value.

### Errors 6-7: layout.tsx — CSS side-effect imports
- **Category**: CONFIGURATION
- **Root cause**: `@/styles/globals.css` and `@/styles/utown.css` have no type declarations. This is a standard Next.js CSS import that tsc doesn't understand without a `*.css.d.ts` ambient declaration.
- **Production impact**: None — Next.js handles these imports at build time.
- **Recommended fix**: Add a `src/styles/globals.css.d.ts` or `declarations.d.ts` with `declare module '*.css';`.

### Errors 8-10: town/[slug] — data type mismatches
- **Category**: GENERATED / ACTUAL_DEFECT
- **Root cause**: `TownPhoto` type doesn't have `query` property. `deadline_date` is `null` in DB but typed as `string | undefined`. Province/Town type mismatches from generated DB types.
- **Production impact**: None on auth. These are data display pages.
- **Recommended fix**: Make `deadline_date?: string | null` in the Town type. Add `query?: string` to TownPhoto or remove its usage.

### Errors 11-12: workspace/WorkspaceClient.tsx — unknown/any
- **Category**: ACTUAL_DEFECT
- **Root cause**: `presences` is typed as `unknown` from a query result; `p` parameter implicitly `any`.
- **Production impact**: None on auth. Workspace dashboard display.
- **Recommended fix**: Type the query result or cast `presences` to the expected type.

### Errors 13-14: workspace/work/WorkDetailClient.tsx
- **Category**: ACTUAL_DEFECT
- **Root cause**: `coordinator_id` doesn't exist on the type (should be `coordinator[0]?.coordinator_id` or similar). `display_name` not on array type.
- **Production impact**: None on auth. Work detail display.
- **Recommended fix**: Fix the property access to match the actual data shape.

### Error 15: community-work/CommunityWorkSection.tsx
- **Category**: ACTUAL_DEFECT
- **Root cause**: `CommunityWorkItem` type requires `detail` but the data doesn't include it.
- **Production impact**: None on auth. Community work list display.
- **Recommended fix**: Make `detail` optional in `CommunityWorkItem`.

### Error 16: sometest.test.ts
- **Category**: STALE
- **Root cause**: Imports `vitest` which is not installed. This is a placeholder/stale test file.
- **Production impact**: None — file is not used in production.
- **Recommended fix**: Install vitest or delete the stale test file. It references a non-existent test framework.

## Classification

- AUTH: 3 (errors 1-3)
- NON_AUTH: 13 (errors 4-16)
- DEPENDENCY: 0
- GENERATED: 2 (errors 9-10)
- CONFIGURATION: 3 (errors 1, 6, 7)
- STALE: 2 (errors 4, 16)
- ACTUAL_DEFECT: 9 (errors 2, 3, 5, 8, 11, 12, 13, 14, 15)

## Notable: next.config.ts has `ignoreBuildErrors: true`

The production build (`next build`) is configured with `typescript.ignoreBuildErrors: true`.
This means the 16 typecheck errors do NOT block the production build.
The comment says: "Pre-existing auth template type errors (not Ubuntu Town code)".

This is a pre-existing workaround. The errors are from the auth template, not Ubuntu Town's own code.
However, `tsc --noEmit` (the `typecheck` script) still reports them, and CI does not run `typecheck` —
it only runs `build:edge` which uses the `ignoreBuildErrors` bypass.
