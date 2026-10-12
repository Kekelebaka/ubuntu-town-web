# ENGINEERING TRUTH MAP — Ubuntu Town OS

Status: VERIFIED against on-disk state and live probes on 2026-10-12 (SAST).
Method: filesystem inventory, git topology, real test/build execution, DNS/HTTP probes.
Vocabulary per §28: VERIFIED / IMPLEMENTED / TESTED / DEPLOYED / OBSERVED / INFERRED / PROPOSED / BLOCKED / UNKNOWN / INSUFFICIENT_EVIDENCE.

Every "State" below was re-derived from primary evidence in this session, not copied from
prior commit messages or reports.

---

## 1. LAYER TABLE

| Layer | Actual location | Source of truth | Current state | Commit | Deployment | Status |
|---|---|---|---|---|---|---|
| Product / Ubuntu Town OS | `ut-os-wave1/ubuntu-town-web` (Next.js App Router) | this repo | 5 parallel experience surfaces + real `/workspace` app | branch `utospulse/scope-resolver` @ 9dd2f69 | none serving | AMBER |
| Operational data | Supabase project `afiokbhuxfdacbsipoqk` (prod), `lgbkfthojyxhwemgkpgo` (staging) | `uto` schema (prod operational home) | 46-table `uto` live schema; `public.*` twins are repo-only | migration ledger (see MIG_01) | prod exists | AMBER |
| Engineering / GitHub | `github.com/Kekelebaka/ubuntu-town-web` | GitHub | main@d2c4967 (GitHub) vs main@c177492 (local) drift; `utospulse/*` line unpushed | see §3 | n/a | RED |
| Intelligence | `ut-os-town-intelligence/` (non-git) | repository/S03 artifacts | S01+S02+S03 present; 50 towns, 500 cells, 63 metric contracts | n/a (no git) | AWS mirror referenced, publish NOT executed | AMBER |
| Object/artifact storage | AWS/R2 (referenced) | version-manifest per town | referenced in manifests; no live publish evidence | n/a | NOT EXECUTED | INSUFFICIENT_EVIDENCE |
| Edge | Cloudflare Pages (`ubuntu-town-web-git`) + Workers | wrangler*.toml/jsonc | deploy-web.yml targets Pages on push:main | c177492 (local) | domain 522 (see §4) | RED |
| Derived intelligence / Pulse | `src/lib/pulse/*` (scope-resolver) | derived over `uto` rows | engine + scope-resolver + reducers, read-only | 9dd2f69 | none | IMPLEMENTED |
| Application adapter / Passport | `src/lib/passport/*` + `src/data/intelligence/passport-snapshot.json` | versioned snapshot (sha256-pinned) | read-only adapter, data-state law, no fabrication | 9dd2f69 | none | IMPLEMENTED |
| Town Passport | `src/app/passport/*` (national/province/town) | snapshot | 15 mandated surfaces, provenance+truth class | 9dd2f69 | none | TESTED (386/386) |
| Learning / BMC / Delta | `schemas/` (bmc-block, bmc-delta, learning, passport-delta) | schemas only | **no persistence** (`uto.learnings` ABSENT) | n/a | n/a | BLOCKED |
| Authentication | Supabase auth (email OTP), `integ/auth-consolidated` | Supabase | implemented on auth branches | various | not on main | AMBER |
| Authorization / role-scope | `src/lib/e003/scope.ts`, `admin-rbac.ts`, `route-guard.ts`, RLS | scope lenses + RLS | fail-closed route guard; role/scope isolation tests pass | 9dd2f69 | n/a | TESTED |
| Testing | vitest (`src/tests/*.test.ts`, 19 files) | this repo | 386/386 PASS, tsc clean, next build PASS | 9dd2f69 | CI runs on push:main | VERIFIED |
| Deployment envs | CF Pages prod + staging workflows | deploy-web.yml / deploy-build02-staging.yml | prod=ubuntu-town-web-git; staging=ubuntu-town-workspace-v2-staging | n/a | see §4 | RED |

---

## 2. TEST / BUILD TRUTH (executed this session)

| Check | Command | Result |
|---|---|---|
| Unit/integration tests | `npx vitest run` | **386 passed / 386** (19 files) — VERIFIED |
| TypeScript | `npx tsc --noEmit` | **exit 0, clean** — VERIFIED |
| Production build | `npx next build` | **exit 0, PASS** — VERIFIED |

These reproduce §18's claims exactly. The Passport integration commit's self-report ("386/386
vitest + tsc clean + production build PASS") is therefore **corroborated by independent execution**.

---

## 3. GIT / GITHUB TOPOLOGY (the central engineering gap)

Chain: working clones → local bare `quantum-ops/repos/ubuntu-town-web.git` → GitHub `Kekelebaka/ubuntu-town-web`.

- `main` in the bare + both clones = **c177492** ("fix(routing): reserve app platform subdomain").
- GitHub `main` = **d2c4967**. So **c177492 exists ONLY locally, never pushed** (local main is 1 ahead of GitHub).
- `utospulse/scope-resolver` = **9dd2f69**, a **strict descendant of main (13 ahead, 0 behind)** — a clean
  fast-forward. It carries: route-guard security (d05e7b1), Pulse engine (5056906/74150bf/76fde99),
  Experience 001–005 (5ecaf87…4d983c0), TOTAL BINARY (94c0ce1), Passport integration (9dd2f69).
- **No `utospulse/*` refs exist on GitHub.** The entire Passport + Pulse + Experience + TotalBinary line is
  **local-only** — this is the single largest gap between "local completion" and "engineering control".
- 9 CI workflows exist (identical on both branches). `deploy-web.yml` runs lint + typecheck + `npm run test`
  + `npm run build:edge` and deploys to CF Pages `ubuntu-town-web-git` **on every push to `main`**.

Implication: pushing `main` = a production deploy via CI. Integration must therefore proceed through a
**branch + PR**, and the merge/deploy to `main` is an **approval-boundary action**, not an automatic step.

---

## 4. DEPLOYMENT TRUTH (live probe 2026-10-12 14:52 UTC)

- `work.ubuntutown.co.za` → DNS resolves to Cloudflare (172.67.202.134 / 104.21.60.235; TLS at edge ✓).
- HTTP `https://work.ubuntutown.co.za` → **HTTP/2 522 (Connection timed out)**, `server: cloudflare`.
- `https://ubuntutown.co.za` → **301 → https://www.ubuntutown.co.za/**.

Conclusion: DNS + Cloudflare TLS exist, but the **origin is not serving**. Per §8 this is NOT production-ready.
DEPLOYED state for the target operational domain = **RED (origin 522)**. Do not infer readiness from DNS.

---

## 5. NON-GIT INTELLIGENCE ESTATE (from verified inventory)

- `ut-os-town-intelligence/`: S01 constitutions `00`–`17` + 11 schemas; S02 initiative-engines (10 profiles +
  **63 metric contracts**, 11-field schema, all profiles status DRAFT); S03 repository = **50 town dirs
  (9 artifacts each = 450 files)**, **500 cells (493 OBSERVE / 7 TEST / 0 BUILD / 0 SCALE)**, 9 province rollups.
- `ut-os-mission-zero/`: MISSION_ZERO reports, `BLUEPRINT_ROSTER.json` (50/9, v1.0.0-provisional,
  **PENDING HUMAN RATIFICATION**, contradiction C-05), EXPERIENCE_003 UX specs, 4 learning/BMC/delta schemas.
- **Not a git repository** — intelligence artifacts are unversioned on disk (no commit SHA provenance). See §6.

---

## 6. VERIFIED CONTRADICTIONS / GAPS (not silently resolved)

| ID | Finding | Evidence | Disposition |
|---|---|---|---|
| C-05 | `is_founding=true` marks a DIFFERENT 50-set than the 50 named roster towns (26/50 overlap) | blueprint-roster provenance | PRESERVED, UNRESOLVED; roster PENDING RATIFICATION |
| C-06 | Two MIG-01 docs disagree on whether 0015–0017 "performed the uto-schema migration" | MIG_01_RECONCILIATION_REPORT vs recovered production ledger | PRESERVED, UNRESOLVED |
| A-COUNT | Intelligence artifact count has 3 conflicting values: MANIFEST=350 (7/town), PUBLISH_MANIFEST=370, disk=450 (9/town) | repository/MANIFEST*, PUBLISH_MANIFEST.json, find | UNRESOLVED; disk=450 is the observed truth |
| W-COUNT | Workpacks: order expects 427+1 global; SESSION04_MANIFEST reports 426 work items | SESSION04_MANIFEST.json | UNRESOLVED (426 observed) |
| GS-SLICE | §17 golden slice = Senekal × **FixEasy**; actual Senekal intelligence points to **kasibuy** (TEST cell), FixEasy = OBSERVE/INSUFFICIENT_EVIDENCE | passport-snapshot senekal cells | SURFACED; golden slice renders honest INSUFFICIENT_EVIDENCE |
| DELIV | "Deliverables A–O" matches nothing on disk (closest: PHASE_0_PACKAGE A–J, EXPERIENCE_003 §53 1–20) | mission-zero inventory | INSUFFICIENT_EVIDENCE for "A–O" |
| STAGE-PROD | `wrangler.work-staging.jsonc` targets **production** Supabase `afiokbhuxfdacbsipoqk` (E005 header copy-paste) | wrangler.work-staging.jsonc | SECURITY/CONFIG finding — see SECURITY doc |
| LEARN-DB | `uto.learnings` does not exist; learning/BMC/delta have **schemas but no persistence** | migration scan (0 hits) | BLOCKED (persistence not implemented) |
| TOWN-UPD | No UPDATE policy on `towns` table in ledger (only `town_update_signals` + `admin_all`) | 0002_rls_rbac.sql | UNVERIFIED — MIG-01 step 6 PENDING |
| INTEL-GIT | Intelligence estate (S01–S03) is not under git → no commit-SHA provenance for intelligence artifacts | filesystem (no .git) | GAP — versioning claim not backed by VCS |
