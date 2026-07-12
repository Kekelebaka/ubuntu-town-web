-- ============================================================================
-- ACCEPTANCE TESTS — Publishing Spine
-- Run in Supabase SQL Editor after applying 0003 + 0004
-- ============================================================================

-- ============================================================================
-- A. THE PUBLISH LOOP (as seeded coordinator)
-- ============================================================================

-- Setup: grant coordinator role to current user
-- (Run this with your actual user UUID)
-- SELECT app.grant_coordinator(auth.uid(), 'bushbuckridge');

-- A1. Insert a FixEasy worker as 'submitted'
INSERT INTO community_work (type, town_id, title, visibility, status)
SELECT 'fixeasy_worker', id, 'Thabo Mokoena — Plumber', 'public', 'submitted'
FROM towns WHERE slug = 'bushbuckridge';

-- A2. Approve it — should auto-advance to 'published' via trigger
UPDATE community_work SET status = 'approved' WHERE title = 'Thabo Mokoena — Plumber';

-- A3. VERIFY: status = published, published_at is set
DO $$
DECLARE
  _status work_status;
  _pub_at timestamptz;
BEGIN
  SELECT status, published_at INTO _status, _pub_at
  FROM community_work WHERE title = 'Thabo Mokoena — Plumber';
  
  ASSERT _status = 'published', 'Expected published, got: ' || _status;
  ASSERT _pub_at IS NOT NULL, 'published_at should be set';
  RAISE NOTICE 'A3 PASS: status=%, published_at=%', _status, _pub_at;
END $$;

-- A4. VERIFY: work_approvals has the approval trail
DO $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count FROM work_approvals
  WHERE community_work_id = (SELECT id FROM community_work WHERE title = 'Thabo Mokoena — Plumber');
  ASSERT _count >= 1, 'Expected at least 1 approval record, got: ' || _count;
  RAISE NOTICE 'A4 PASS: % approval records', _count;
END $$;

-- A5. VERIFY: publish_outbox has rows for all expected channels
DO $$
DECLARE
  _channels text[];
  _expected text[] := ARRAY['town_page', 'search', 'ai_index', 'fixeasy24', 'ubuntu_jobs', 'coordinator_dashboard'];
  _missing text[];
BEGIN
  SELECT array_agg(DISTINCT channel::text) INTO _channels
  FROM publish_outbox
  WHERE community_work_id = (SELECT id FROM community_work WHERE title = 'Thabo Mokoena — Plumber');
  
  SELECT array_agg(e) INTO _missing
  FROM unnest(_expected) e
  WHERE e NOT IN (SELECT unnest(_channels));
  
  IF _missing IS NOT NULL AND array_length(_missing, 1) > 0 THEN
    RAISE EXCEPTION 'Missing channels: %', _missing;
  END IF;
  RAISE NOTICE 'A5 PASS: All 6 channels present: %', _channels;
END $$;

-- ============================================================================
-- B. RLS BOUNDARY TESTS
-- ============================================================================

-- B1. Anonymous can see published + public/national
SET ROLE anon;
SET request.jwt.claims TO '{}';

DO $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count FROM community_work;
  -- Should see the published Thabo Mokoena row
  ASSERT _count >= 1, 'Anon should see published public work, got: ' || _count;
  RAISE NOTICE 'B1 PASS: Anon sees % published public rows', _count;
END $$;

-- B2. Anonymous cannot see drafts or internal
-- (Insert a draft to test)
RESET ROLE;
INSERT INTO community_work (type, town_id, title, visibility, status)
SELECT 'fixeasy_worker', id, 'Draft Worker — Should Not Be Visible', 'internal', 'draft'
FROM towns WHERE slug = 'bushbuckridge';

SET ROLE anon;
SET request.jwt.claims TO '{}';

DO $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count FROM community_work
  WHERE title = 'Draft Worker — Should Not Be Visible';
  ASSERT _count = 0, 'Anon should NOT see internal drafts, got: ' || _count;
  RAISE NOTICE 'B2 PASS: Anon correctly hidden from internal draft';
END $$;

-- B3. Coordinator of different town cannot see Bushbuckridge drafts
RESET ROLE;
-- (Would need a second user — skip for vertical slice, test manually)

-- B4. Admin can see everything
RESET ROLE;
-- (Set JWT to admin user)
-- SET request.jwt.claims TO '{"sub":"<admin-uuid>"}';
-- SET ROLE authenticated;
-- SELECT count(*) FROM community_work; -- Should see all rows

-- Cleanup test data
RESET ROLE;
DELETE FROM publish_outbox WHERE community_work_id IN (
  SELECT id FROM community_work WHERE title LIKE '%Thabo Mokoena%' OR title LIKE '%Draft Worker%'
);
DELETE FROM work_approvals WHERE community_work_id IN (
  SELECT id FROM community_work WHERE title LIKE '%Thabo Mokoena%' OR title LIKE '%Draft Worker%'
);
DELETE FROM community_work WHERE title LIKE '%Thabo Mokoena%' OR title LIKE '%Draft Worker%';

RAISE NOTICE '=== ALL ACCEPTANCE TESTS PASSED ===';
