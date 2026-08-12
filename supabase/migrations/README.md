# ⚠️ Do not run `supabase db push` against this directory

**This directory does not currently reproduce production.** It is wrong in *both*
directions, and the fact that it looks complete and ordered is exactly what
makes that dangerous.

| | Count | Meaning |
|---|---|---|
| Migrations applied in production | **38** | `supabase_migrations.schema_migrations` |
| Migrations in this directory | **20** | `0001` … `0020` |
| Applied in production, **absent here** | **22** | see `../migrations.production-baseline/` |
| Present here, **never applied** | **3** | `0015`, `0016`, `0017` |
| Version rows recorded **twice** | **7** | `0008`–`0014`, under two numbering schemes |

## The two specific hazards

**1. `0015`–`0017` have never been applied.** They define `threads`, `messages`
and `guilds`. Those tables **do not exist** in the live 46-table `uto` schema.
Pushing this directory would create three unbuilt subsystems in production.

**2. Twenty-two production migrations are not here.** They sit in
[`../migrations.production-baseline/`](../migrations.production-baseline/),
recovered verbatim from `schema_migrations.statements` and byte-verified. They
include **all ten `kasibuy_*` migrations** — the entire live commerce subsystem,
which holds the only real transactional data in the estate. A fresh environment
built from this directory alone would not contain KasiBuy at all.

Three of them also carry **data, not just schema**
(`founding50_and_town_readiness`, `kasibuy_002_seed`, `kasibuy_006_reseed_baseline`).
Replaying those against a populated database is **not** a no-op.

## What *is* trustworthy here

`0018`, `0019` and `0020` are applied in production **and** represented here, and
each records its verified access delta:

- **0018** — `uto.is_admin()` constrained to national scope; `search_path`
  hardened on three SECURITY DEFINER helpers. Zero access delta.
- **0019** — proof inherits authorization from parent work; `NOT VALID` FK
  validated; state-transition audit added. 15/15 adversarial tests passed.
- **0020** — creation-time tenancy closed on `community_work`. 16/16 passed.

## Correct cutover procedure — not yet performed

Each step below crosses a stop condition and needs an explicit human decision.

1. Diff the three `≈` migrations flagged in the baseline README
   (`identity_bridge`, `hq_dashboard_rpcs`, `community_work_publishing_spine`)
   against their Git counterparts; establish which is authoritative.
2. Rule on `0015`–`0017`: apply them, or delete them as abandoned. Leaving them
   here misrepresents the system.
3. Resolve the duplicate `0008`–`0014` version rows **non-destructively**.
4. Assemble one ordered set in this directory reflecting real production history.
5. **Prove it:** build a fresh environment from Git and diff its catalog against
   production. Reproducibility is only real once that diff is clean.
6. Only then retire `../migrations.production-baseline/` and delete this file.

## Standing rules until step 5 passes

- Never `supabase db push` against production.
- Never reset production.
- Never delete migration history to make tooling look tidy.
- Apply migrations individually and deliberately, with the access delta stated.
