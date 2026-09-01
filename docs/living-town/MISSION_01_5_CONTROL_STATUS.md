# Mission 01.5 — control gate status

1 September 2026. BUILD 02 — NO-GO. No deployment or database mutation.

## New evidence
- Original local Build 01 commit preserved: 3f319e12b4c93f97c56df19e23d214e7d39d791e.
- Cloudflare management tools absent; plugin-search/connection tools unavailable; no Cloudflare credential environment variables; repository Wrangler whoami reports unauthenticated. No temporary account or guessed project used.
- Connected Supabase inventory exposes ubuntu-town-os production as ACTIVE_HEALTHY; branch listing returns only default main. No isolated staging branch/project identified. Existing unrelated inactive projects are not repurposed.
- Migration ledger still includes mixed numeric/timestamp histories and later worker/core changes. Branch creation may replay migrations, but reliability and seed safety have not been proven. Do not copy production data or blindly run db push.
- Supervised preview starts, but the browser cannot navigate to its approved address. Prior and current browser failures remain an infrastructure/browser gate, not evidence of application correctness.

## Reversible local work completed
- scripts/validate-v2-environment.mjs loads the actual Next environment files, checks only names in error messages, rejects known production backend/domains/resources, production/outbound credentials, secret keys in NEXT_PUBLIC variables, outbound endpoints, missing disabled marker, and mismatch against explicitly approved staging ref/origin.
- Guard runs before normal Next build and Cloudflare edge build. It does not attest an arbitrary configured environment is safe: actual account/branch/binding verification is still mandatory.
- Server V2 route/middleware require explicit staging ref/origin match and disabled outbound marker in staging mode. Fixture mode remains separate and contains no real account data; build guard permits only inert placeholder Supabase credentials in fixture mode.
- .github/workflows/v2-validate.yml performs validation only, with contents:read permission and no secret inputs, deploy or workflow dispatch. Not pushed/run remotely.
- Six environment tests added to existing 60 tests. A direct production-host command-line substitution fails with exit code 1.

## Kill switch is NOT yet infrastructure proof
A marker alone cannot stop database webhooks, cron, third-party integrations or a separately deployed worker. No staging target/backend exists, so no configured kill switch or side-effect test is claimed. Before control deployment: disable/revoke staging outbound integrations, omit all production credentials, do not deploy outbox consumers, inspect cloned cron/vault/webhook state by metadata, and route permitted test events to a local/staging-only sink. Confirm no production delivery through observed test events.

## Control sequence remains mandatory
1. Connect authenticated Cloudflare management and verify enter domain → resource → deployment → SHA → branch → repo, plus branch rules.
2. Provision dedicated pre-production hosting and isolated Supabase, with synthetic-only data and no inherited production integrations.
3. Deploy unchanged baseline 947f78b745f9e4c5cdecaf32e9e1f7442335423f using staging environment; record artifact/environment provenance. Guard tooling must run outside that baseline source checkout so baseline parity is preserved.
4. Execute signed-in role/storage/cache matrices and screenshot checks. No synthetic users have been created in production.
5. Only then deploy original V2 commit or a separately recorded reviewed descendant. Mission 01.5 guard changes are a new local descendant, not an alteration of the immutable Build 01 SHA.

## Rollback
No hosted resource was created, so there is no hosted teardown. Keep commits; stop the supervised preview. Return to the prior V2 commit in another local worktree if needed; do not reset/overwrite remote main. Future staging teardown must name the actual discovered project IDs and revoke only staging credentials; those IDs are not yet available.
