# SURFACE CANONICALIZATION (Phase 7)

PR #34 introduces five parallel route families alongside the real operational app. This document
classifies each so synthetic demo material is never confused with the production operating system (§31/§7).

## Classification

| Surface | Route(s) | Class | Data source | Disposition |
|---|---|---|---|---|
| **Ubuntu Town OS (operational)** | `/workspace/*`, `/town/*`, `/towns`, `/province/*`, `/coordinator`, `/admin`, `/chat`, `/cv` | **CANONICAL / REAL** | Supabase `uto` (live) | Canonical production app. |
| **Passport (intelligence)** | `/passport`, `/passport/province/[slug]`, `/passport/town/[slug]` | **CANONICAL / REAL (read-only)** | versioned `passport-snapshot.json` (sha256-pinned) | Keep — provenance-correct, non-mutating. |
| **Pulse (derived)** | `/pulse` | **CANONICAL / REAL (derived)** | computed over `uto` rows | Keep — scope-enforced derived read. |
| **Experience 002 (real-data read)** | `/real/*` | DEMO / reference | Supabase anon (RLS) | Quarantined (redirect → `/operate`). Retain as reference. |
| **Experience 003 (golden slice)** | `/os/*` | DEMO / reference | snapshot + engines | Quarantined (redirect → `/operate`). Source of the golden-slice validation. |
| **Experience 004/005 (loop/admin)** | `/operate/*` | DEMO / reference | mixed | Preview surfaces. Not production nav. |
| **Experience 001 (synthetic universe)** | `/os` stories/universe | **SYNTHETIC — DO NOT SHIP AS REAL** | `src/lib/experience/universe.ts` (⚠ labeled "SYNTHETIC DEMO DATA — every row invented") | Quarantined. Never production content. |

## Guarantees already in place
- `src/lib/experience/universe.ts` is explicitly banner-labeled `⚠ SYNTHETIC DEMO DATA … Nothing in this
  file is real production data.` (verified in source).
- `next.config.ts` applies `EXPERIENCE_ROOT_REDIRECT` + quarantine redirects (`/os`, `/real` → `/operate`),
  so demo surfaces are not the default entry.
- `/passport` uses the read-only adapter ("NEVER writes and NEVER fabricates"); data-state law
  LIVE/SNAPSHOT/STALE/UNAVAILABLE.

## Residual risk + recommendation (for reviewer before merge)
The five families are not yet collapsed into one nav. Before production merge:
1. Keep `/workspace` (operational) + `/passport` + `/pulse` as the canonical production surface.
2. Exclude `/os`, `/operate`, `/real` from production navigation and the sitemap; retain as
   test/reference material (do not delete historical evidence).
3. Ensure E001 `universe.ts` synthetic rows are unreachable as production content (build-level guard
   recommended). Verified they are labeled + redirected; a build-exclusion is a follow-up.

Not changed here (would alter nav/build + risk the 386 suite): actual nav/sitemap edits are left to the
merge reviewer per the ADR. Classification + existing quarantine are the deliverable of this phase.
