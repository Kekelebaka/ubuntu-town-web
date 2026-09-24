# Northstar Build 001 Manifest

## Objective
Build smallest extraordinary production-shaped Vertical Slice 001 that makes Ubuntu Town feel like an operating system for a South African town.

## Scope
Town context → Town Home → Today → Work interaction → Proof submission/review → Memory/activity projection

## Dependencies
- Existing authentication (Supabase Auth)
- Existing RLS/RBAC
- Existing mission/work implementation (workspace, assignments, review)
- Existing proofs/evidence track
- Existing towns/provinces model

## Implementation Order
01. Town context (baseline from auth + existing town pages)
02. App shell/navigation (mobile-first PWA)
03. Town Home (identity-first UI)
04. Today (operator's immediate surface)
05. Work interaction (accept/start work via existing workspace)
06. Proof submission/review (existing proof surface)
07. Memory/activity projection (trustworthy history surfaces)
08. Mobile/PWA refinement

## Rules Enforcement
- Preserve existing authentication
- Preserve RLS/RBAC
- No ambiguous/colliding migrations
- No new migrations unless absolutely required
- Prefer existing RPC/API contracts
- Keep changes reversible
- Real contracts only, no mock data
- No weakening authorization
- Fail closed when safe operation cannot be proven

## Validation Steps
1. typecheck all changes
2. lint relevant files
3. run relevant tests
4. production build
5. No deployment

## Output Artifact
NORTHSTAR-BUILD-001-REPORT.md