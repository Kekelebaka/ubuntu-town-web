# CI — two workflow files that need a human to commit them

**Why this folder exists:** the automation working this repository cannot write to
`.github/workflows/`. The GitHub App it authenticates through does not request
the `workflows` permission, so every attempt returns:

```
403 refusing to allow a GitHub App to create or update workflow
    .github/workflows/deploy-web.yml without `workflows` permission
```

That is a capability limit of the App, not a setting anyone can grant. So the
two workflow files are staged here, verified, ready to copy into place by hand.
Delete this folder once they are.

---

## 1. `.github/workflows/deploy-web.yml` — REPAIR (the deploy has never worked)

Two independent defects, both proven locally:

1. **`working-directory: apps/web`** on three steps. This repo is flat —
   `src/`, `public/`, `supabase/`, `workers/`. There is no `apps/` directory, so
   every run died on the first step. **The web deploy pipeline has never
   succeeded.** `.env.local.uto` lives at the repo root, so the default working
   directory is correct.
2. **`npx @cloudflare/next-on-pages@1.13.12`** while `package.json` installs
   `^1.13.16`. Installing that pin fresh fails `ERESOLVE` against
   `wrangler@4.121.0`'s peer on `@cloudflare/workers-types@^5`. Even with defect
   1 fixed, the build step would still fail. The repo's own installed binary
   was verified to complete in ~8s and emit `_worker.js` containing every
   workspace route.

Replace the file with:

```yaml
name: Deploy Web

on:
  push:
    branches: [main]
    paths-ignore:
      - 'workers/**'
      - '**.md'

concurrency:
  group: web-deploy
  cancel-in-progress: true

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Prepare env
        run: test -f .env.local.uto || { echo "missing .env.local.uto"; exit 1; }

      - name: Configure uto env
        run: cp .env.local.uto .env.local

      - name: Install
        run: npm ci

      - name: Build (next-on-pages)
        run: npm run build:edge

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          packageManager: npm
          command: pages deploy .vercel/output/static --project-name=ubuntu-town-web --branch=main --commit-dirty=true
```

**Before this can deploy, confirm both repository secrets exist:**
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
(account is `c63d3d6d8c17db7487ab40b81d5e29d1`).

---

## 2. `.github/workflows/pr-validate.yml` — NEW (nothing validates a PR today)

Both existing workflows trigger only on `push` to `main`, so **no pull request
has ever been compiled**. Compiling and deploying are currently the same event,
which is why a broken build can only be discovered in production.

```yaml
name: PR Validation

on:
  pull_request:
    branches: [main]
    paths-ignore:
      - '**.md'

concurrency:
  group: pr-validate-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Configure uto env
        run: cp .env.local.uto .env.local

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      # Advisory only. There are known pre-existing type errors (21 on main).
      # Promote this to a hard gate once that backlog is burned down.
      - name: Typecheck (advisory)
        run: npm run typecheck || echo "::warning::typecheck reported pre-existing errors"

      # The real gate: production build AND the Cloudflare edge build.
      # `next build` alone does NOT prove edge compatibility, and every
      # workspace page declares `runtime = 'edge'`.
      - name: Verify build + edge build
        run: npm run verify
```

---

## What this PR *does* deliver without touching workflows

- **`npm run verify`** — `next build` followed by `next-on-pages`. The two checks
  that genuinely pass today and would catch real breakage. Runnable by a human
  right now, and the whole of the workflow above collapses to this one command.
- **`npm run build:edge`** — the Cloudflare build as a first-class script rather
  than a version-pinned `npx` invocation that cannot resolve.
- **`tsconfig.json` → `"ignoreDeprecations": "6.0"`** — previously `npm run
  typecheck` aborted on two `tsconfig` deprecation errors (`target=ES5`,
  `baseUrl`) and never reached the source at all. It now reports real code.

## Known type-error backlog

`npm run typecheck` reports **21 errors on `main`**, all pre-existing and none
introduced by recent work. Concentrated in `src/app/town/[slug]/page.tsx` (node
data shape), `WorkspaceClient` (realtime `presences` typing), `WorkDetailClient`
(a broken `role_assignments` embed that references a non-existent
`coordinator_id` column) and `src/sometest.test.ts` (missing `vitest`). Burn
these down, then flip the advisory typecheck step into a hard gate.
