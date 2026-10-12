# DATA SOURCE-OF-TRUTH MATRIX & OBJECT RECONCILIATION

Goal (§3): ONE canonical operational truth; no duplicate people/town/initiative/mission/proof/passport stores.
Vector search may assist retrieval but never become truth.

## 1. Source-of-truth matrix

| Object | Canonical store | Read model / adapter | Duplicate risk | Status |
|---|---|---|---|---|
| Towns | Supabase `uto.towns` (46-table `uto` schema) | `e002/real.ts` (anon, RLS), snapshot | `public.towns` twin (repo-only) | AMBER (twin exists) |
| People / roles | `uto.users/profiles/roles/role_assignments/coordinators` | `0021` town-scoped read | none observed | AMBER |
| Initiatives | `uto.initiatives` catalog + `initiative-engines/` profiles | snapshot `initiative_engines` | profiles are DRAFT, engine=derived | AMBER |
| Work / community_work | `uto.community_work` (+ publish-outbox worker) | `/workspace/work` | none | IMPLEMENTED |
| Proof | `uto.proofs` | `/os/proof`, `0019` policies | base prod DDL undocumented | AMBER |
| Memory | `uto.memories` | 0002 policies | base prod DDL undocumented | AMBER |
| Learning | **NONE** (`uto.learnings` ABSENT) | schemas only | — | **BLOCKED** |
| BMC / BMC Delta | schemas (`bmc-block`, `bmc-delta`) | initiative-engine `bmc_blocks` | no persistence | **BLOCKED** |
| Passport Delta | schema (`passport-delta`) | session05 `passport-deltas.json` | no persistence | **BLOCKED** |
| Town Passport | intelligence repository S03 (per-town artifacts) | `passport-snapshot.json` (sha256-pinned) | snapshot vs repo must stay in sync | VERIFIED |
| Opportunity / Target / Readiness | within town `cells` + `opportunities` | snapshot | none | OBSERVE |
| Metrics | `initiative-engines` 63 metric contracts | engine funnels | none | VERIFIED |
| Geography roster | `blueprint-roster.json` (50/9, PENDING RATIFICATION) | `e003/blueprint-roster.json` | `is_founding` flag ≠ roster (C-05) | AMBER |

## 2. Truth vocabulary in use (§9/§11)

VERIFIED, ACTUAL, MODELLED, HYPOTHESIS, BLUEPRINT_ASSUMPTION, FIELD_TO_VERIFY,
INSUFFICIENT_EVIDENCE, RECORDS_NOT_ACCESSIBLE, ABSENT. Distinguishes ZERO / UNKNOWN /
PROTECTED / RECORDS_NOT_ACCESSIBLE / ABSENT / NOT_YET_MEASURED. Confirmed the snapshot stores
`value: null` + `truth_class: INSUFFICIENT_EVIDENCE` for absent market denominators — it does **not**
coerce missing to zero.

## 3. Market denominator law (§11) — implemented

Each `opportunity.market_layers[]` carries TOTAL_UNIVERSE → RELEVANT_UNIVERSE → ADDRESSABLE_MARKET → …
with per-layer `value`, `truth_class`, `reason`. Empty layers are `null` + INSUFFICIENT_EVIDENCE with a
reason string ("no sourced denominator input in approved sources"), not invented.

## 4. Metric contracts (§12) — 63 present, schema enforced

11 required fields (additionalProperties:false): metric_id, stage (REACH/CONVERSION/DELIVERY/
VERIFICATION/OUTCOME/PROOF), formula, numerator, denominator, unit, window, scope, source, interpretation,
limitation. Distribution: ubuntu-daycare 7, family-house 7, kasibuy 7, other 7 profiles 6 each = 63.

## 5. Non-duplication verdict

No second people/town/initiative/mission/proof/passport DB was created. The intelligence layer is a
**read-only versioned snapshot adapter** (`src/lib/passport/repository.ts`: "NEVER writes and NEVER
fabricates"), with a LIVE/SNAPSHOT/STALE/UNAVAILABLE data-state law and a 90-day freshness budget. This
correctly keeps operational truth in Supabase and derived/intelligence truth in the artifact layer.

**The one genuine gap** is persistence for Learning/BMC/Delta (§14 loop) — currently schemas with no store.
Per §24 this must be implemented **staging-first** (`0024_learnings.sql`), not invented against production.
