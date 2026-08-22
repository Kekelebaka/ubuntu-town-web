# MEGA BUILD 7 — EVIDENCE LEDGER

Captured: 2026-08-21T18:01:51Z
Operator: Hermes Agent
Mode: EXECUTE → TEST → VERIFY → PROVE → RECORD

## GATE 0 — CHECKPOINT (BEFORE MUTATION)

| Field | Value |
|-------|-------|
| Repository | Kekelebaka/ubuntu-town-web |
| Working branch | mission-6/auth-release-certification |
| LOCAL HEAD | ba17f86bc1b19fbe1649ca54c7ba750f0ec49459 |
| origin/main | 4da4c8bff6536bdadfea007dac6458ca59182a67 |
| Working tree | clean (6 untracked Mission 6 evidence markdown files) |
| Commits vs main | cbe3ee9, ba17f86 (18 files) |
| Rollback git | ba17f86 (working branch) / 4da4c8b (production main) |

Untracked (do not discard):
CTSO-ENABLEMENT-NOTES.md, EVIDENCE-LEDGER.md, MISSION-6-FOLLOWUPS.md,
MISSION-6.1-RELEASE-CANDIDATE.md, PROPOSED-CI-GATES.diff.md,
TYPECHECK-ERROR-REGISTER.md

### GitHub
- Token identity: Kekelebaka (admin/maintain/push on repo)
- main protected: false (GET /protection HTTP 403 — rules not configured)
- Workflows: Deploy Web (active), Deploy Outbox Worker (active)
- Latest Deploy Web: run 32072971857, sha 4da4c8b, success, 2026-08-17T21:48:18Z
- Mission branch NOT on remote (local only)

### Cloudflare Pages
Production project ubuntu-town-web
- domains: ubuntu-town-web.pages.dev, enter.ubuntutown.co.za, johannesburg.ubuntutown.co.za, senekal.ubuntutown.co.za
- latest: 0108a31e-08e4-4724-bdf7-667ce6ce6c85 @ 2026-07-15T20:45:40Z
- production SHA: 20ce55863267b453b12167c1bd4f8817b4b21637 (ad_hoc Git metadata)
- previous known-good: 3720a624 (d90e10f3)

CI/CD project ubuntu-town-web-git
- domains: ubuntu-town-web-git.pages.dev only
- latest: c604a1ba @ 2026-08-17T21:50:16Z sha 4da4c8b

DNS: Zone ubuntutown.co.za active. DNS:Read DENIED (code 10000).
Workers list OK; workers/routes endpoint 7003 (wrong API path).

### Supabase (afiokbhuxfdacbsipoqk / ubuntu-town-os / eu-west-1 / ACTIVE_HEALTHY)
BEFORE snapshot: ~/tmp-mb7/supabase-auth-before.json
- site_url: https://enter.ubuntutown.co.za
- password_min_length: 6
- sessions_timebox: 0
- sessions_inactivity_timeout: 0
- password_hibp_enabled: false
- smtp: smtp.resend.com:465 sender no-reply@ubuntutown.co.za
- MAGIC LINK TEMPLATE DEFECT CONFIRMED:
  `<a href="{{ .Token }}">Sign in</a>`
- recovery uses {{ .ConfirmationURL }} (default, custom=false)
- jwt_exp: 3600; refresh rotation: true

### Resend
Only kekelebaka.com verified (sending enabled). ubuntutown.co.za not registered.

### Rollback checkpoint
GIT_SHA=ba17f86bc1b19fbe1649ca54c7ba750f0ec49459
CF_PROD_DEPLOYMENT=0108a31e-08e4-4724-bdf7-667ce6ce6c85
CF_PROD_SHA=20ce55863267b453b12167c1bd4f8817b4b21637
SUPABASE_AUTH_BACKUP=~/tmp-mb7/supabase-auth-before.json
PRODUCTION_MUTATIONS_AT_GATE0=0

## RESUME — 2026-08-22T11:12Z (this session)

Picked up after @session:default/20260822_115115_43244b was interrupted
mid GitHub/Cloudflare/live probe. No production deploy. No DNS write.

### Local HEAD / tree

| Field | Value |
|-------|-------|
| Branch | mission-6/auth-release-certification (local only) |
| HEAD | ba17f86bc1b19fbe1649ca54c7ba750f0ec49459 |
| origin/main | 4da4c8bff6536bdadfea007dac6458ca59182a67 |
| Dirty | 5 modified + 8 untracked evidence/docs + `/api/release` |

Modified (uncommitted Mega Build 7 code):
- `.github/workflows/deploy-web.yml` — lint/typecheck/test gates + `NEXT_PUBLIC_GIT_*` + `--commit-hash`
- `src/data/user/security.ts` — update password min 4 → 8
- `src/tests/auth-schemas.test.ts` — matching tests
- `src/components/Auth/Password.tsx` — `minLength=8`, autocomplete new-password
- `src/components/Auth/EmailAndPassword.tsx` — signup `minLength=8`

Untracked:
- `src/app/api/release/route.ts`
- `docs/AUTH-RUNBOOK.md`
- Mission 6 / Mega Build 7 markdown ledgers

### Gate 2 — local quality (this resume)

| Check | Result | Confidence |
|-------|--------|------------|
| Tests | 49/49 PASS, exit 0 (`~/tmp-mb7/test-after.txt`) | DIRECT |
| Lint | exit 0, 36 unused-var warnings (`~/tmp-mb7/lint-after.txt`) | DIRECT |
| Typecheck | PASS exit 0, 11:52:48Z–11:56:47Z (`~/tmp-mb7/typecheck-after.txt`) | DIRECT |
| Build | PASS exit 0, 11:52:48Z–12:03:26Z, 186 routes + sitemap, `/api/release` in route table (`~/tmp-mb7/build.txt`) | DIRECT |

Prior Mission 6.1 already proved typecheck+build PASS on ba17f86 before these
uncommitted edits. This resume re-runs them against the dirty tree.

### Gate 3 — GitHub

| Claim | Result | Confidence |
|-------|--------|------------|
| Token identity | Kekelebaka, admin/maintain/push | DIRECT |
| main SHA | 4da4c8bff6536bdadfea007dac6458ca59182a67 | DIRECT |
| main protected | false (GET /protection HTTP 403 PAT scope) | DIRECT |
| Latest Deploy Web | run 32072971857, sha 4da4c8b, success, 2026-08-17T21:48:18Z | DIRECT |
| Mission branch on remote | NO | DIRECT |

### Gate 4 — Cloudflare / live

| Claim | Result | Confidence |
|-------|--------|------------|
| Production project | ubuntu-town-web → enter + johannesburg + senekal + pages.dev | DIRECT |
| Prod latest deploy | 0108a31e @ 2026-07-15T20:45Z sha 20ce5586 (ad_hoc) | DIRECT |
| CI project | ubuntu-town-web-git → pages.dev only, latest c604a1ba sha 4da4c8b @ 2026-08-17 | DIRECT |
| Zone | ubuntutown.co.za c7ce0ac588b913ec80fecd3ba4442bad ACTIVE Free | DIRECT |
| DNS:Read | DENIED code 10000 | DIRECT |
| Apex / www / enter IPs | same CF anycast 104.21.60.235 + 172.67.202.134 | DIRECT |
| Apex | HTTP 301 → https://www.ubuntutown.co.za/ | DIRECT |
| enter / | HTTP 200 Next.js (`x-matched-path: /`, `_next` present, title em-dash) | DIRECT |
| www / | HTTP 200 static marketing HTML, 1423 bytes, NO `_next` | DIRECT |
| enter /login | HTTP 200, `x-matched-path: /login` | DIRECT |
| enter /workspace | HTTP 200, `x-matched-path: /workspace` (layout-enforced, not middleware) | DIRECT |
| /api/release live | 404 HTML on enter + both pages.dev (route not deployed yet) | DIRECT |
| www /api/release | 200 marketing HTML (SPA fallback, not the app) | DIRECT |

WWW and enter are NOT the same application generation. Do not treat www 200
as proof of the canonical app.

### Gate 6 — Supabase auth (MUTATED this programme, reversible)

BEFORE: `~/tmp-mb7/supabase-auth-before.json` and `supabase-auth-before-resume.json`
AFTER: `~/tmp-mb7/supabase-auth-after.json`

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| password_min_length | 6 | 8 | PATCH applied |
| magic template | `href="{{ .Token }}"` | token as text + `token_hash` confirm URL | PATCH applied |
| recovery template | `{{ .ConfirmationURL }}` | `token_hash` + type=recovery | PATCH applied |
| mailer subject | Your sign-in link | Your Ubuntu Town sign-in code | PATCH applied |
| sessions_timebox | 0 | 0 | 402 Pro plan — not changed |
| sessions_inactivity_timeout | 0 | 0 | 402 Pro plan — not changed |
| password_hibp_enabled | false | false | 402 Pro plan — not changed |

Rollback: PATCH templates + password_min_length from before snapshot.

### Resend

| Claim | Result |
|-------|--------|
| kekelebaka.com | verified, sending enabled |
| Create ubuntutown.co.za | 403 already on another team |
| Claim API | 201 pending id ba1b1fb3-3706-4fd1-bd8a-c2b4b16cc56c |
| Required TXT | name=`ubuntutown.co.za` value=`resend-domain-verification=c7f450041609ec9f2d3a428fffcb1feb` |
| Expires | 2026-08-29 10:41:19 UTC |
| DNS write | DONE 2026-08-22T13:37:42Z — claim TXT only |

## HUMAN GATE 1 — Resend claim TXT (2026-08-22T13:37Z)

Authorised: claim TXT only. No MX/SPF/DKIM/DMARC/CNAME/A/AAAA mutation.

### Before

- Zone ubuntutown.co.za c7ce0ac588b913ec80fecd3ba4442bad ACTIVE Free
- 54 records (CNAME 19, MX 13, TXT 14, AAAA 8)
- Snapshot: ~/tmp-mb7/dns-before.json
- Apex TXT already present (untouched):
  - e1919908ce882c0a29cce70c5bffe791 hosted-email-verify=pmsteaav
  - 5c46f78fcce1c24c1615b1104bd0e3dc v=spf1 include:_spf.mx.cloudflare.net ~all
- No existing resend-domain-verification=* TXT
- Existing send.* and resend._domainkey left alone

### Write

POST /zones/{id}/dns_records
TYPE TXT NAME ubuntutown.co.za
CONTENT resend-domain-verification=c7f450041609ec9f2d3a428fffcb1feb
TTL 1 (Auto) proxied=false

### After (DIRECT)

| Field | Value |
|-------|-------|
| Cloudflare record ID | 03b9b0becb8e8447b0f9bdeb44c7b50a |
| hostname | ubuntutown.co.za |
| type | TXT |
| value | resend-domain-verification=c7f450041609ec9f2d3a428fffcb1feb |
| ttl | 1 (Auto) |
| created | 2026-08-22T13:37:42.747051Z |
| zone record count | 54 → 55 |
| apex TXT count | 2 → 3 (SPF + hosted-email-verify unchanged) |
| Public DoH Cloudflare | Status 0, claim TXT present |
| Public DoH Google | Status 0, claim TXT present |
| Resend claim POST /domains/{id}/claim/verify | 200, then GET status=completed |
| Claim id | ba1b1fb3-3706-4fd1-bd8a-c2b4b16cc56c |
| Domain id | 07fdc210-fbf3-4e28-b505-6ac4e688a8a1 |
| Domain sending status | pending (DKIM still pending — NOT in this gate) |
| send MX / send SPF | already existed; now verified (not written this gate) |

Wrong endpoint POST /domains/{id}/verify was hit once (sending-record check).
Correct claim verify is POST /domains/{id}/claim/verify. No extra DNS written.

### Human approvals still required

1. ~~Add the Resend claim TXT~~ DONE. DKIM/SPF sending records remain a later human gate.
2. Merge / push mission-6 branch (still local).
3. Production cutover from ubuntu-town-web (July 15 / 20ce5586) to a proven
   ubuntu-town-web-git build. Do not swap custom domains blindly.
4. Branch protection on main (PAT cannot set/read rules).
5. Supabase Pro if session timeouts / HIBP are required.
6. Explicit GO for production deploy.

### Readiness (honest)

TECHNICALLY_READY = YES (lint/typecheck/49 tests/build all exit 0 on dirty tree)
CONFIG_READY = PARTIAL (templates + pw min live; sessions/HIBP blocked; Resend claim completed, sending still pending)
CI_READY = LOCAL ONLY (workflow patched, not on main)
SECURITY_READY = PARTIAL (open redirect previously certified; email templates now fixed)
RUNTIME_READY = NO (prod still 20ce5586; /api/release 404)
PROVENANCE_READY = NO (prod ≠ main ≠ working branch)
ROLLBACK_READY = YES (git ba17f86 / main 4da4c8b / CF 0108a31e / supabase-auth-before.json)
SAFE_TO_DEPLOY = NO
PRODUCTION_DEPLOYED = NO
PRODUCTION_VERIFIED = NO

## RESUME — 2026-08-22T11:57Z (this session)

Picked up after @session:default/20260822_130111_a1c0de died waiting on
typecheck/build. Those background jobs were gone. Restarted at 11:52Z.
No production deploy. No DNS write. No merge.

### Re-verified live (DIRECT)

| Claim | Result |
|-------|--------|
| Auth GET | password_min_length=8; Token not used as href; token_hash in magic+recovery |
| sessions / HIBP | still 0 / false |
| Resend kekelebaka.com | verified |
| Resend ubuntutown.co.za | id 07fdc210 status not_started |
| Claim | still pending, expires 2026-08-29 10:41:19 UTC |
| Needed after claim | TXT resend._domainkey; MX+TXT on send |
| main | 4da4c8b, protected=false, protection API 403 |
| CF prod | ubuntu-town-web 0108a31e / 20ce5586 |
| CF CI | ubuntu-town-web-git c604a1ba / 4da4c8b |
| enter / | 200 Next.js x-matched-path=/ |
| www / | 200 Vite SPA 1423 bytes, NO _next (NOT the Next app) |
| apex | 301 → https://www.ubuntutown.co.za/ |
| /api/release | 404 on enter + both pages.dev |
| www worker binding | none for www/apex on this zone |
| DNS:Read | still DENIED |
| Test identity | none in env — Gate 10/11 not run |

### WWW correction vs Mission 6.1

Mission 6.1 said www and enter serve the same Next.js app. Live HTML
disproves that. www is a separate Vite/Telegram marketing SPA. Do not
attach www to ubuntu-town-web as a “fix”.

### Documents written this resume

- MEGA-BUILD-7-RELEASE-CANDIDATE.md
- CTSO-ENABLEMENT-NOTES.md (Mega Build 7 addendum)

### Quality re-run

Typecheck + next build restarted 2026-08-22T11:52Z.
Typecheck PASS exit 0 11:56:47Z.
Build PASS exit 0 12:03:26Z (186 routes, sitemap, `/api/release` listed).

## HUMAN GATE 2 — test identity + Gate 10/11 (2026-08-22T14:00Z)

Email: kekelebaka@outlook.com (authorised unused mailbox).
No service_role. No RLS change. No merge. No deploy. No extra DNS.

### Fixture created

| Object | Result |
|--------|--------|
| auth.users | YES uid e6a90103-3383-4033-b8da-e3a9345bba4b @ 2026-08-22T13:58:49Z via GoTrue signup (mailer_autoconfirm). Signup again = 422 already registered. |
| uto.users | UNKNOWN — identity-bridge trigger not readable without SQL/service_role |
| uto.profiles | NOT CREATED — anon INSERT 42501; no authenticated session (password not recoverable without email) |
| uto.coordinators | NOT CREATED — anon INSERT 42501; `uto.grant_coordinator` RPC does not exist |
| role_assignments coordinator/Senekal | NOT CREATED — anon INSERT 42501; self policy is SELECT only |

Identity preserved (not deleted).

### Gate 10

| # | Journey | Result | Evidence |
|---|---------|--------|----------|
| 1 | Email/password login | FAIL | stored fixture pw 400 invalid_credentials; signup session discarded; no password printed |
| 2 | Invalid login | PASS | 400 invalid_credentials, no access_token |
| 3 | Magic-link delivery | FAIL | OTP 500 Error sending magic link email; Resend list unchanged |
| 4 | Magic-link auth | BLOCKED | no email |
| 5 | OTP delivery/auth | FAIL / BLOCKED | same 500 |
| 6 | Password-reset delivery | FAIL | recover 500 Error sending recovery email (ids 01a029ca… / 01a029cc…) |
| 7 | Password-reset completion | BLOCKED | no email |
| 8 | PKCE/callback | PARTIAL | live /auth/callback no-code → 307 /dashboard (prod SHA still old default). Branch code defaults to /workspace. No code exchange executed. |
| 9 | Session persistence | BLOCKED | no session |
| 10 | Logout | BLOCKED | no session |
| 11 | Unauth protected route | PASS (middleware set only) | /dashboard and /private-items 307 → /login. /workspace 200 (client-gated, not middleware). /auth/confirm no token → 307 /auth/auth-code-error |

### Gate 11

All BLOCKED — no coordinator/Senekal assignment and no session.
Anon cannot insert role/coordinator/profile (RLS/GRANT holds). That is a security pass, not an authz journey pass.

### Email / Resend

- Claim: completed. Ownership TXT live.
- Domain sending: failed (DKIM failed). send MX/SPF already verified (pre-existing, not written this gate).
- SMTP sender still no-reply@ubuntutown.co.za. Resend inbox API shows only the 2026-08-20 onboarding@resend.dev SMTP test to this Outlook address. No new messages after signup/reset/OTP.
- Ownership verification ≠ sending readiness.

### Security

No passwords, tokens, OTPs, cookies printed. No RLS weakened. No real-user roles changed. No privilege escalation path opened.

## HUMAN GATE 3 — DKIM controlled replacement (2026-08-22T15:51Z)

Authorised scope: update only Cloudflare TXT record `5026e4f08b2c71f307b07a21d0ebc174` at `resend._domainkey.ubuntutown.co.za` to the current Resend-required DKIM public key.

### Preconditions (DIRECT)

| Check | Result |
|-------|--------|
| Cloudflare record type/name/id | TXT / resend._domainkey.ubuntutown.co.za / expected id |
| Cloudflare selector record count | one intended record at selector |
| Resend DKIM requirement | one TXT record named resend._domainkey |
| Resend-required value unchanged from checkpoint | YES |
| Existing full TXT rollback value | captured privately in `~/tmp-mb7/dkim-rollback-current-value.txt` |

### Mutation (DIRECT)

PUT `/zones/c7ce0ac588b913ec80fecd3ba4442bad/dns_records/5026e4f08b2c71f307b07a21d0ebc174` only.
No MX, SPF, DMARC, claim TXT, CNAME, A, AAAA, routing, Pages, Workers, Supabase, GitHub, merge, or deploy mutation.

### Verification (DIRECT)

| Check | Result |
|-------|--------|
| Cloudflare API readback | PASS — value equals current Resend-required DKIM value |
| Public DNS Cloudflare DoH | PASS — value equals required DKIM value |
| Public DNS Google DoH | PASS — value equals required DKIM value |
| Authoritative Cloudflare NS weston/dina | PASS — value equals required DKIM value |
| Resend POST `/domains/{id}/verify` | accepted id response |
| Resend SPF MX | verified in most polls |
| Resend SPF TXT | verified in most polls |
| Resend DKIM | pending through extended poll 44–63 ending 2026-08-22T15:50:29Z |
| Resend domain status | pending |
| Resend sending capability | enabled, but EMAIL_READY remains NO until Resend DKIM/domain verification completes and real auth email is delivered |

No rollback performed: DNS is correct by Cloudflare API, public DoH, Google DoH, and authoritative Cloudflare nameservers. The remaining blocker is Resend-side pending verification, not malformed DNS evidence.

### Gate A fresh propagation checkpoint (2026-08-22T15:56:47Z)

One fresh authoritative verification after the controlled DKIM replacement:

| Check | Result |
|-------|--------|
| Current Cloudflare DKIM record | matches current Resend-required DKIM value |
| Public DNS — Cloudflare DoH | matches current Resend-required DKIM value |
| Public DNS — Google DoH | matches current Resend-required DKIM value |
| Authoritative Cloudflare NS weston/dina | matches current Resend-required DKIM value |
| Resend SPF MX | verified |
| Resend SPF TXT | verified |
| Resend DKIM | pending |
| Resend domain status | pending |
| Resend sending capability | enabled, but not EMAIL_READY |
| DNS_CONFIGURATION_PROVEN | YES |
| RESEND_VERIFICATION_PENDING | YES |

No DNS mutation performed during this checkpoint. Do not replace DKIM again while DNS values match Resend's current requirement.

### Provider checkpoint (2026-08-22T15:59:46Z)

One fresh Resend domain-status check only. No DNS mutation. No polling loop.

| Check | Result |
|-------|--------|
| Resend domain | ubuntutown.co.za |
| Resend domain status | pending |
| Resend sending capability | enabled, but not EMAIL_READY |
| Resend DKIM | pending |
| Resend SPF MX | verified |
| Resend SPF TXT | verified |
| RESEND_DKIM_DOMAIN_VERIFIED | NO |

Gate B not executed because Resend DKIM/domain remains pending.

### Provider gate cleared + Gate B password recovery (2026-08-22T16:14Z–16:21Z)

Human reported Resend dashboard verified; independently re-queried provider/API and DNS before proceeding.

| Check | Result |
|-------|--------|
| Resend domain status | verified |
| Resend sending capability | enabled |
| Resend receiving capability | disabled |
| Resend DKIM | verified |
| Resend SPF MX | verified |
| Resend SPF TXT | verified |
| Cloudflare API DKIM | matches Resend-required value |
| Cloudflare DoH DKIM | matches Resend-required value |
| Google DoH DKIM | matches Resend-required value |
| send MX/SPF public DNS | matches Resend requirement |
| DOMAIN_AUTHORISED_TO_SEND | YES |

First Supabase recovery attempt after provider verification returned HTTP 500 `Error sending recovery email` with error id `01a02a41-89fa-77eb-ae87-93cf1374b5fb`.

Diagnostic provider send via Resend API from `no-reply@ubuntutown.co.za` to the authorised Outlook mailbox was accepted and delivered (`3d91a574-7f67-4a4c-908c-536b21101101`), proving the Resend domain/API path was functional.

Minimal Supabase SMTP credential realignment was applied via Management API: host/user/port/admin email/sender name preserved, SMTP password updated to the current Resend key. No secret printed, stored in repo, or documented.

After realignment:

| Journey | Result |
|---------|--------|
| Supabase password recovery request | HTTP 200, accepted |
| Resend password-reset message | `c07cc66c-bab4-4896-8695-7779cc379e39` |
| Recipient | kekelebaka@outlook.com |
| Subject | Reset your password |
| Last event | delivered |

EMAIL_READY = YES, but AUTH_RUNTIME_READY remains NO until the human completes password setup and Gate 10 is run.

### Human next

1. Open the delivered password-reset email for `kekelebaka@outlook.com`, set the temporary test password yourself, then reply `PASSWORD SET`. Do not send the password to Hermes.
2. After PASSWORD SET, run Gate 10 live auth certification.
3. Role/coordinator still need a privileged SQL grant, or run this SQL in the dashboard (service role / SQL editor), then tell me:

```
insert into uto.users (id, email)
values ('e6a90103-3383-4033-b8da-e3a9345bba4b', 'kekelebaka@outlook.com')
on conflict (id) do nothing;

insert into uto.profiles (id, display_name, town_id)
values ('e6a90103-3383-4033-b8da-e3a9345bba4b', 'MB7 Test Coordinator', '562a10e9-0803-4d62-b61f-1f2799e83e67')
on conflict (id) do nothing;

insert into uto.coordinators (id, display_name, town_id, status)
values ('e6a90103-3383-4033-b8da-e3a9345bba4b', 'MB7 Test Coordinator', '562a10e9-0803-4d62-b61f-1f2799e83e67', 'active')
on conflict (id) do nothing;

insert into uto.role_assignments (user_id, role_key, town_id)
values ('e6a90103-3383-4033-b8da-e3a9345bba4b', 'coordinator', '562a10e9-0803-4d62-b61f-1f2799e83e67')
on conflict (user_id, role_key, town_id) do nothing;
```

Do not grant admin/ops/national.

## RESUME — recovery handoff release candidate (2026-08-22T18:30:55Z)

### Build / quality result

| Claim | Evidence | Result |
|-------|----------|--------|
| Background full build completed | `npm run build` via proc_9378951a36f9, log `~/tmp-mb7/build-after-recovery-20260822T181711Z.txt` | PASS exit 0 |
| Build included recovery route | build route table | `/auth/recover` listed as dynamic route; `/update-password` and `/api/release` listed |
| Typecheck after recovery changes | `npm run typecheck` | PASS exit 0 |
| Tests after recovery changes | `npm run test` from previous continuation | PASS 52/52 |
| Lint after recovery changes | `npm run lint` from previous continuation | PASS exit 0, existing unused-var warnings |

Relevant build output: compiled successfully in 2.9 min; generated static pages 186/186; next-sitemap completed. Warnings remained: `cacheComponents` unrecognized, edge runtime static-generation warning, metadataBase defaulting to localhost.

### Recovery-flow change now in branch

- Password reset requests now use `/auth/recover` as a non-consuming handoff.
- Supabase recovery template was updated to `{{ .SiteURL }}/auth/recover?token_hash={{ .TokenHash }}&type=recovery&next=/update-password`.
- `/auth/recover` logs receipt, waits for a human tap, then verifies `token_hash` server-side and redirects to `/update-password`.
- `/update-password` now requires confirmation, enforces minimum 8 characters client-side, calls `updatePasswordAction`, and redirects to `/workspace` on success.
- `/auth/confirm` now uses shared same-origin redirect sanitization.

### Diff / safety inspection

- Full patch saved: `~/tmp-mb7/full-diff-before-final-docs.patch` (761 lines before reverting generated sitemap noise).
- Generated `public/sitemap-0.xml` lastmod-only build noise was identified as unrelated and reverted before commit.
- Secret scan over changed and untracked files found no credential material. Hits for `service_role` were documentation text stating that no service-role key was used.

### Remaining invariant status

The production invariant is still **not complete**. Code/build/email config are ready for a fresh production journey, but the real Android password-recovery journey must still be performed after a live deployment: request recovery, receive email, tap link, reach Set New Password, change password, sign in, and enter workspace without admin intervention.

## DEPLOYMENT ATTEMPT + ROLLBACK (2026-08-22T19:15Z)

A direct Cloudflare Pages production deployment was attempted because GitHub push credentials failed but Cloudflare Pages write credentials were available.

| Item | Evidence | Result |
|------|----------|--------|
| Commit prepared | `git rev-parse HEAD` | `69060a67433b2877c8ce398118ed9111ec511824` |
| GitHub push | token-authenticated git push | FAIL: GitHub returned 403 `Permission to Kekelebaka/ubuntu-town-web.git denied to Kekelebaka` |
| Edge build | `npm run build:edge` | PASS exit 0; log `~/tmp-mb7/build-edge-20260822T183733Z.txt`; `/auth/recover`, `/update-password`, `/api/release` in edge routes |
| Direct Pages deployment | Cloudflare Pages API direct upload to project `ubuntu-town-web`, branch `main` | CREATED deployment `9fab7b83-9c25-4a61-984e-ee797e1e09a6`, production, commit hash recorded |
| Production smoke after deploy | `curl https://enter.ubuntutown.co.za/...` | FAIL: `/api/release`, `/auth/recover`, `/update-password`, `/forgot-password` returned HTTP 500 |
| Rollback | Cloudflare Pages rollback API to previous deployment `0108a31e-08e4-4724-bdf7-667ce6ce6c85` | PASS; production restored |
| Post-rollback smoke | `curl https://enter.ubuntutown.co.za/forgot-password` and `/login` | PASS HTTP 200; `/api/release` expected 404 on old deployment |

Conclusion: do **not** issue a fresh production password-recovery email from this session. The recovery-flow deployment is not live. Production has been rolled back to the prior working deployment. The likely deployment-path defect is the Android/Termux manual direct-upload path for next-on-pages `_worker.js` output; Wrangler is unsupported on this Android arm64 host (`workerd` unsupported), and the manual `_worker.js` upload produced runtime 500s. A safe retry should use GitHub Actions/Cloudflare-supported Linux CI or a Linux host running `wrangler pages deploy`/the existing deploy workflow.
