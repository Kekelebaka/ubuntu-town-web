# ORIGIN 522 ROOT CAUSE — work.ubuntutown.co.za

Traced 2026-10-12 14:52–17:50 UTC by live probe (dig + curl). No guesswork.

## Symptom
`https://work.ubuntutown.co.za` returns **HTTP/2 522 (Connection timed out)**, `server: cloudflare`,
on EVERY path tested (/, /passport, /workspace, /api/release). 522 = Cloudflare edge accepted the
request (TLS terminated) but could not establish a TCP connection to the origin.

## Trace (DNS → Cloudflare → origin → deployment)

| Check | work.ubuntutown.co.za | www.ubuntutown.co.za | ubuntu-town-web-git.pages.dev |
|---|---|---|---|
| DNS A | 104.21.60.235 / 172.67.202.134 (Cloudflare proxy) | same CF IPs | Cloudflare Pages |
| CNAME | none (flattened A → CF proxy) | none | n/a |
| TLS | ✓ (CF edge) | ✓ | ✓ |
| HTTP | **522 (all paths)** | **200** | **200** |
| server | cloudflare | cloudflare | cloudflare |

- `work`, `apex`, `www` all resolve to the SAME Cloudflare proxy IPs (orange-clouded).
- `ubuntu-town-web-git.pages.dev` → **200** and serves the Next.js app (title "Ubuntu Town — 1 Million
  CVs", `x-nextjs-prerender`, `x-matched-path`). The **app IS deployed and reachable**.
- `www.ubuntutown.co.za` → **200** (serves the same app/landing).
- `work.ubuntutown.co.za` → **522** on all paths.

## Root cause (established)
`work.ubuntutown.co.za` is an orange-clouded (proxied) DNS record whose **origin is not reachable /
not bound to a healthy Cloudflare service**. Because the app is actually served by Cloudflare Pages
(`ubuntu-town-web-git.pages.dev`, confirmed 200) and `www` works, the difference is isolated to the
`work` hostname: it is **NOT connected to the Pages project** (or to any healthy origin). Cloudflare
proxies to an origin that times out → 522.

This is NOT an application bug and NOT a DNS-resolution failure (DNS resolves, TLS terminates at CF).
It is a **missing/incorrect Cloudflare origin binding for the `work` host**. The deploy-web.yml comment
notes the custom-domain cutover was planned for `enter.ubuntutown.co.za` "after Gate 3" — `work.…` may
never have been provisioned against the Pages project.

## Exact fix (production action — approval boundary)
Bind `work.ubuntutown.co.za` as a custom domain to the Cloudflare Pages project `ubuntu-town-web-git`:

- Cloudflare Dashboard → Workers & Pages → `ubuntu-town-web-git` → Custom domains → Add `work.ubuntutown.co.za`
  (Cloudflare will then route the proxied host to the Pages deployment; no separate origin needed), OR
- CLI: `npx wrangler pages domain add work.ubuntutown.co.za --project-name=ubuntu-town-web-git`

Then verify: `curl -sSI https://work.ubuntutown.co.za` → 200; `https://work.ubuntutown.co.za/passport`,
`/workspace` serve; authenticated + unauthenticated routes behave.

**STOP — approval boundary.** Binding the production domain makes the operational surface publicly live
at the target domain = production go-live. This must wait for the Phase 10 release gates (PR #34 merged,
learning persistence + security gates, migration plan approved). NOT executed here. Reversible (unbind
custom domain / Pages rollback).

## Test matrix after fix (to run at go-live)
DNS ✓ / TLS ✓ / HTTP 200 / authenticated route / unauthenticated route / Passport / Pulse / workspace /
mobile (390/768/desktop) / error handling. Do not call the domain production-ready until `work.ubuntutown.co.za`
returns 200 and serves the intended application.

## Deployment truth (unchanged)
The application is deployed to Cloudflare Pages `ubuntu-town-web-git` (verified serving). The target
operational domain `work.ubuntutown.co.za` is **RED (522)** purely due to the missing origin binding above.
