# Publishing Spine — Runbook

## What This Does
Adds the community work publishing spine to Ubuntu Town OS. One loop:
steward does work → approved → publishes everywhere on one source of truth.

## How to Apply

### Prerequisites
- Supabase Pro project `afiokbhuxfdacbsipoqk` (or local shadow DB)
- Service-role key for migrations
- Node 20+, npm

### Step 1: Apply Migrations (in order)
```bash
# Via Supabase SQL Editor (safe for production — all additive, no drops)
# Copy and run each file in order:
# 1. supabase/migrations/0001_ubuntu_town_core.sql  (skip if already applied)
# 2. supabase/migrations/0002_rls_rbac.sql          (skip if already applied)
# 3. supabase/migrations/0003_community_work_publishing.sql
# 4. supabase/migrations/0004_identity_bridge.sql
```

> NOTE: on the live `ubuntu-town-os` project, 0003 and 0004 have ALREADY been
> applied and smoke-tested. Do not re-run them there — this sequence is for
> fresh environments (local shadow DB, staging, disaster recovery) or review.

### Step 2: Verify Identity Bridge
```sql
-- In Supabase SQL Editor, run the verification query from the end of
-- 0004_identity_bridge.sql:
select
  (select count(*) from auth.users)                                   as auth_users,
  (select count(*) from uto.users)                                    as uto_users,
  (select count(*) from uto.role_assignments where role_key='coordinator') as coord_grants;
-- Expect: uto_users >= auth_users, coord_grants >= 1
```

### Step 3: Grant Coordinator for Testing
```sql
-- Replace <email> with the real coordinator's auth email.
insert into uto.role_assignments (user_id, role_key, town_id)
select u.id, 'coordinator', t.id
from auth.users u
join uto.towns t on t.slug = 'bushbuckridge'
where u.email = '<email>'
on conflict do nothing;
```

### Step 4: Switch App to uto Schema
```bash
# Copy uto env file
cp .env.local.uto .env.local

# Regenerate types (requires supabase CLI connected to project)
npx supabase gen types typescript --project-id afiokbhuxfdacbsipoqk --schema uto > src/lib/database.types.ts

# Rebuild
npm run build
```

### Step 5: Test the Loop
```sql
-- As coordinator (set JWT claims first):
-- INSERT a FixEasy worker
INSERT INTO uto.community_work (type, town_id, title, visibility, status)
SELECT 'fixeasy_worker', id, 'Thabo Mokoena — Plumber', 'public', 'submitted'
FROM uto.towns WHERE slug = 'bushbuckridge';

-- Approve it (triggers auto-publish)
UPDATE uto.community_work SET status = 'approved' WHERE title = 'Thabo Mokoena — Plumber';

-- Verify
SELECT status, published_at, title FROM uto.community_work WHERE title = 'Thabo Mokoena — Plumber';
-- Should show: published, with published_at timestamp

SELECT channel, status FROM uto.publish_outbox WHERE work_id = (
  SELECT id FROM uto.community_work WHERE title = 'Thabo Mokoena — Plumber'
);
-- Should show 6 rows: town_page, search, ai_index, fixeasy24, ubuntu_jobs, coordinator_dashboard
```

### Step 6: Drain Outbox
```bash
# Set env vars
export SUPABASE_URL=https://afiokbhuxfdacbsipoqk.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Run the worker
npx tsx workers/publish-outbox/index.ts
```

## How to Roll Back
```sql
-- Drop publishing spine objects (reversible)
DROP TABLE IF EXISTS uto.publish_outbox CASCADE;
DROP TABLE IF EXISTS uto.work_approvals CASCADE;
DROP TABLE IF EXISTS uto.publishing_rules CASCADE;
DROP TABLE IF EXISTS uto.work_media CASCADE;
DROP TABLE IF EXISTS uto.work_fixeasy_worker CASCADE;
DROP TABLE IF EXISTS uto.work_familyhouse CASCADE;
DROP TABLE IF EXISTS uto.work_business CASCADE;
DROP TABLE IF EXISTS uto.work_event CASCADE;
DROP TABLE IF EXISTS uto.work_podcast CASCADE;
DROP TABLE IF EXISTS uto.community_work CASCADE;

-- Drop added columns
ALTER TABLE uto.towns DROP COLUMN IF EXISTS public_self_approve;
ALTER TABLE uto.proofs DROP COLUMN IF EXISTS community_work_id;

-- Drop functions
DROP FUNCTION IF EXISTS app.uto_rank CASCADE;
DROP FUNCTION IF EXISTS app.is_national CASCADE;
DROP FUNCTION IF EXISTS app.has_town_scope CASCADE;
DROP FUNCTION IF EXISTS app.rank_for_town CASCADE;
DROP FUNCTION IF EXISTS app.required_rank CASCADE;
DROP FUNCTION IF EXISTS app.can_read_work CASCADE;
DROP FUNCTION IF EXISTS app.can_write_work CASCADE;
DROP FUNCTION IF EXISTS app.tg_work_guard CASCADE;
DROP FUNCTION IF EXISTS app.tg_work_after CASCADE;
DROP FUNCTION IF EXISTS app.sync_user_from_auth CASCADE;
DROP FUNCTION IF EXISTS uto.search_community_work CASCADE;

-- Drop enums
DROP TYPE IF EXISTS uto.work_action CASCADE;
DROP TYPE IF EXISTS uto.work_type CASCADE;
DROP TYPE IF EXISTS uto.work_status CASCADE;
DROP TYPE IF EXISTS uto.work_visibility CASCADE;

-- Drop schema (only if nothing else lives in it)
DROP SCHEMA IF EXISTS app CASCADE;
```

## Files Changed
| File | Purpose |
|------|---------|
| `supabase/migrations/0003_community_work_publishing.sql` | Publishing spine DDL + RLS + triggers (targets `uto` schema) |
| `supabase/migrations/0004_identity_bridge.sql` | auth.users → uto.users sync + coordinator grant |
| `.env.local.uto` | Supabase env for canonical uto schema |
| `src/lib/supabase-client.ts` | Client pinned to `db: { schema: 'uto' }` |
| `src/app/workspace/page.tsx` | Mission dashboard page |
| `src/app/workspace/WorkspaceClient.tsx` | Dashboard UI (stats, work list, CTA) |
| `src/app/workspace/new/page.tsx` | Add community work page |
| `src/app/workspace/new/NewCommunityWorkClient.tsx` | 3-step form (type → details → visibility) |
| `src/components/community-work/CommunityWorkSection.tsx` | Town page section rendering published work |
| `workers/publish-outbox/index.ts` | Outbox drain worker (6 channel handlers) |
| `RUNBOOK.md` | This file |
