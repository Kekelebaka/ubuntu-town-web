# 50 TOWN × 10 INITIATIVE VALIDATION

Recomputed from primary source `src/data/intelligence/passport-snapshot.json` (and cross-checked
against `ut-os-town-intelligence/repository/towns/*/initiative-cells.json`) on 2026-10-12.
Counts here are **re-derived**, not assumed (§34).

## Matrix

- Towns: **50** (9 provinces: EC 5, FS 8, GP 8, KZN 7, LP 5, MP 5, NW 4, NC 4, WC 4)
- Canonical initiatives: **10**
- Cells: **500** (50 × 10 = 500) — VERIFIED, 50 cells per initiative exactly.

## Stance distribution (the §34 recompute)

| Stance | Count | Expected | Match |
|---|---|---|---|
| OBSERVE | 493 | 493 | YES |
| TEST | 7 | 7 | YES |
| BUILD | 0 | 0 | YES |
| SCALE | 0 | 0 | YES |

The numbers **did not change** after integration — the snapshot and the S03 repository agree.

## The 7 non-OBSERVE cells (all TEST / fit=CONDITIONAL / deployment=UNDECIDED)

| Town | Initiative |
|---|---|
| Senekal | kasibuy |
| Harrismith | kasibuy |
| Ladybrand | kasibuy |
| Rustenburg | kasibuy |
| Soweto | kasibuy |
| Soweto | framesouth |
| Soweto | orbit-music |

Interpretation: the only initiative with real field-pack traction is **KasiBuy** (5 towns). All other
493 cells are `mapping_class=INSUFFICIENT_EVIDENCE` with `evidence_refs=[]` — correctly empty, not
fabricated. Readiness=UNASSESSED and deployment=UNDECIDED across all 500 cells (no readiness model
has been run against evidence yet).

## Canonical ten — verified present

ubuntu-daycare, family-house, framesouth, kasibuy, insidetown, orbit-music, fixeasy, ai-cafe,
ubuntu-socials, jeff. Each = 50 cells. Each initiative-engine profile has `status: DRAFT`.

## Removed initiatives — verified absent from canonical set

Job Fixer / Ubuntu Academy / EcoChar: **0 profiles, 0 cells**. They appear only as removal/decision
records (DECISION_REGISTER, PORTFOLIO_DECISION_IMPLEMENTATION, CANONICAL_INITIATIVE_REGISTRY "DB-ONLY,
not in canonical ten", session05 portfolio-lock). One raw evidence scrape
(`evidence/_town-johannesburg-text.txt`) still contains "Ubuntu Academy" as captured live-site text —
that is uncleaned source evidence, not a canonical entry.

## Golden slice (§17) — Senekal

Senekal × **FixEasy** = `stance=OBSERVE`, `fit_verdict=UNDECIDED`, `mapping_class=INSUFFICIENT_EVIDENCE`,
`evidence_refs=[]`, explicit `unknowns` with `verification_ref=va-senekal-initiatives`. Market layers
(TOTAL/RELEVANT/ADDRESSABLE UNIVERSE) all `value=null`, `truth_class=INSUFFICIENT_EVIDENCE` — **null,
not zero** (§11/§28 honored). The slice runs end-to-end and shows the correct truth state at each stage
rather than manufacturing content.

**Reconciliation note (GS-SLICE):** §17 names FixEasy as the golden-slice initiative, but Senekal's only
evidence-backed initiative is **KasiBuy** (TEST cell) with an Agriculture-Green-Economy opportunity
(`FIELD_TO_VERIFY`) and a next decision "verify kasibuy fit in Senekal". The order's narrative slice and
the real evidence disagree. This is surfaced, not silently swapped. Recommended: run the golden slice on
**Senekal × KasiBuy** (evidence present) OR keep FixEasy and accept honest INSUFFICIENT_EVIDENCE.

## Workpacks

- `trajectory.workpacks` per town populated (e.g. Senekal: `wp_agri_supplier_scan`, proof_required, source=FIELD_PACK).
- `workpacks.groups` per town uses DAY 1 / WEEK 1 / WEEK 2 / 30 DAY / 60 DAY (§35 structure) — e.g. Senekal
  has DAY 1 (2), WEEK 1 (4), WEEK 2 (1), 30 DAY (2), 60 DAY (…).
- SESSION04_MANIFEST reports **426 work items** (DAY 1: 59, WEEK 1: 121, WEEK 2: 50, 30 DAY: 100, 60 DAY: 96),
  not the "427 + 1 global" the order expects. Discrepancy recorded as W-COUNT; 426 is the observed value.

## Verdict

50 × 10 = 500 matrix, canonical initiatives, removed-initiative absence, and the stance distribution are
**VERIFIED against source artifacts**. The matrix is internally consistent between the app snapshot and the
intelligence repository. Ratification of the roster (C-05) and the artifact-count discrepancy (A-COUNT)
remain open governance items.
