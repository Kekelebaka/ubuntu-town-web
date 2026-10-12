# PRODUCTION DOMAIN CHANGE — work.ubuntutown.co.za

Status: **READY FOR APPROVAL** (prepared, NOT executed). Binding the production domain = public go-live
(production action, approval boundary).

## A. EXACT OPERATION
```bash
npx wrangler pages domain add work.ubuntutown.co.za --project-name=ubuntu-town-web-git
```
Auth: requires `CLOUDFLARE_API_TOKEN` (Pages Edit) + `CLOUDFLARE_ACCOUNT_ID` — available as GitHub Actions
secrets for the deploy runner; NOT present locally (production credentials are not used from this session).

## B. TARGET VERIFICATION (does the command hit the intended project?)
- `--project-name=ubuntu-town-web-git` ⇒ the Cloudflare Pages project that serves `https://ubuntu-town-web-git.pages.dev`
  — **confirmed HTTP 200** serving the Next.js app (`Ubuntu Town — 1 Million CVs`) this session. This is the
  same project `deploy-web.yml` deploys to. ✔ intended target.
- Verify before/after with `npx wrangler pages project list` and `npx wrangler pages domain list --project-name=ubuntu-town-web-git`.
- No OTHER project is referenced; the command is scoped to exactly one project.

## C. DNS IMPLICATIONS
- `work.ubuntutown.co.za` currently: orange-clouded (proxied) A records to Cloudflare (`104.21.60.235`,
  `172.67.202.134`), no healthy origin ⇒ 522. Binding the custom domain makes Cloudflare Pages the origin
  (TLS cert auto-provisioned; `*.pages.dev` proxied).
- Cloudflare will validate domain ownership and provision a certificate; DNS already resolves via Cloudflare
  (same account), so no external DNS change is required. If a conflicting `work` record exists, it must be
  removed/adjusted in the Cloudflare DNS zone for `ubuntutown.co.za`.
- Effect: `https://work.ubuntutown.co.za` starts serving the deployed app (the ORIGIN_522_ROOT_CAUSE fix).

## D. ROLLBACK
- `npx wrangler pages domain remove work.ubuntutown.co.za --project-name=ubuntu-town-web-git` (unbind; reverts to 522),
  OR Cloudflare dashboard → Pages → ubuntu-town-web-git → Custom domains → Remove.
- Independently: Cloudflare Pages rollback to a prior deployment; the DNS record is unchanged by the binding.

## E. NO UNINTENDED DOMAIN AFFECTED
- The command names one domain (`work.ubuntutown.co.za`) and one project (`ubuntu-town-web-git`). It does NOT
  touch `www.ubuntutown.co.za` (already serves, 200), the apex, or `enter.ubuntutown.co.za` (referenced in meta).
- After binding, verify ONLY the intended host changed: `curl -sSI https://work.ubuntutown.co.za` ⇒ expect 200;
  `curl -sSI https://www.ubuntutown.co.za` ⇒ unchanged 200.

## F. POST-BIND EXPECTED RESULT
`https://work.ubuntutown.co.za` → HTTP 200 serving Ubuntu Town OS (target operational domain reachable).

**STOP — do not execute without explicit human approval.**
