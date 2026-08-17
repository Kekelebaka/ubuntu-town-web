-- =============================================================================
-- 0021_people_town_read.sql
-- =============================================================================
-- CONNECT layer (People domain) backend enablement.
--
-- Problem: uto.coordinators and uto.role_assignments only had `self_*` policies
-- (a caller could see their OWN row) and `admin_all` (national). A town
-- coordinator therefore could not see the people in their own town — so a
-- "My People" surface would be empty by RLS, not by design.
--
-- Fix: town-scoped SELECT via the canonical app.has_town_scope(town_id) helper,
-- mirroring cw_read_scope on community_work. A coordinator/deputy/ops/admin sees
-- people in towns they hold scope for; national sees all; everyone else sees
-- nothing. No writes granted. Verified adversarially: Ladybrand coordinator
-- sees Ladybrand people (roles=2, coords=1) and 0 from any other town.
-- =============================================================================

drop policy if exists town_read_coordinators on uto.coordinators;
create policy town_read_coordinators on uto.coordinators
  for select to authenticated
  using (app.has_town_scope(town_id));

drop policy if exists town_read_roles on uto.role_assignments;
create policy town_read_roles on uto.role_assignments
  for select to authenticated
  using (app.has_town_scope(town_id));

-- Rollback:
--   drop policy if exists town_read_coordinators on uto.coordinators;
--   drop policy if exists town_read_roles on uto.role_assignments;
