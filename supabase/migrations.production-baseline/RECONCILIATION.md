# Migration Reconciliation — Production Baseline

**Status:** salvage complete, cutover NOT performed. No production mutation occurred producing this directory.

## Why this directory exists

The Ubuntu Town estate has **bidirectional** migration drift. Git and production disagree in *both* directions, which means neither one alone can rebuild the system:

- **21 migrations were applied to production and never committed to Git.** That includes all ten `kasibuy_*` migrations — the entire KasiBuy commerce subsystem, which holds the only real transactional data in the estate. Until now, that subsystem existed **only** inside the live database. If the project were lost, so was it.
- **3 migrations exist in Git and were never applied to production:** `0015_org_structure`, `0016_threads_messages`, `0017_initiatives_guilds`. The tables they define (`threads`, `messages`, `guilds`) do **not** exist in the live 46-table `uto` schema.
- **Versions `0008`–`0014` are recorded twice** in `supabase_migrations.schema_migrations`, under two different numbering schemes (bare `0008` and timestamped `20260715174714`).

**Consequence: `supabase db push` against this repository is unsafe.** It would attempt to apply three unbuilt subsystems while still failing to reproduce the commerce layer.

## What was recovered, and how

Supabase records the exact SQL of every applied migration in `supabase_migrations.schema_migrations.statements`. That column was intact for all 38 production rows, so **production reconstructed its own history** — nothing here was inferred, guessed or rewritten.

Each file was extracted individually and **verified by byte count** against `length(array_to_string(statements, ';'))` as reported by the database. 22 files, 88,874 bytes. All verified; deltas of 2–11 bytes on four files are trailing-newline artefacts of file writing, all under 0.15%.

Files are **verbatim**. They were deliberately not reformatted, commented, wrapped in transactions, or corrected — including where the original SQL is imperfect. This is an archival reconstruction, not a code review. Improvements belong in later, separate migrations.

## The 38-row production ledger

| Version | Name | In Git? |
|---|---|---|
| 001 | initial | **NO — recovered here** |
| 002 | add_display_name_to_coordinators | **NO — recovered here** |
| 003 | alter_coordinators_display_name_not_null | **NO — recovered here** |
| 0008–0014 | realtime_activity → announcements | yes (`0008`–`0014`) — *also duplicated in production* |
| 20260705201339 | phase0_proofs_storage_bucket | **NO — recovered here** |
| 20260705201356 | phase0_expose_uto_schema | **NO — recovered here** |
| 20260707002039 | founding50_and_town_readiness | **NO — recovered here** |
| 20260707021530 | create_town_profiles | **NO — recovered here** |
| 20260713002502 | community_work_publishing_spine | ≈ `0003` (25,232 vs 25,353 bytes) |
| 20260713002511 | identity_bridge_auth_to_uto | ≈ `0004` (1,831 vs 4,507 bytes — **differs, verify**) |
| 20260713003100 | fix_work_status_transitions | **NO — recovered here** |
| 20260713034929 | hq_dashboard_rpcs | ≈ `0005` (4,773 vs 7,467 bytes — **differs, verify**) |
| 20260715174714–203037 | re-application of 0008–0014 | yes — *these are the duplicates* |
| 20260728142804 | add_town_context_columns | **NO — recovered here** |
| 20260728174400 | create_initiatives_catalog | **NO — recovered here** |
| 20260729213858 | fix_anon_grants_apply_form | **NO — recovered here** |
| 20260729214508 | grant_anon_select_coordinators | **NO — recovered here** |
| 20260807112703–150551 | kasibuy_001 … kasibuy_009 (10 files) | **NO — all recovered here** |
| — | `0015_org_structure` | Git only — **never applied** |
| — | `0016_threads_messages` | Git only — **never applied** |
| — | `0017_initiatives_guilds` | Git only — **never applied** |

## What the recovered migrations tell us

- **`001_initial`** is the v1 `public.*` foundation: `provinces`, `users`, `profiles`, `towns`, `businesses`, `coordinators`, `opportunities` and more, seeding all 9 South African provinces. It confirms the `public.*` layer is a genuine earlier generation, not a stray artefact — which matters for the canonicalisation decision.
- **`founding50_and_town_readiness`** is a heavy **data seed**: ~50 founding towns across 9 provinces plus a `town_readiness` onboarding checklist row each. This is real operational data expressed as a migration — treat with care on any replay.
- **`fix_work_status_transitions`** repairs the `community_work` status machine (`'unpublished'` was referenced as a status when it is only a `work_action` label) and defines the authoritative transition matrix: `draft → submitted/archived`, `submitted → in_review/approved/rejected/draft/archived`, `approved` auto-advances to `published`, `published → archived` only, `archived → draft` only. **This is the workflow spine's real contract** and is required reading before the first vertical slice.
- **`kasibuy_007_lock_admin_grants`** shows the developer already ran an anon-reachability lockdown across the admin RPCs — confirming `kb_admin_sso` was an omission from an in-progress security pass, not an unknown risk.

## Proposed cutover — requires human approval

Not performed here. Each step crosses a stop condition.

1. Verify the three `≈` rows above by diffing recovered SQL against the Git file; establish which is authoritative.
2. Decide `0015`–`0017`: apply them, or delete them as abandoned. They currently misrepresent the system.
3. Resolve the `0008`–`0014` duplicate version rows **non-destructively**.
4. Assemble a single ordered `supabase/migrations/` set reflecting real production history.
5. **Prove it:** build a fresh environment from Git and diff its catalog against production. Reproducibility is only real once that diff is clean.
6. Only then consider this directory retired.

## Rules that still apply

- Never run `supabase db push` against production until step 5 passes.
- Never reset production.
- Never delete migration history to make tooling look tidy.
- `founding50_and_town_readiness` and `kasibuy_002_seed` / `kasibuy_006_reseed_baseline` contain **data**, not just schema. Replaying them on a populated database is not a no-op.
