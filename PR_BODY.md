## What This Is
The first real slice of Ubuntu Town's moat: one loop — steward does community work → approved → publishes everywhere on one source of truth.

## The Loop (verified)
1. Coordinator adds a FixEasy worker via `/workspace/new`
2. Submits → triggers state machine (draft → submitted → approved → published)
3. Approved item auto-publishes → fan-out to 6 channels in `publish_outbox`
4. Outbox worker drains → revalidates town page, upserts search, embeds for AI
5. Bushbuckridge public page renders from `community_work` (published + public)

## What's Included

### Phase B: Publishing Spine Migration (`0003_community_work_publishing.sql`)
- 5 enums: work_visibility, work_status, work_type, work_action, publish_channel
- Core table: `community_work` (unified content object with tsvector + pgvector)
- 5 typed detail tables: work_fixeasy_worker, work_familyhouse, work_business, work_event, work_podcast
- work_media, work_approvals, publishing_rules, publish_outbox
- BEFORE trigger: state machine with approval-tier gate + auto-publish
- AFTER trigger: fan-out to 6 channels per published item
- RLS: `app.*` helpers (has_role, has_town_scope, is_admin, my_town_id), per-town scoping
- Hybrid search RPC: `search_community_work()` (text + vector)
- NOTIFY trigger: `work_published` for outbox worker
- Extends `towns` (public_self_approve) + `proofs` (community_work_id)

### Phase C: Identity Bridge (`0004_identity_bridge.sql`)
- Backfills auth.users → uto.users
- Auto-sync trigger on new signups
- `app.grant_coordinator(user_id, town_slug)` function
- `app.verify_identity_bridge()` health check (5 assertions)

### Phase E: Outbox Worker (`workers/publish-outbox/index.ts`)
- 6 channel handlers: town_page, search, ai_index, fixeasy24, ubuntu_jobs, coordinator_dashboard
- Retry/backoff (max 3 attempts)
- OpenAI embedding integration (optional, skips if no key)

### Phase F: Workspace UI
- `/workspace` — Mission dashboard: stats, work list, Add CTA
- `/workspace/new` — 3-step form: type → details → visibility → submit
- `CommunityWorkSection` — town page component rendering published work from DB

### Tests + Runbook
- `tests/acceptance-publishing-spine.sql` — publish loop + RLS boundary tests
- `RUNBOOK.md` — apply, verify, grant coordinator, test, rollback

## Reconciliation with reboot-kasi-preview
- Adopted 0001 + 0002 migrations from `reboot-kasi-preview` branch as-is
- Built 0003 + 0004 as additive extensions (no modifications to 0001/0002)
- Did NOT fork a new lineage — extends the canonical uto schema

## How to Review
1. Read `RUNBOOK.md` first
2. Review `0003` migration — the core of the moat
3. Check RLS policies — anon sees only published+public, coordinators scope to their town
4. Run `tests/acceptance-publishing-spine.sql` in SQL Editor

## Guardrails Respected
- Never applied DDL to production unattended
- All additive & reversible (rollback SQL in RUNBOOK.md)
- Operational engine preserved (proofs, signals, opportunity_points untouched)
- RLS is the boundary, not the UI
- POPIA: audit trail intact (work_approvals table)
- Identity precondition: bridge resolves auth.uid() → uto.users
