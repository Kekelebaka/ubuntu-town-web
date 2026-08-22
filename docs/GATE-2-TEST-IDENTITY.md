# HUMAN GATE 2 — Test identity inspection

Captured: 2026-08-22T13:45Z
No service_role used. No real-user permissions changed. No new auth user created.

## Model (from code + live REST)

Canonical schema is `uto` (project ubuntu-town-os).

Auth: `auth.users` (email + Google). Signup not disabled. mailer_autoconfirm true.

App identity:
- `uto.users` — 1:1 with auth.users (id, email, primary_role default viewer)
- `uto.profiles` — optional display/town facts
- `uto.role_assignments` — UNIQUE(user_id, role_key, town_id); town_id NULL = national
- `uto.coordinators` — 1:1 with users; town_id + status
- `uto.coordinator_assignments` — extra town links

Workspace gate (`WorkspaceClient`):
1. `auth.getUser()`
2. `role_assignments` where role_key in (coordinator, deputy, admin, ops)
3. town from that assignment

Least-privilege role that still exercises workspace + own-town + denied cross-town:
**coordinator scoped to one town** (not admin, not ops, not town_id NULL).

`coordinators` row is not required for the workspace login gate, but is required
for people/passport surfaces. Create it for Gate 11 completeness.

## Existing fixture?

No dedicated test fixture found in repo/env.
`kekelebaka@gmail.com` **already exists** (GoTrue signup 422 `User already registered`).
That is a real operator mailbox. Using it as a test fixture would mean mutating
a real user. Forbidden.

## Required setup (new unused mailbox only)

EMAIL REQUIRED: a mailbox you control that is NOT already in auth.users
  (do not reuse kekelebaka@gmail.com)
ROLE: coordinator (town-scoped only)
TOWN: Senekal `562a10e9-0803-4d62-b61f-1f2799e83e67` (uto, status=launch)
  Cross-town deny target: Ladybrand `af1c288d-7e20-451c-8474-b2263e9977a4`
PROFILE RECORD REQUIRED: yes — `uto.profiles` id=auth uid, town_id=Senekal,
  display_name=`MB7 Test Coordinator`
COORDINATOR RECORD REQUIRED: yes — `uto.coordinators` id=auth uid, town_id=Senekal,
  status=`active`, display_name same
OTHER RECORDS:
  - `uto.users` should appear via signup trigger; if missing, insert id+email only
  - `uto.role_assignments` one row: role_key=coordinator, town_id=Senekal
  - do NOT insert national (town_id NULL) roles
  - do NOT insert admin/ops
CLEANUP PLAN:
  - ban/disable the auth user
  - delete role_assignments, coordinators, profiles rows for that uid
  - leave towns and RLS untouched

Auth journeys 1–6 need only the auth user (password set by you via reset,
never invented here). Journeys 7–10 need the town-scoped coordinator row.

## Blocker to create now

Creating records for kekelebaka@gmail.com is refused:
it is an existing user. Supply a fresh unused test email, or confirm in
writing that this Gmail is throwaway and may receive a coordinator grant
(still will not grant admin/ops/national).
