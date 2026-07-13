# Community Work — publishing spine on `uto`

Adds the missing **content publishing layer** onto the canonical `uto` schema, so a steward's work can flow **create → approve → publish everywhere** with per-town Row-Level Security. Additive; references the live `uto.towns` / `uto.coordinators` (does **not** duplicate them). This is the reconciled, single-source-of-truth direction (see the reconcile doc): keep `uto` as the operations engine, layer the publishing spine on top, retire the empty `public` schema later.

## Migrations
- `supabase/migrations/20260713000001_community_work_publishing_spine.sql`
  - Enums `work_visibility` (public/internal/national), `work_status`, `work_type`, `work_action`
  - `community_work` object + typed detail (`work_fixeasy_worker`, `work_familyhouse`, `work_business`, `work_event`, `work_podcast`) + `work_media`
  - `work_approvals` (approval/audit trail), `publishing_rules`, `publish_outbox`
  - State-machine trigger (draft→submitted→in_review→approved→published, approval-tier gate, auto-publish) + fan-out trigger → `publish_outbox`
  - Per-town RLS via `app.*` helpers reading `uto.role_assignments`; hybrid FTS+vector search RPC
  - Adds two nullable columns: `uto.towns.public_self_approve`, `uto.proofs.community_work_id`
- `supabase/migrations/20260713000002_identity_bridge.sql`
  - Mirrors `auth.users → uto.users` (backfill + trigger for new signups); documented coordinator bootstrap grant

## Approval tiers (mapped to uto roles)
`admin`/`ops` = national (3); `coordinator`/`deputy` = town (1). No regional tier yet → PUBLIC content needs national sign-off unless `uto.towns.public_self_approve = true`.

## Verified end-to-end on the live DB (2026-07-13)
Applied to `ubuntu-town-os` and smoke-tested (test rows removed afterward):
- Register FixEasy worker (public, submitted) → approve → **auto-published**; trail `submitted → approved → published`.
- Fan-out created **6 outbox channels**: `town_page, search, ai_index, coordinator_dashboard, fixeasy24, ubuntu_jobs`.
- **RLS boundary:** anonymous sees only the 1 published/public row (0 internal, 0 draft); the owning coordinator sees all 3.

## Notes for the reviewer
- The live DB already had these applied by the ops run (plus a `fix_work_status_transitions` follow-up and a `grant usage on schema uto` that are **folded into the spine file here**). For a fresh environment, applying these two files reproduces the correct end state.
- `public` schema is empty (0 rows) and slated for retirement once the enter app is repointed to `uto`; **not** dropped in this PR.
- Data-quality nit spotted: `uto.towns` contains both `bushbuckridge` and a misspelled `bushbukridge`.
- Precondition: assumes `uto.users.id == auth.users.id` (Supabase auth id). The identity bridge enforces the mirror going forward.
