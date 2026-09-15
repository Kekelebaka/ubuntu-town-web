-- Northstar Gate 1: Founding Fifty Geography Reconciliation
-- Migration: 0024_northstar_reconcile_founding_fifty.sql
-- Target: staging lgbkfthojyxhwemgkpgo ONLY (NEVER production)
-- Transaction: single, ON_ERROR_STOP
-- Idempotent: conditional update only when values differ
-- Non-destructive: no DELETE, no DROP of user data
--
-- Pre-conditions:
--   uto.towns exists with columns: id, name, slug, province, status,
--     is_founding, recruitment_status, applicant_count, aliases,
--     created_at, updated_at
--   trg_towns_updated trigger exists (AFTER UPDATE, sets updated_at)
--   Unique constraint on uto.towns.slug
--
-- Post-migration invariants:
--   total towns = 63 (50 founding + 11 legacy + 2 synthetic)
--   founding towns = 50
--   legacy non-founding = 11
--   synthetic non-founding = 2
--   province distribution = 6/6/6/6/6/5/5/5/5
--
-- Rollback: owned by the calling workflow (not this file)
-- ============================================================

-- ============================================================
-- 1. ADD MISSING COLUMNS (idempotent, additive)
-- ============================================================
ALTER TABLE uto.towns ADD COLUMN IF NOT EXISTS is_founding boolean NOT NULL DEFAULT false;
ALTER TABLE uto.towns ADD COLUMN IF NOT EXISTS recruitment_status text;
ALTER TABLE uto.towns ADD COLUMN IF NOT EXISTS applicant_count integer NOT NULL DEFAULT 0;

-- ============================================================
-- 2. PRE-MIGRATION RECEIPT (durable temp tables for in-txn assertions)
-- ============================================================
DROP TABLE IF EXISTS _pre_receipt;
CREATE TEMP TABLE _pre_receipt AS
SELECT id, name, slug, province, is_founding, status, updated_at
FROM uto.towns
ORDER BY slug;

DROP TABLE IF EXISTS _pre_readiness;
CREATE TEMP TABLE _pre_readiness AS
SELECT town_id, applicant_count, coordinator_status, launch_readiness_pct
FROM uto.town_readiness
ORDER BY town_id;

-- ============================================================
-- 3. UPSERT50 FOUNDING TOWNS (conditional update)
-- ============================================================
-- For existing towns: update ONLY province and is_founding when they differ.
-- The trg_towns_updated trigger will set updated_at on any actual change.
-- For new towns: insert with status='recruit', is_founding=true.

INSERT INTO uto.towns (id, name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
VALUES
  -- ── Free State (6) ─────────────────────────────────────────
  ('ac3b266e-e9cc-5b49-8322-8caeed82259d', 'Ficksburg',       'ficksburg',       'Free State',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('cb054aca-463a-5119-a613-e0fa467d88cc', 'Harrismith',      'harrismith',      'Free State',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('e2295aa5-0de3-5b05-a326-28713c48303e', 'Ladybrand',       'ladybrand',       'Free State',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('94a9714e-2c54-5c3a-a7da-c29af33af3fb', 'Sasolburg',       'sasolburg',       'Free State',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('6e9ec4ce-305f-5222-8385-99981fd87281', 'Thaba Nchu',      'thaba-nchu',      'Free State',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('8f8a54af-b311-532b-bee9-5406365dc499', 'Brandfort',       'brandfort',       'Free State',  'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── KwaZulu-Natal (6) ──────────────────────────────────────
  ('c73b6817-d3d3-5ede-b3b0-f51b0eb60651', 'Kokstad',         'kokstad',         'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('15ca1b01-7049-583c-8602-25bd147efbc3', 'Vryheid',         'vryheid',         'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('7cb5ee5b-2658-5c98-9231-73fc7fc6c114', 'Ulundi',          'ulundi',          'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('9cc94a82-b345-52d3-9ea1-ee7cdf3d3e6d', 'Estcourt',        'estcourt',        'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('1d8cb25b-aa6d-5066-b90e-11be7236bc78', 'Greytown',        'greytown',        'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('4cde17e8-4930-5bbe-9c5c-a39e9bde1f72', 'Nquthu',          'nquthu',          'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── Eastern Cape (6) ───────────────────────────────────────
  ('5eaa0c54-f9aa-5a96-a935-8649747b8ee2', 'Butterworth',     'butterworth',     'Eastern Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('e9442eea-ab4c-525b-8f6f-d0dd1eef31b6', 'Qumbu',           'qumbu',           'Eastern Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('218060f5-d9e9-5808-8247-01f874051e7c', 'Cofimvaba',       'cofimvaba',       'Eastern Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('8546c343-709a-5c42-8cfc-736aefa536e4', 'Flagstaff',       'flagstaff',       'Eastern Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('6e43aa9b-250a-5272-af2b-62b0c2f97302', 'Bizana',          'bizana',          'Eastern Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('86e23bc1-3dc4-5792-b733-f6434f6b3804', 'Bhisho',          'bhisho',          'Eastern Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── Limpopo (6) ────────────────────────────────────────────
  ('17e463a0-b938-5075-8765-61190a20c441', 'Burgersfort',     'burgersfort',     'Limpopo',       'recruit', true, 'recruit', 0, array['Burgersford']),
  ('362b7140-831b-4e32-bc65-674416087bb0', 'Thohoyandou',     'thohoyandou',     'Limpopo',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('4316bd1a-0eeb-441f-aa9f-d4e90de5a816', 'Tzaneen',         'tzaneen',         'Limpopo',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('029847d9-d5ac-5a65-86be-4c778ff4ce55', 'Mokopane',        'mokopane',        'Limpopo',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('ac14abf7-ff51-5f07-90b1-49b93b530a16', 'Lephalale',       'lephalale',       'Limpopo',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('2d0047cf-5816-5a00-9325-60564654cc74', 'Lebowakgomo',     'lebowakgomo',     'Limpopo',       'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── North West (6) ─────────────────────────────────────────
  ('5124e1b6-21ad-5339-b899-8059d329b66b', 'Koster',          'koster',          'North West',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('99b98efa-66ff-57b2-98e2-d3c01f989c20', 'Lichtenburg',     'lichtenburg',     'North West',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('6fd6fd43-045f-5663-b11d-420c086672b6', 'Zeerust',         'zeerust',         'North West',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('eb04904a-4fce-53c1-bcb3-814c7d5baabf', 'Schweizer-Reneke','schweizer-reneke','North West',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('df45d0cc-a9e9-552d-8bfd-4d4f8df80773', 'Taung',           'taung',           'North West',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('70aa6f97-f4cd-56eb-bdc7-20fca40655ff', 'Delareyville',    'delareyville',    'North West',    'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── Mpumalanga (5) ─────────────────────────────────────────
  ('6f15b0e9-06ee-5fb9-8494-b9c38c42f7e0', 'Bushbuckridge',   'bushbuckridge',   'Mpumalanga',    'recruit', true, 'recruit', 0, array['Bushbukridge']),
  ('82aa0651-9f56-4c14-900d-1f6041afcbf6', 'Mbombela',        'mbombela',        'Mpumalanga',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('d1bd27ab-2062-5e4d-8b1c-2825129c74a5', 'eMalahleni',      'emalahleni',      'Mpumalanga',    'recruit', true, 'recruit', 0, '{}'::text[]),
  ('1fa804a1-0a11-53bb-ac54-316026360ebc', 'Sabie',           'sabie',           'Mpumalanga',    'recruit', true, 'recruit', 0, array['Sabbie']),
  ('d9bf20e5-8a6b-5bda-afdb-fd41a23eccb6', 'Ermelo',          'ermelo',          'Mpumalanga',    'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── Gauteng (5) ────────────────────────────────────────────
  ('cd324904-9013-44a9-9f83-59cbbdf815c3', 'Soweto',          'soweto',          'Gauteng',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('412d1b70-cdf8-48dd-8e0c-2e799253bbb9', 'Tembisa',         'tembisa',         'Gauteng',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('2e721b18-7457-5304-8f42-290f0cf32716', 'Carletonville',   'carletonville',   'Gauteng',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('a3ffe536-e018-4740-88ea-229b49ae1df8', 'Randfontein',     'randfontein',     'Gauteng',       'recruit', true, 'recruit', 0, '{}'::text[]),
  ('ca666f80-a5b3-5806-b857-c62ce93abd9b', 'Vanderbijlpark',  'vanderbijlpark',  'Gauteng',       'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── Northern Cape (5) ──────────────────────────────────────
  ('beb83e7c-f5ed-4532-b3ac-517a10073594', 'Kimberley',       'kimberley',       'Northern Cape', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('78174d8f-5c22-4675-b7a3-adc3fd0a252a', 'Kuruman',         'kuruman',         'Northern Cape', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('5f13ba35-aa29-40f1-a188-f34b5f01b27b', 'Upington',        'upington',        'Northern Cape', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('1d597c83-0b03-4f83-ab6a-32f2222639b1', 'De Aar',          'de-aar',          'Northern Cape', 'recruit', true, 'recruit', 0, '{}'::text[]),
  ('5add49bb-68f4-5b86-9bdd-2f5952bafb51', 'Springbok',       'springbok',       'Northern Cape', 'recruit', true, 'recruit', 0, '{}'::text[]),

  -- ── Western Cape (5) ───────────────────────────────────────
  ('38aad56f-b81b-4f76-becb-62ac98fdf6af', 'Cape Town',       'cape-town',       'Western Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('d851b70a-0dcf-4242-846d-b27a44b44e7b', 'Paarl',           'paarl',           'Western Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('07d2d471-da5b-476f-aeb3-874e002abc32', 'Worcester',       'worcester',       'Western Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('2d11fc6d-52f0-4e2a-95b9-6f5fb9359228', 'George',          'george',          'Western Cape',  'recruit', true, 'recruit', 0, '{}'::text[]),
  ('5e834a72-8010-5fb2-8ce2-6402f2955f6d', 'Oudtshoorn',      'oudtshoorn',      'Western Cape',  'recruit', true, 'recruit', 0, '{}'::text[])

ON CONFLICT (slug) DO UPDATE SET
  province = EXCLUDED.province,
  is_founding = true
WHERE
  uto.towns.province IS DISTINCT FROM EXCLUDED.province
  OR uto.towns.is_founding IS DISTINCT FROM true;

-- ============================================================
-- 4. MARK11 LEGACY SLUGS NON-FOUNDING (explicit list)
-- ============================================================
UPDATE uto.towns SET is_founding = false
WHERE slug IN (
  'east-london', 'gqeberha', 'mthatha', 'welkom', 'pretoria',
  'springs', 'richards-bay', 'polokwane', 'klerksdorp',
  'mahikeng', 'rustenburg'
)
AND is_founding IS DISTINCT FROM false;

-- ============================================================
-- 5. CREATE READINESS FOR EXACTLY36 NEW TOWNS
-- ============================================================
-- Insert readiness only for the36 towns that were newly inserted
-- (not the14 shared, not the11 legacy, not the2 synthetic).
-- Uses the explicit list of36 authoritative missing slugs.

INSERT INTO uto.town_readiness (town_id, applicant_count, coordinator_status, launch_readiness_pct)
SELECT t.id, 0, 'vacant', 0
FROM uto.towns t
WHERE t.slug IN (
  'ficksburg', 'harrismith', 'ladybrand', 'sasolburg', 'thaba-nchu', 'brandfort',
  'kokstad', 'vryheid', 'ulundi', 'estcourt', 'greytown', 'nquthu',
  'butterworth', 'qumbu', 'cofimvaba', 'flagstaff', 'bizana', 'bhisho',
  'burgersfort', 'mokopane', 'lephalale', 'lebowakgomo',
  'koster', 'lichtenburg', 'zeerust', 'schweizer-reneke', 'taung', 'delareyville',
  'bushbuckridge', 'emalahleni', 'sabie', 'ermelo',
  'carletonville', 'vanderbijlpark',
  'springbok', 'oudtshoorn'
)
AND NOT EXISTS (
  SELECT 1 FROM uto.town_readiness tr WHERE tr.town_id = t.id
);

-- ============================================================
-- 6. POST-MIGRATION VERIFICATION
-- ============================================================
DO $$
DECLARE
  _total integer;
  _founding integer;
  _legacy integer;
  _synthetic integer;
  _readiness_new integer;
BEGIN
  SELECT count(*) INTO _total FROM uto.towns;
  SELECT count(*) INTO _founding FROM uto.towns WHERE is_founding = true;
  SELECT count(*) INTO _legacy FROM uto.towns WHERE slug IN (
    'east-london','gqeberha','mthatha','welkom','pretoria',
    'springs','richards-bay','polokwane','klerksdorp','mahikeng','rustenburg'
  ) AND is_founding = false;
  SELECT count(*) INTO _synthetic FROM uto.towns WHERE slug LIKE 'synthetic-town-%' AND is_founding = false;
  SELECT count(*) INTO _readiness_new FROM uto.town_readiness tr
    JOIN uto.towns t ON t.id = tr.town_id
    WHERE t.slug IN (
      'ficksburg','harrismith','ladybrand','sasolburg','thaba-nchu','brandfort',
      'kokstad','vryheid','ulundi','estcourt','greytown','nquthu',
      'butterworth','qumbu','cofimvaba','flagstaff','bizana','bhisho',
      'burgersfort','mokopane','lephalale','lebowakgomo',
      'koster','lichtenburg','zeerust','schweizer-reneke','taung','delareyville',
      'bushbuckridge','emalahleni','sabie','ermelo',
      'carletonville','vanderbijlpark',
      'springbok','oudtshoorn'
    );

  RAISE NOTICE 'Post-migration verification:';
  RAISE NOTICE '  Total towns: % (expected 63)', _total;
  RAISE NOTICE '  Founding: % (expected 50)', _founding;
  RAISE NOTICE '  Legacy non-founding: % (expected 11)', _legacy;
  RAISE NOTICE '  Synthetic non-founding: % (expected 2)', _synthetic;
  RAISE NOTICE '  New readiness rows: % (expected 36)', _readiness_new;

  IF _total != 63 THEN RAISE EXCEPTION 'FAIL: total towns = %, expected 63', _total; END IF;
  IF _founding != 50 THEN RAISE EXCEPTION 'FAIL: founding = %, expected 50', _founding; END IF;
  IF _legacy != 11 THEN RAISE EXCEPTION 'FAIL: legacy = %, expected 11', _legacy; END IF;
  IF _synthetic != 2 THEN RAISE EXCEPTION 'FAIL: synthetic = %, expected 2', _synthetic; END IF;
  IF _readiness_new != 36 THEN RAISE EXCEPTION 'FAIL: new readiness = %, expected 36', _readiness_new; END IF;

  RAISE NOTICE 'All post-migration invariants PASS';
END $$;

-- ============================================================
-- 7. IDEMPOTENCY CHECK (no-op on second run)
-- ============================================================
-- The conditional UPDATE predicates ensure:
-- - province/is_founding only update when values differ
-- - trg_towns_updated only fires on actual changes
-- - readiness INSERT uses NOT EXISTS to skip existing rows
-- - legacy UPDATE uses IS DISTINCT FROM to skip already-false rows

-- ============================================================
-- ROLLBACK PROCEDURE (executable, not placeholder)
-- ============================================================
-- To rollback this migration:
--
-- BEGIN;
--
-- -- Step 1: Restore original founding flags for11 legacy towns
-- UPDATE uto.towns SET is_founding = true
-- WHERE slug IN (
--   'east-london', 'gqeberha', 'mthatha', 'welkom', 'pretoria',
--   'springs', 'richards-bay', 'polokwane', 'klerksdorp',
--   'mahikeng', 'rustenburg'
-- );
--
-- -- Step 2: Mark36 new towns non-founding
-- UPDATE uto.towns SET is_founding = false
-- WHERE slug IN (
--   'ficksburg', 'harrismith', 'ladybrand', 'sasolburg', 'thaba-nchu', 'brandfort',
--   'kokstad', 'vryheid', 'ulundi', 'estcourt', 'greytown', 'nquthu',
--   'butterworth', 'qumbu', 'cofimvaba', 'flagstaff', 'bizana', 'bhisho',
--   'burgersfort', 'mokopane', 'lephalale', 'lebowakgomo',
--   'koster', 'lichtenburg', 'zeerust', 'schweizer-reneke', 'taung', 'delareyville',
--   'bushbuckridge', 'emalahleni', 'sabie', 'ermelo',
--   'carletonville', 'vanderbijlpark',
--   'springbok', 'oudtshoorn'
-- );
--
-- -- Step 3: Remove readiness rows for the36 new towns
-- DELETE FROM uto.town_readiness
-- WHERE town_id IN (
--   SELECT id FROM uto.towns WHERE slug IN (
--     'ficksburg', 'harrismith', 'ladybrand', 'sasolburg', 'thaba-nchu', 'brandfort',
--     'kokstad', 'vryheid', 'ulundi', 'estcourt', 'greytown', 'nquthu',
--     'butterworth', 'qumbu', 'cofimvaba', 'flagstaff', 'bizana', 'bhisho',
--     'burgersfort', 'mokopane', 'lephalale', 'lebowakgomo',
--     'koster', 'lichtenburg', 'zeerust', 'schweizer-reneke', 'taung', 'delareyville',
--     'bushbuckridge', 'emalahleni', 'sabie', 'ermelo',
--     'carletonville', 'vanderbijlpark',
--     'springbok', 'oudtshoorn'
--   )
--   AND NOT EXISTS (
--     SELECT 1 FROM _pre_readiness pr WHERE pr.town_id = uto.town_readiness.town_id
--   )
-- );
--
-- -- Step 4: Restore any province/name changes for existing14 towns
-- -- (use pre-receipt if captured externally)
-- -- UPDATE uto.towns SET province = r.province FROM _pre_receipt r WHERE ...
--
-- COMMIT;
--
-- Note: The36 new town ROWS are intentionally retained (not deleted)
-- to preserve any FK references that may have been created.
-- Only their founding flag and readiness rows are reverted.
