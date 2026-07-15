# Ubuntu Town — Community OS · North Star Design Specification

**Version:** 1.0 · **Date:** 2026-07-15
**Author:** Chief + Hermes (Architecture Symposium) · **Stack:** Next.js 15 · React 19 · Supabase (`uto`/`app`) · Cloudflare Pages + Workers
**Scope:** Right-sized for **≤100 towns this year, ≤1,000 in 2–3 years** (no hyperscale engineering)

> This spec is an **architecture document, not a build brief**. Every recommendation is labelled **KEEP / REFINE / ADD / REMOVE** against what is live today. Build briefs derived from it inherit the live guardrails — cookie SSR client, RLS+grants, additive migrations, POPIA consent, mobile-first.

---

## 0 · Executive Vision — Ubuntu Town as an Operating System for Communities

An operating system is the thing every other app runs on top of. Ubuntu Town is the **data + permission + publishing + collaboration layer for African community work**. A coordinator does "Community Work" once; it is proof-based, consented, AI-readable, and published everywhere — town page, national portal, KasiBuy, FixEasy24, FamilyHouse, Inside.Town, Daycare OS, search, AI index, municipal feeds.

**The OS thesis:** one source of truth, published everywhere, owned by the town.

Three pillars everything must deepen:
1. **(a)** One source of truth → omni-publish.
2. **(b)** Proof + consent = defensible data moat (AI-grade, once-only, POPIA).
3. **(c)** The coordinator flywheel (missions → readiness → earnings → retention).

**Ubuntu Town is NOT:** a tourism site, a CRM-for-its-own-sake, a BI project, or a bespoke platform. It is a **thin, composable layer** over 160+ South African towns, turning coordinator work into verifiable, publishable, AI-readable fact.

**What makes the data impossible to replace:** once an organisation is proof-verified by a coordinator under consent, no competitor can replicate that ground-truth. AI agents, municipal programmes, funders, and citizens all need the same verified graph — and it lives here, in `uto`.

---

## 1 · The Anchor — "Why would a coordinator open this every morning?"

A coordinator has exactly **one reason** to open the workspace: **today has work to do, and someone is counting on me.**

Concretely, the morning opens with:
- **3 missions waiting** (daily + weekly), with a streak flame.
- **2 work items in review**, with a notification bell that pings when HQ acts.
- **Town Readiness Score** hovering at 62 — they see what closes the gap.
- **One voice note from a co-coordinator** ("the spaza on Maseru Rd needs re-verify").
- **An AI-drafted WhatsApp message** they can send to the daycare principal who hasn't responded in 14 days.

The workspace is **a daily cockpit**, not a directory. Every feature must shorten the path between *open app* and *close one piece of work*.

Why a municipality relies on it: one verified, consented, AI-readable graph they can cite in reports — no more PDFs.
Why a citizen trusts it: every record has a consent trail and a verification stamp; anonymous rumours can't live here.
Why a funder invests: they see impact_score + readiness_score + verified volume climbing in real time.

---

## 2 · KEEP / REFINE / ADD / REMOVE — Master Table

| Area | Verdict | Rationale |
|---|---|---|
| Publishing spine (`community_work` → `tg_work_guard` → `tg_work_after` → `publish_outbox`) | **KEEP + EXTEND** | Core moat. Add typed-detail tables, richer channel payloads, embed hooks. |
| Cookie `@supabase/ssr` browser client (`@/lib/supabase-client.ts`) | **KEEP — UNTOUCHABLE** | Login depends on it. Never reintroduce localStorage sessions. |
| RLS + GRANT pairing pattern | **KEEP — ENFORCED** | Every new table migration ships both. Verified via `auth.uid()` against PostgREST. |
| Additive numbered migrations (`0013+`) | **KEEP** | Never edit `0001`–`0011`. Always additive. |
| Workspace tabs (work / activity / missions / leaderboard) | **KEEP** | Shipped. Add **CRM, Inbox, AI Chief of Staff** as tabs. |
| Realtime town channel (`town:<id>`, presence + `postgres_changes`) | **KEEP + REFINE** | Keep scoped. Refine to filter `event=UPDATE, status=eq.published` for perf. |
| POPIA consent (`work_consent`, `is_work_verified`) | **KEEP** | The moat. Do not expose PII to `anon`. |
| Missions + `readiness_score` | **KEEP + EXTEND** | Keep daily/weekly cadence. Extend to monthly/quarterly + town goals. |
| Town pages (static, ISR via Cloudflare) | **KEEP** | The "published" surface. Add `ai_index` hooks for agent-readable pages. |
| `coordinators` + `role_assignments` + `app.is_national()` | **KEEP** | Already RBAC-complete. Refine: add province/district roles. |
| Outbox worker (`workers/publish-outbox`) | **KEEP** | Cron drains `publish_outbox`. Refactor to per-channel retry budgets. |
| CRM contacts/activities tables (existing `crm_*`) | **REFINE** | Wire into workspace tab; add per-org timeline. |
| `signals`, `stories`, `businesses` (legacy 0-rows) | **REMOVE** | Deprecated by `community_work` in 0003. Drop in cleanup migration. |
| Separate "admin" and "workspace" apps | **REMOVE** | Unify. Coordinator Workspace is the single cockpit — HQ is a scoped tab. |
| Microservices, event-sourcing, sharding | **REMOVE (NEVER ADD)** | Over-build for ≤1,000 towns. One Postgres, one schema. |
| Custom auth, bespoke login flow | **REMOVE (NEVER ADD)** | Supabase Auth is sufficient; role layer on top is sufficient. |
| Separate graph database | **REMOVE (NEVER ADD)** | Postgres tables + CTEs do the graph for ≤1M rows. |

---

## 3 · Design Council — 8 Lenses, Crisp Recommendations

### L1 · Domain (DDD · Evans/Vernon)
*Question: what are our real aggregates — no over-fragmentation?*
1. **KEEP** 5 aggregates: `Town`, `Coordinator`, `CommunityWork`, `Organisation`, `Initiative` (a "funding stream" / "programme"). Do not add more.
2. **ADD** an `organisations` table (the typed `business`, `daycare`, `church`, `school` etc. — one row, a `kind` discriminator, typed details via JSONB). Collapses 5+ fragmented tables.
3. **REMOVE** the `businesses`, `stories`, `signals` legacy tables; they pre-date `community_work`.
4. **REFINE** `community_work.detail` JSONB — keep it lean; move frequently-queried fields to first-class columns.

### L2 · Simplicity (Hickey / Linear / Apple)
*Question: what is the smallest set of primitives that expresses everything?*
1. **KEEP** one noun for content (`community_work`), one for collaboration (`work_comments` + `notifications`), one for trust (`work_consent` + verification cols). That's it.
2. **REMOVE** the split between "admin" and "workspace". One workspace, role-scoped.
3. **ADD** a single **Inbox** primitive (`coordinator_inbox`) collapsing notifications + mentions + assignments + approvals-queue. One place to triage.
4. **REFINE** tab model: **Work · Inbox · CRM · Missions · Activity · AI**. Six tabs, no more.

### L3 · Data & Scale-to-1k (Kleppmann / Postgres+PostGIS)
*Question: how do we serve 10× data without microservices?*
1. **KEEP** single Supabase project; `uto` schema.
2. **ADD** PostGIS `geometry(Point, 4322)` on `community_work` populated from GPS capture; materialised view `mv_town_coverage` refreshed hourly.
3. **ADD** a single `knowledge.graph_edge` table (from_id, to_id, edge_type, meta) for cross-entity relationships. **Do not** introduce a graph DB.
4. **REFINE** `embedding` column → add `gte-small-384` index; retire `vector(1536)` if you can re-embed cheaply (saves 4× storage).
5. **ADD** monthly partitioning on `publish_outbox` + `work_approvals` only if row counts breach 5M (monitor first).

### L4 · Realtime Collaboration (Figma / Linear / Slack)
*Question: how does real-time serve the flywheel, not become a gimmick?*
1. **KEEP** `town:<id>` channel with presence + `postgres_changes`. Add `announcement` event type.
2. **ADD** voice-note comments via R2 (30-sec max) — async, low-data.
3. **ADD** **assign** events: a coordinator assigns a work item to another; Realtime pings.
4. **REMOVE** ambitions for Yjs/Liveblocks in sprint 1 — Supabase Realtime is enough for ≤1,000 towns.

### L5 · Product/UX (Jobs/Ive/Bret Victor/Notion)
*Question: what does the mobile-first, low-data, multilingual cockpit feel like?*
1. **KEEP** current warm-cream palette + emoji-rich type labels. It works.
2. **ADD** a **PWA shell** (`next-pwa` with Workbox) — offline capture, service-worker for photos+GPS when field connectivity drops.
3. **ADD** `i18n` via `next-intl` (English default; isiZulu/Sesotho/isiXhosa first pass). Ship **every string** via the i18n layer — no hardcoded English in components.
4. **REMOVE** long forms. Split the new-work form into a progressive capture: Type→Title→Proof→Consent→Submit.

### L6 · Civic/Gov (Estonia/GDS/Smart Nation)
*Question: once-only, interoperable, not bureaucratic.*
1. **KEEP** consent + audit as first-class primitives.
2. **ADD** a machine-readable `org_profile.jsonld` (schema.org) endpoint per organisation — so municipal portals can consume it.
3. **ADD** a `/api/open/{town_slug}.json` — a read-only, RLS-respecting, town-snapshot endpoint for funders/NGOs.
4. **REMOVE** any path that recreates national-ID verification beyond POPIA compliance. We are not Home Affairs.
5. **REFINE** moderation queue as an explicit role (`moderator`) — decouple from `coordinator`.

### L7 · Knowledge Graph (Palantir/OSM/ArcGIS)
*Question: one graph, in Postgres, no separate DB.*
1. **ADD** `organisations`, `people`, `assets`, `projects`, `funding`, `volunteers`, `champions` (one row per entity, typed by `kind`).
2. **ADD** `graph_edge(from_id, to_id, rel_type, meta)` for N:N relationships.
3. **ADD** PostGIS `geometry` columns on spatial entities; materialised views for nearest-N queries.
4. **ADD** a single `resolve_entity(id)` RPC returning all connected edges — the entry point for AI.
5. **REMOVE** per-relationship tables (no `organisation_has_funding` etc.).

### L8 · AI (Anthropic/OpenAI/LangGraph)
*Question: per-coordinator chief of staff — how?*
1. **ADD** a new `ai_sessions` table (per-user, per-task), powered by Vercel AI SDK + Edge Functions.
2. **ADD** a **MCP server** (`tools/mcp-uto`) exposing `resolve_entity`, `search_work`, `town_activity`, `town_snapshot`.
3. **ADD** AI tooling wired to: summarise work, draft comms, suggest missions based on coverage gaps, draft impact reports for funders.
4. **KEEP** embeddings in `community_work.embedding`; add `organisations.embedding`, `towns.embedding`.
5. **REMOVE** any plan to train/fine-tune a model — all inference via API.

---

## 4 · Surfaces — What a Coordinator Actually Touches

### S1 · Coordinator Workspace (PRIMARY — daily driver)
- **Purpose:** do today's work, see town health, triage inbox.
- **Primary jobs:** capture work, approve, discuss, capture proof, send WhatsApp, check missions.
- **Tabs:** Work · Inbox · CRM · Missions · Activity · AI.
- **Role scope:** town-scoped via `app.rank_for_town`.
- **RLS:** everything uses `app.can_read_work` / `app.can_write_work`.

### S2 · Town Surface
- **Purpose:** published, public graph — citizens, funders, municipal visitors.
- **Primary jobs:** browse entities, read stories, verify contact details, contribute signals.
- **Forms:** town page (static/ISR) + digital twin map (PostGIS) + `/town/{slug}/ai.md` for agents.
- **Roles:** `anon` (read), `citizen` (optional claim).

### S3 · HQ / National Oversight
- **Purpose:** cross-town rollups, coordinator support, moderation.
- **Primary jobs:** view readiness heatmap, find inactive coordinators, unblock stuck approvals, issue grants.
- **Forms:** `/admin` (reworked as a workspace role, not a separate app).
- **Role scope:** `app.is_national()` gate.

### S4 · Organisation / Partner (LIGHT)
- **Purpose:** claim & maintain a listing, see impact.
- **Primary jobs:** self-serve update of basic fields, acknowledge consent renewal, pull JSON-LD profile.
- **Channel:** mostly WhatsApp + a lightweight `/{org_slug}/manage` page.
- **Auth:** magic-link claim + OTP.

### S5 · Citizen / Volunteer (LIGHT)
- **Purpose:** browse town, participate via public pages + WhatsApp.
- **Minimal app surface.** WhatsApp bot is primary interface; app only needed for richer browsing.

### S6 · Moderator / Review Queue
- **Purpose:** trust tooling — verify proofs, audit consent, re-verify stale records.
- **Role:** distinct from `coordinator` (a coordinator can't approve their own work).
- **UX:** list of pending items, proof viewer, one-click verify/reject with reason.

### S7 · AI (embedded, not separate)
- **Purpose:** the coordinator's chief of staff.
- **Forms:** floating pill in workspace + inline suggestions (draft comms, summary, mission hint). No standalone app.

### Role Model (right-sized, collapses to what's needed now)
- **National** (`admin`, `ops`) — full cross-town read; moderation write.
- **Province / District** (ADD) — read across towns in scope.
- **Town** (`coordinator`, `deputy`) — full town write/scope.
- **Organisation contact** — self-serve write on own profile, read own.
- **Volunteer** — minimal (signals only).
- **Citizen / Anon** — public read only.
- **Moderator** (ADD) — cross-town review permission.
- **AI service role** — service_role only; never a user role.

---

## 5 · Design Areas — Schema Deltas on `uto`

All migrations labelled `0013+`, additive. RLS + GRANT pairs mandatory.

### 5.1 Collaboration (extend)
- **KEEP** `work_comments`, `notifications`, `town_activity`.
- **ADD** `work_comments.reactions jsonb` (emoji reactions — low-cost engagement).
- **ADD** `work_comments.audio_path text` (R2 voice notes).
- **ADD** `town_announcements(id uuid, town_id uuid, body text, expires_at timestamptz, created_by uuid)` with RLS `app.has_town_scope`.
- **REFINE** presence channel: add `online_at` and `status` (e.g. "field work").
- **ADD** `work_assignments(id uuid, work_id uuid, assignee_id uuid, assigner_id uuid, note text, accepted_at timestamptz, created_at timestamptz)` with RLS via `can_write_work` + `assignee = auth.uid()`.

### 5.2 Mission Engine (extend)
- **KEEP** `missions`, `my_missions`, `readiness_score`.
- **ADD** `cadence ∈ (daily, weekly, monthly, quarterly, once)` — extend `cadence` enum.
- **ADD** `town_goals(id uuid, town_id uuid, metric text, target int, period_start date, period_end date)` — town-level targets.
- **ADD** `adaptive_missions(id uuid, town_id uuid, generated_at timestamptz, payload jsonb)` written nightly by the AI Chief of Staff (a cron job).
- **REFINE** `readiness_score` to include a `consent_ratio` component (what % of verified records have valid consent).
- **REMOVE** ambitions for a heavyweight rules engine. SQL + cron is enough.

### 5.3 Digital Twin + Knowledge Graph
- **ADD** `uto.organisations(id, kind, town_id, display_name, description, contact, geometry Point?, embedding vector(384), verified_at, consent_until, meta jsonb)` — one table, `kind` = `business|daycare|church|school|clinic|ngo|other`. RLS: read via `can_read_organisation`, write via `app.has_town_scope`.
- **ADD** `uto.people(id, town_id, display_name, role, whatsapp, consent_until, geometry?, meta)` — citizens/volunteers/champions. RLS: `user_id = auth.uid()` for own; `has_town_scope` for coordinator.
- **ADD** `uto.assets(id, town_id, kind, label, geometry, verified_by)` — infrastructure, projects.
- **ADD** `uto.projects(id, town_id, title, funding_id?, geometry?, status, start_date, end_date)`.
- **ADD** `uto.funding(id, source_name, programme, amount_zar, start_date, end_date)`.
- **ADD** `uto.graph_edge(from_id uuid, to_id uuid, rel_type text, meta jsonb, created_at)` — **N:N relationships**. RLS: read via either endpoint's scope.
- **ADD** PostGIS: `create extension if not exists postgis;` in migration `0013_graph_extension.sql`. Backfill `community_work.geometry` from existing `gps_lat/gps_lng`.
- **ADD** `resolve_entity(_id) → jsonb` RPC returning all direct edges + counts.
- **ADD** materialised views (refreshed hourly via pg_cron):
  - `mv_town_coverage(town_id, total_orgs, verified_orgs, unverified_orgs, population_served_est)`
  - `mv_town_heatmap(town_id, readiness, readiness_delta_7d)`
- **REMOVE** all legacy entity tables (`businesses`, `stories`, `signals`) — **migration `9999_cleanup_legacy.sql`**.

### 5.4 AI — Chief of Staff
- **ADD** `ai_sessions(id uuid, user_id uuid, task text, input jsonb, output jsonb, created_at timestamptz)` — audit + context for AI. RLS: `user_id = auth.uid()`.
- **ADD** `ai_embeddings(id, entity_kind, entity_id, embedding vector(384), updated_at)`.
- **ADD** `ai_suggested_missions(id, town_id, payload jsonb, accepted_at timestamptz, generated_at timestamptz)` — populated nightly.
- **ADD** Vercel AI SDK Edge Function `src/app/api/ai/chat/route.ts` (streaming, auth-gated).
- **ADD** MCP server `tools/mcp-uto` exposing: `resolve_entity`, `search_work`, `town_activity`, `town_snapshot`, `list_missions`, `update_mission`.
- **REMOVE** any fine-tuning or self-hosted LLM ambition. API-only inference.

### 5.5 Security / Trust
- **KEEP** RLS+GRANT pairing. Add `audit_log(actor_id, action, entity_kind, entity_id, meta, created_at)` — append-only, SECURITY DEFINER writes.
- **ADD** soft-delete + versioning on `community_work` via `deleted_at` (already exists) + `community_work_history` table (one row per mutation).
- **ADD** rate limits per user per route via Cloudflare Workers middleware (`src/middleware.ts`).
- **ADD** audited impersonation-for-support: a new `support_sessions(id, impersonator_id, target_user_id, reason, started_at, ended_at)` — requires `app.is_national()`. Every row logged to `audit_log`.
- **KEEP** POPIA consent; **ADD** annual consent renewal reminder (cron → notification).
- **ADD** RLS policy tests baked into migration `0013_rls_tests.sql` (test functions called via SQL, not unit tests — keeps the verification in the schema).

### 5.6 Offline / Low-data / Multilingual
- **ADD** PWA shell via `next-pwa` (Workbox precache static assets; background sync for failed writes).
- **ADD** `src/locales/{en,zu,st,xh}/common.json` — all UI strings translated; `next-intl` config in `next.config.ts`.
- **ADD** image pipeline: auto-resize >800px to 800px WebP client-side before upload (saves 70% data).
- **REMOVE** any heavy JS bundle ambition — ship <100kB initial JS for workspace.

### 5.7 Inbox (unify triage)
- **ADD** `coordinator_inbox(id, user_id, item_kind text [mention|assignment|approval|rejection|announcement|reminder], item_id uuid, unread boolean, priority int, created_at)` — one triage list. **NOT** a new notification type — a view over `notifications` + `work_assignments` + `town_announcements`.
- **ADD** materialised view `mv_inbox(user_id, rows jsonb, updated_at)` refreshed on writes via trigger.
- **REMOVE** plans for a separate Inbox app — it's a workspace tab.

---

## 6 · Role & Permission Model (Right-Sized)

| Role | Scope | Key Permissions |
|---|---|---|
| `admin` | national | full read/write; impersonation-for-support; publish-rules admin |
| `ops` | national | same as admin minus impersonation |
| `province` | province (via `role_assignments.province_id`) | read across towns in province |
| `district` | district | read across towns in district |
| `coordinator` | town | full town write; approve town-visible work |
| `deputy` | town | same as coordinator minus publish-rules edit |
| `moderator` (ADD) | cross-town | review/approve queue; cannot create work |
| `organisation_contact` (ADD) | own org | self-serve profile write; read own |
| `volunteer` | town (via `role_assignments`) | create signals; read town visible |
| `citizen` | — | public read only |
| `anon` | — | public read only |
| service_role | system | worker + cron — never exposed to clients |

Additive migration: `0014_extend_roles.sql` — extend `uto.role_key` enum with `province, district, moderator, org_contact, volunteer`. Extend `role_assignments` with nullable `province_id`, `district_id`, `org_id`. Refine `app.rank_for_town` to return province/district tiers.

---

## 7 · Roadmap — Phased, Executable, Migration-Numbered

### Phase 1 — Foundation (Migrations 0013–0016) · 3 weeks
- **Migration 0013:** `postgis` extension + `community_work.geometry` + `organisations`, `people`, `graph_edge`, `assets`, `projects`, `funding` tables + RLS + GRANTs.
- **Migration 0014:** extend `role_key` enum + `role_assignments` scope columns + refined `rank_for_town`.
- **Migration 0015:** `town_announcements`, `work_assignments`, `support_sessions`, `audit_log` tables + RLS + GRANTs.
- **Migration 0016:** `coordinator_inbox` materialised view + `mv_town_coverage` + `mv_town_heatmap` + hourly pg_cron refresh schedules.
- **Acceptance:** every table has paired RLS + GRANT verified via a `test_rls_authenticated()` function; workspace loads without errors.

### Phase 2 — Workspace Tabs (Front-end, no migrations) · 3 weeks
- Wire `Inbox` tab (materialised view).
- Wire `CRM` tab (rework of existing `crm_contacts`/`crm_activities` views).
- Wire `AI` tab (floating pill → chat with `resolve_entity`, `search_work`, `suggest_mission` tools).
- Add `next-intl`, first 2 languages (English + isiZulu).
- Add PWA shell (Workbox).
- **Acceptance:** coordinator can triage inbox, view CRM timeline, run 3 AI tasks in-chat.

### Phase 3 — AI Chief of Staff (Migrations 0017–0018) · 2 weeks
- **Migration 0017:** `ai_sessions`, `ai_embeddings`, `ai_suggested_missions` + RLS/GRANTs.
- **Migration 0018:** nightly `populate_adaptive_missions()` function + pg_cron schedule.
- Deploy `src/app/api/ai/chat/route.ts` + MCP server `tools/mcp-uto`.
- **Acceptance:** a coordinator can ask "what's my town missing this week?" and get a grounded, RLS-respecting answer.

### Phase 4 — Trust + Verification 2.0 (Migration 0019) · 2 weeks
- Add proof versioning (`community_work_history`) + soft-delete UI.
- Add consent renewal reminder cron.
- Add audited impersonation-for-support UI (admin-only).
- Add rate-limit middleware in `src/middleware.ts`.
- **Acceptance:** admin can impersonate a coordinator for support; every action writes `audit_log`; no PII leaks.

### Phase 5 — Knowledge Graph Surfaces (Migration 0020) · 3 weeks
- **Migration 0020:** `resolve_entity` RPC + materialised views `mv_entity_connections`.
- Add Town Digital Twin map (PostGIS + MapLibre GL JS).
- Add `/api/open/{town_slug}.json` + JSON-LD org profiles.
- **Acceptance:** every entity has a resolve page; AI can traverse the graph via MCP.

### Phase 6 — Legacy Cleanup (Migration 9999) · 1 week
- Drop `businesses`, `stories`, `signals` (all 0 rows, replaced by `community_work` + graph nodes).
- **Acceptance:** no app references removed tables.

---

## 8 · Open-Source Recommendations (Mature, Stack-Compatible)

| Pick | Why | Maintenance / Risk |
|---|---|---|
| **shadcn/ui** (current) | Copy-in components; no runtime dep. | Own the code; low risk. **KEEP.** |
| **next-intl** | Mature i18n for App Router. | Small team; replaceable with i18next if needed. **ADD in Phase 2.** |
| **next-pwa / Workbox** | PWA shell; offline capture; background sync. | Google-maintained; replaceable with Workbox directly. **ADD in Phase 2.** |
| **MapLibre GL JS** | OSS map client for PostGIS; no vendor lock. | MapTiler/OSSF; replaceable with Leaflet. **ADD in Phase 5.** |
| **Vercel AI SDK** | Streaming, tool-calling, MCP-ready. | Vercel-maintained; replaceable with direct API + LangChain Lite if needed. **ADD in Phase 3.** |
| **Model Context Protocol (`mcp`)** | Standardising AI↔graph bridge. | Anthropic + growing ecosystem. **ADD in Phase 3.** |
| **Resend (email)** | Already wired via Lehakwe; reuse. | Paid tier; replaceable with Postmark. **KEEP.** |
| **Novu (multi-channel notifications):** | **REJECT for now.** Adds a service dependency. Use our existing notifications + a future simple Edge Function to WhatsApp Cloud API. Revisit at ~500 towns. |
| **Liveblocks / Yjs:** | **REJECT for now.** Overkill for ≤1,000 towns. Supabase Realtime is sufficient. Revisit only if collaborative editing becomes a top-tier job. |
| **Event-sourcing / CQRS / partitioned multi-tenant Postgres:** | **REJECT permanently until ≥1,000 towns proven.** |

---

## 9 · What NOT to Build (Now)

- ❌ 10,000-town infra, sharding, multi-region Supabase.
- ❌ Microservices split (coordinator app vs public app vs admin app — it's ONE workspace).
- ❌ A separate graph DB (Neo4j, TigerGraph, etc.) — Postgres + CTEs.
- ❌ Self-hosted LLM inference — API-only.
- ❌ Blockchain, token-gating, or crypto anything.
- ❌ A "citizen app" — citizens use public pages + WhatsApp.
- ❌ Event-sourcing for `community_work` — state machine + `work_approvals` audit is enough.
- ❌ Separate "admin" app — it's a workspace role.
- ❌ Multi-database replication, read-replicas, sharded `community_work`.
- ❌ A 50-lens expert council (we have 8 lenses; that's enough).

---

## 10 · Risks — Technical + Product

### Technical
1. **RLS+GRANT regression risk** — *mitigation:* every migration has paired verification functions; test as `authenticated` role in every deploy.
2. **Realtime connection storms** at scale — *mitigation:* per-town channel cap; use `postgres_changes` filters; fallback to polling on 503.
3. **pg_cron drift** on materialised views — *mitigation:* hourly refresh; alert on `>5min` staleness.
4. **AI hallucination in missions** — *mitigation:* every AI output links back to source `community_work` IDs; never auto-creates records.
5. **Embedding model drift** (gte-small-384) — *mitigation:* pin model version; re-embed only when model upgrades are coordinated.
6. **Migration 9999** legacy cleanup — *mitigation:* run after app references removed; 2-week bake in staging.

### Product
1. **Coordinator burnout** if missions feel like surveillance — *mitigation:* adaptive missions driven by coverage gaps, not quotas; streak rewards are celebratory not punitive.
2. **Low adoption beyond first 10 towns** — *mitigation:* focus on 3 anchor towns first; share wins weekly; embed in existing co-op networks.
3. **POPIA complaints** — *mitigation:* annual consent renewal + simple withdrawal flow; never auto-share data.
4. **Municipal distrust** — *mitigation:* machine-readable audit trail; every record has consent + verifier + timestamp.
5. **Funding cliff after pilot** — *mitigation:* embed readiness + verified data into funder-facing JSON from day 1; become their reporting source.

---

## 11 · 2–3 Year Evolution Path (credible, not fantasy)

- **Year 1 (now → 100 towns):** ship Phases 1–4. Stabilise. Prove the playbook in 3 anchor towns, 10 satellite towns.
- **Year 2 (100 → 500 towns):** ship Phases 5–6. Add province/district tiers. Launch public `ai.md` endpoints per town. Partner with 2–3 municipalities on formal data-sharing MOUs.
- **Year 3 (500 → 1,000 towns):** only NOW consider: read-replicas, advanced partitioning, advanced caching (Upstash/Redis), multi-language AI fine-tuning on SA-community data. **If and only if** the 500-town metrics demand it; otherwise skip.

---

## 12 · What We Ship Next (Cherry-Pick Starting Points)

The build briefs that derive most directly:
1. **Phase 1 foundation brief** — migrations 0013–0016 (postgis + graph + roles + inbox + coverage MVs).
2. **Workspace tabs brief** — Inbox, CRM, AI pill (front-end, no migrations).
3. **AI Chief of Staff brief** — migrations 0017 + 0018 + Vercel AI + MCP.
4. **Trust 2.0 brief** — migration 0019 + soft-delete/v1 audit + impersonation-for-support.
5. **Digital Twin brief** — migration 0020 + MapLibre map + public JSON endpoints.

Each brief inherits the guardrails from Section 0 and the KEEP/REFINE/ADD/REMOVE deltas from Section 5.

---

*End of Community OS Design Spec v1.0. Live system is the source of truth; this spec refines it, never rewrites it.*
