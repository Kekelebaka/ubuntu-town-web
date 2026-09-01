# Cloudflare deployment lineage — OPEN

Status at 1 September 2026: V2 exists locally only. No remote push, deployment or production mutation is authorised by passing the local tests. This gate is separate from continued safe development.

Verified source: Kekelebaka/ubuntu-town-web, baseline main 947f78b745f9e4c5cdecaf32e9e1f7442335423f. Active workflow uses Node 20, npm ci, lint, typecheck, tests, next-on-pages, .vercel/output/static, explicit destination ubuntu-town-web-git and --branch=main. Root wrangler.toml instead names ubuntu-town-web.

Historical deployment: GitHub Actions run 32933238076 successfully uploaded baseline main on 26 August to https://a7f6827c.ubuntu-town-web-git.pages.dev. This is a historical source/log fact, not a current domain assertion. main protection is disabled and rulesets are empty in the read-only API result.

Unknown: owning Cloudflare project for enter.ubuntutown.co.za, current deployment ID and SHA, domain/Worker routing, native Git branch filters, preview deployments, runtime bindings and separate staging database. No Cloudflare management tools were exposed in this session.

## Blocking actions
No main push/merge, release promotion, DNS, secrets, schema or domain changes. Do not run the existing deploy-web workflow: manual dispatch from V2 would otherwise force a main deployment. The V2 branch copy now has a false job gate. Main's workflow remains unchanged. Root Wrangler defaults are not a staging configuration.

Do not push the V2 branch until Cloudflare native Git settings are known. A GitHub YAML branch filter cannot prevent Cloudflare from independently deploying a pushed branch. Do not use another hosting service to bypass the required unchanged-control-build sequence.

## Required management access and exact next actions
1. Obtain authenticated read access to Cloudflare Pages projects, source/build/branch settings, deployments, domains, zone DNS and Worker routes/custom domains. Inspect both ubuntu-town-web and ubuntu-town-web-git.
2. Record domain → owner project/Worker → canonical deployment → branch/SHA/source → GitHub workflow/build, each VERIFIED / INFERRED / UNKNOWN, with timestamp. Determine any direct upload automations beyond GitHub.
3. Establish a separate direct-upload pre-production project using scoped Pages write access. No production custom domain, no native Git auto-deploy or production promotion. Record actual project identifier; do not assume a name.
4. Reconcile Supabase migration history into an isolated staging project/branch. Use synthetic accounts, no production PII. Confirm staging Auth callback origin. Disable production publishing, outbound messaging/payment and production revalidation. Use a test outbox sink. Do not copy committed production environment into staging.
5. Check out the exact baseline in a separate worktree and build unchanged application source, with staging-only environment. Verify baseline source parity and record the environment differences. Build has scripts that can enrich public files; record generated-file diff and use a reproducible control artifact.
6. Deploy baseline control only. Verify application, sign-in, Town, People, Work, evidence/review as applicable, connectivity, denied cross-town and role access, ordinary 360px mobile, sign-out/shared device behaviour. Capture evidence.
7. Only after control acceptance, publish V2 artifact to the isolated target, never production. Test real signed-in Today and record runtime evidence.

## Local review modes
No environment keys are committed for V2. Existing production environment files are untouched.

Set LIVING_TOWN_ENABLED=true and LIVING_TOWN_MODE=fixture for labelled synthetic UI review without database reads. Fixture scenario query supports empty, error and permission cases; normal has one example mission/signal, no real people.

Set LIVING_TOWN_MODE=staging only with separately verified isolated Supabase URL and publishable key. Existing cookie client and server getUser are reused. The environment guard rejects the known production Supabase host and is closed by default. It is not proof that any other host is staging; independent environment verification is mandatory. No service-role key is needed.

For checkouts: npm ci; npm run typecheck; npm test; npm run lint; npm run build:edge. Prebuild enrichment skipped in this session because only placeholder credentials were used. Preserve lockfile; the Vercel build installer can rewrite optional dependency metadata, which is not part of the V2 change.

V2 path: /living-town; details: /living-town/mission?id=... and /living-town/work?id=.... Existing /workspace pages are unchanged. V2 is read-only. Generic shell navigation links to Today sections, not five completed feature applications.

Service worker: no registration when initially opened at /living-town; new worker source bypasses V2 requests. Already installed older workers are not proven safe. Use a clean isolated origin and test shared-device logout. V2 middleware adds private no-store and noindex headers; pages also request noindex.

## Rollback
Local only: retain the V2 commit and switch back to main; production requires no rollback because it was never changed. A later staging rollback disables only its target and keeps audit/test receipts. Never restore by deleting users, proof or production data.
