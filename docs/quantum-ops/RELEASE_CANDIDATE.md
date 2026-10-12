# RELEASE CANDIDATE — Ubuntu Town OS

Recorded 2026-10-12. Every value re-executed/derived this session. "Local-only" claims are marked; GitHub/CI
is the control plane.

## Identity
- **Commit SHA**: `9837b1001f53a1ab436d906f7b0c2846dfb015b0` (branch HEAD, pushed).
- **Branch**: `convergence/production-ready-2026-10-12` → GitHub ref `utospulse/scope-resolver`.
- **PR**: **#34** — https://github.com/Kekelebaka/ubuntu-town-web/pull/34 — OPEN, MERGEABLE, 17 commits.
- **Prior SHAs**: 9dd2f69 (Passport) → d2959da (truth-map) → e5be239 (CI gate) → 9837b100 (convergence).

## CI result
- PR #34 `validate` (env-separation guard + gitignore check + `npm ci` + lint + typecheck + test + build):
  **PASS** (two check runs, 1m57s). No silent local-only success.
- **Fixed this session**: `npm ci` failed on GitHub Actions (npm 10) due to lock drift from the integration line
  ("Missing: @esbuild/… from lock file") — regenerated `package-lock.json` with npm 10; `npm@10 ci --dry-run` exit 0.
  This also un-breaks **Deploy Web** (same `npm ci`, Node 20), which had not run since 2026-09-24.

## Test result (exact counts)
- **Unit/integration (vitest)**: **400 passed / 400** (20 files) = 386 prior + 14 new `learnings-write` tests.
- **TypeScript (`tsc --noEmit`)**: **exit 0**.
- **Data-layer (staging, `learnings_validation.py`)**: **11/11 PASS** (cross-tenant + immutability + national).
- **Learning loop (`learning_loop_proof.py`)**: PASS (WORK→…→NEXT_DECISION, no fabricated outcomes).

## Build result
- `next build`: **exit 0** (routes /os, /operate, /real, /passport, /pulse, /workspace).

## Hashes (sha256)
- Migration `0024_learnings.sql`: `3837eb98bf5dde4f059ca13391d72db5`.
- Passport snapshot `passport-snapshot.json`: `5e6b9667ea7909554d6b2b968717bd41` (embedded manifest hash `a0b21a78…`).
- Blueprint roster `blueprint-roster.json`: `c252ceccd34489ee8c12fa29c141d538`.
- 50-town hash: carried in snapshot meta (`town_universe_hash` `5e919d4c…`).
- 10-initiative canonical set: `78dad9ee0d7bdf9b542ee0464a621c31` (ai-cafe, family-house, fixeasy, framesouth,
  insidetown, jeff, kasibuy, orbit-music, ubuntu-daycare, ubuntu-socials). Job Fixer / Ubuntu Academy / EcoChar absent.

## Artifact manifest
- Intelligence snapshot: `src/data/intelligence/passport-snapshot.json` (50 towns / 9 provinces / 10
  initiative_engines / 500 cells; artifact_count 350, docs 450 — A-COUNT discrepancy documented).
- Deliverables: `docs/quantum-ops/*` (ENGINEERING_TRUTH_MAP, DATA_SOURCE_OF_TRUTH, MIGRATION_0024_LEARNINGS_PLAN,
  PRODUCTION_MIGRATION_0024, PRODUCTION_DOMAIN_CHANGE, ORIGIN_522_ROOT_CAUSE, SURFACE_CANONICALIZATION,
  GOVERNANCE_DECISIONS, 50_TOWN_10_INITIATIVE_VALIDATION, SECURITY_CROSS_TENANT_VALIDATION,
  ADR_INTEGRATION_DECISION, QUANTUM_OPS_FINAL_CONVERGENCE_REPORT, QUANTUM_OPS_FINAL_REPORT).

## Environment configuration
- **Staging** (`wrangler.work-staging.jsonc`): worker `ubuntu-town-web-staging`, Pages `ubuntu-town-web-staging`,
  Supabase `lgbkfthojyxhwemgkpgo` (staging). Guard-enforced: no prod identifiers. **Fixed this session** (was prod).
- **Production**: deploy-web.yml → Pages `ubuntu-town-web-git` → Supabase `afiokbhuxfdacbsipoqk` (prod).
- Env-separation guard `scripts/guard-env-separation.mjs` in CI.

## Deployment target
- Cloudflare Pages project `ubuntu-town-web-git` (serves `ubuntu-town-web-git.pages.dev`, HTTP 200).
- Target operational domain `work.ubuntutown.co.za` — **522, pending custom-domain binding** (PRODUCTION_DOMAIN_CHANGE.md).

## Readiness
- Production readiness: **RED (narrowly)** — only the domain binding, merge/deploy, and gated migration remain,
  plus governance ratifications (C-05/C-06). See QUANTUM_OPS_FINAL_CONVERGENCE_REPORT.md.
