# Reboot Kasi — Ubuntu Town OS redesign (preview branch)

This branch stages the **Ubuntu Town OS reset** for review. Nothing here changes
your existing homepage/app routes — the redesign pages live under
`public/reboot-kasi/` so, once this branch is built + deployed, they are viewable at:

- `/reboot-kasi/index.html`             — public front door (redesign)
- `/reboot-kasi/enter.html`             — coordinator command portal
- `/reboot-kasi/field.html`             — field PWA (page only; manifest/SW/icons in the DB package zip)
- `/reboot-kasi/command-plan.html`, `ci-system.html`, `coordinator-economics.html`, `migration-plan.html`

## What is ALREADY LIVE (deployed to the database)
`supabase/migrations/0001_ubuntu_town_core.sql` + `0002_rls_rbac.sql` are **applied to the
live Supabase project `ubuntu-town-os` in a `uto` schema** (27 tables, RLS on all, 14 enums,
54 policies). Loaded: 33 towns + 46 applicants (canonical) and the coordinator-core in `legacy`.
`etl/` migrates the remaining D1 rows (see `etl/RUNBOOK.md`).

## Preview deploy (safe — a new path, not a cutover)
```bash
npm ci && npm run build           # Next build (public/ is served as-is)
npx wrangler pages deploy .vercel/output/static --project-name ubuntu-town --branch reboot-kasi-preview
```
This publishes a **preview** URL (…pages.dev / branch alias). Your production `main` and the
apex `www.ubuntutown.co.za` are untouched until you choose to merge + promote.

## Going fully live (the real redesign = a build task, needs your approval)
The pages here are high-fidelity **prototypes**. To make the redesign the actual site,
the designs are implemented as Next.js (public) and Vite (`ubuntu-town-field-os`, enter/PWA)
components wired to the `uto` schema, then deployed. That's the next engineering phase —
approve and I'll port it in stages. Per this repo's AGENTS.md, no production deploy happens
without your explicit go.
