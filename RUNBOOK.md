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

### Step 2: Verify Identity Bridge
```sql
-- In Supabase SQL Editor:
SELECT * FROM app.verify_identity_bridge();
-- Should show all 5 checks = true
```

### Step 3: Grant Coordinator for Testing
```sql
-- Replace <user-uuid> with your auth.users id
SELECT app.grant_coordinator('<user-uuid>'::uuid, 'bushbuckridge');
```

### Step 4: Switch App to uto Schema
```bash
# Copy uto env file
cp .env.local.uto .env.local

# Regenerate types (requires supabase CLI connected to project)
npx supabase gen types typescript --project-id afiokbhuxfdacbsipoqk > src/lib/database.types.ts

# Rebuild
npm run build
```

### Step 5: Test the Loop
```sql
-- As coordinator (set JWT claims first):
-- INSERT a FixEasy worker
INSERT INTO community_work (type, town_id, title, visibility, status)
SELECT 'fixeasy_worker', id, 'Thabo Mokoena — Plumber', 'public', 'submitted'
FROM towns WHERE slug = 'bushbuckridge';

-- Approve it (triggers auto-publish)
UPDATE community_work SET status = 'approved' WHERE title = 'Thabo Mokoena — Plumber';

-- Verify
SELECT status, published_at, title FROM community_work WHERE title = 'Thabo Mokoena — Plumber';
-- Should show: published, with published_at timestamp

SELECT channel, status FROM publish_outbox WHERE community_work_id = (
  SELECT id FROM community_work WHERE title = 'Thabo Mokoena — Plumber'
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
DROP TABLE IF EXISTS publish_outbox CASCADE;
DROP TABLE IF EXISTS work_approvals CASCADE;
DROP TABLE IF EXISTS publishing_rules CASCADE;
DROP TABLE IF EXISTS work_media CASCADE;
DROP TABLE IF EXISTS work_fixeasy_worker CASCADE;
DROP TABLE IF EXISTS work_familyhouse CASCADE;
DROP TABLE IF EXISTS work_business CASCADE;
DROP TABLE IF EXISTS work_event CASCADE;
DROP TABLE IF EXISTS work_podcast CASCADE;
DROP TABLE IF EXISTS community_work CASCADE;

-- Drop added columns
ALTER TABLE towns DROP COLUMN IF EXISTS public_self_approve;
ALTER TABLE proofs DROP COLUMN IF EXISTS community_work_id;

-- Drop functions
DROP FUNCTION IF EXISTS app.has_role CASCADE;
DROP FUNCTION IF EXISTS app.has_town_scope CASCADE;
DROP FUNCTION IF EXISTS app.is_admin CASCADE;
DROP FUNCTION IF EXISTS app.my_town_id CASCADE;
DROP FUNCTION IF EXISTS app.grant_coordinator CASCADE;
DROP FUNCTION IF EXISTS app.verify_identity_bridge CASCADE;
DROP FUNCTION IF EXISTS search_community_work CASCADE;
DROP FUNCTION IF EXISTS trg_community_work_state_machine CASCADE;
DROP FUNCTION IF EXISTS trg_community_work_fanout CASCADE;
DROP FUNCTION IF EXISTS notify_work_published CASCADE;
DROP FUNCTION IF EXISTS handle_new_auth_user CASCADE;

-- Drop enums
DROP TYPE IF EXISTS publish_channel CASCADE;
DROP TYPE IF EXISTS work_action CASCADE;
DROP TYPE IF EXISTS work_type CASCADE;
DROP TYPE IF EXISTS work_status CASCADE;
DROP TYPE IF EXISTS work_visibility CASCADE;

-- Drop schema
DROP SCHEMA IF EXISTS app CASCADE;
```

## Files Changed
| File | Purpose |
|------|---------|
| `supabase/migrations/0003_community_work_publishing.sql` | Publishing spine DDL + RLS + triggers |
| `supabase/migrations/0004_identity_bridge.sql` | auth.users → uto.users sync + coordinator grant |
| `.env.local.uto` | Supabase env for canonical uto schema |
| `src/app/workspace/page.tsx` | Mission dashboard page |
| `src/app/workspace/WorkspaceClient.tsx` | Dashboard UI (stats, work list, CTA) |
| `src/app/workspace/new/page.tsx` | Add community work page |
| `src/app/workspace/new/NewCommunityWorkClient.tsx` | 3-step form (type → details → visibility) |
| `src/components/community-work/CommunityWorkSection.tsx` | Town page section rendering published work |
| `workers/publish-outbox/index.ts` | Outbox drain worker (6 channel handlers) |
| `RUNBOOK.md` | This file |
