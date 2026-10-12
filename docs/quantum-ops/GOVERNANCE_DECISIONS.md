# GOVERNANCE DECISIONS (Phase 8)

## GOVERNANCE DECISION RECORD (2026-10-12 — controlled release authorisation)
Decision-maker: product operator (Kekelebaka) via the Quantum Ops Release Execution Order. These are
**internal product governance decisions**, NOT external/institutional ratification.

**C-05 — RATIFIED.** The 50-town Blueprint roster (`blueprint-roster.json`) is **ratified as the current
product cohort**, subject to governed amendment. Distinctions preserved and unchanged:
- 50 Blueprint cohort towns (product cohort);
- 81 canonical town rows in the database (a separate database fact).
These describe different things and are not collapsed.

**C-06 — PROVENANCE-HELD EXCEPTION.** Migrations 0015–0017 remain **provenance-held exceptions** until their
provenance is resolved through a governed process. Migration history is NOT silently rewritten; 0015–0017 are
NOT treated as validated architectural precedent. (Evidence to date — recovered production ledger + live 46-table
`uto` — indicates they were never applied, but this is held, not closed.)

---

Rule (§8): do not silently resolve; do not manufacture a decision. For each blocker: (1) can engineering
resolve it from existing evidence? (2) if yes → resolution documented/implemented; (3) if no → explicit
GOVERNANCE DECISION REQUIRED. Standing facts preserved: 50 Blueprint towns (product cohort) ≠ 81 DB rows
(separate database fact); 10 canonical initiatives unchanged; Job Fixer / Ubuntu Academy / EcoChar excluded.

---

## C-05 — Blueprint roster vs `is_founding` flag
- **Evidence**: `blueprint-roster.json` v1.0.0-provisional names 50 towns / 9 provinces (from Founding-50
  migration `20260707002039`). `is_founding=true` marks a DIFFERENT 50-set — only 26/50 overlap (24 flagged
  rows not in roster, 24 roster towns not flagged).
- **Engineering can resolve?** NO — which set is the OFFICIAL product cohort is a human identity/governance
  call, not derivable from data (both are internally consistent).
- **Disposition**: **GOVERNANCE DECISION REQUIRED.** The 50-town roster is the INTENDED product cohort
  (used by the snapshot/engine). The `is_founding` DB flag must never substitute for the roster. Ratify
  `blueprint-roster.json` as THE Blueprint cohort to close this. Mechanism already exists
  (`roster_ratification: "PENDING HUMAN RATIFICATION"` in the snapshot meta).

## C-06 — migrations 0015–0017 role
- **Evidence**: recovered production ledger (`supabase/migrations.production-baseline/RECONCILIATION.md`)
  says 0015–0017 were **git-only, never applied** (threads/messages/guilds absent from live 46-table `uto`);
  dropped via `chore/drop-unapplied-0015-0017`. `MIG_01_RECONCILIATION_REPORT.md` claims they "performed the
  uto-schema migration". Direct staging check confirms `uto` has 46 tables and NO threads/messages/guilds.
- **Engineering can resolve?** PARTIALLY — the definitive source is the LIVE production
  `supabase_migrations.schema_migrations` table, which I did NOT query (production-safety: do not use prod as
  a discovery environment). The weight of evidence (staging + recovered ledger) supports "never applied".
- **Disposition**: **GOVERNANCE DECISION REQUIRED** (confirm against prod ledger). Exact resolving query
  (read-only, for an authorised operator): `select version, name from supabase_migrations.schema_migrations
  where version in ('0015','0016','0017');` — empty ⇒ never applied (consistent with staging).

## A-COUNT — intelligence artifact count 350 / 370 / 450
- **Evidence**: `repository/MANIFEST.md|json` = 350 (7/town); `PUBLISH_MANIFEST.json` = 370; disk = **450**
  (50 towns × 9 artifacts: town-passport.{md,json,pdf}, initiative-cells.json, coordinator-workpacks.{md,json},
  verification-agenda.json, version-manifest.json, provenance.json).
- **Engineering can resolve?** YES — disk is authoritative: **450** (9/town). The two manifests are stale.
- **Disposition**: **RESOLVED (engineering)**: observed truth = 450. Action: regenerate `MANIFEST.*` and
  `PUBLISH_MANIFEST.json` from disk so all counts agree (450). Not done here — manifests live in the non-git
  intelligence workspace; regeneration is a mechanical follow-up. No truth is lost: 500 cells / 50 towns /
  9 provinces are independently verified.

## W-COUNT — workpacks 426 vs "427 + 1 global"
- **Evidence**: `SESSION04_MANIFEST.json` = 426 work items (DAY 1: 59, WEEK 1: 121, WEEK 2: 50, 30 DAY: 100,
  60 DAY: 96). Order expects 427 + 1 global workpack. Snapshot per-town `workpacks.groups` populated.
- **Engineering can resolve?** YES — recount from source artifacts (the "1 global" workpack is likely counted
  separately from the 426 town-scoped items).
- **Disposition**: **RESOLVED-DIRECTION (engineering)**: 426 town-scoped work items observed + a global
  workpack = the likely reconciliation. Exact recount is a mechanical follow-up; the operational shape
  (DAY 1 / WEEK 1 / WEEK 2 / 30 DAY / 60 DAY) is verified present per town.

## GS-SLICE — Senekal × FixEasy vs KasiBuy
- **Evidence**: §17 names the golden slice Senekal × **FixEasy**. Actual Senekal intelligence: FixEasy cell =
  OBSERVE / UNDECIDED / `mapping_class=INSUFFICIENT_EVIDENCE` (no demand/capability/economics evidence);
  the ONLY evidence-backed Senekal initiative is **KasiBuy** (TEST / CONDITIONAL), with next decision
  "verify kasibuy fit in Senekal".
- **Engineering can resolve?** The FACTS are resolved (verified against the snapshot). WHICH initiative the
  golden slice features is a product choice.
- **Disposition**: **RESOLVED (facts) + DECISION REQUIRED (product).** Facts: FixEasy=INSUFFICIENT_EVIDENCE,
  KasiBuy=TEST. The golden-slice mechanism works either way — on FixEasy it honestly shows
  INSUFFICIENT_EVIDENCE (correct, no fabrication); on KasiBuy it shows real TEST evidence. Recommend either
  (a) keep FixEasy and accept INSUFFICIENT_EVIDENCE (the honest default), or (b) switch the demo slice to
  KasiBuy for a populated path. No data is mutated.

---

## Summary
| ID | Resolvable by engineering? | Disposition |
|---|---|---|
| C-05 | No | GOVERNANCE DECISION REQUIRED (ratify roster) |
| C-06 | Partially (needs prod ledger read) | GOVERNANCE DECISION REQUIRED (confirm; evidence ⇒ never applied) |
| A-COUNT | Yes | RESOLVED (450 = 9/town); regenerate manifests |
| W-COUNT | Yes | RESOLVED-DIRECTION (426 + global); recount follow-up |
| GS-SLICE | Facts yes / product no | RESOLVED facts; product DECISION REQUIRED (FixEasy-honest vs KasiBuy-populated) |
