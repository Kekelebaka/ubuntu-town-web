-- =============================================================================
-- 0018_authz_hardening_and_kb_containment.sql
-- =============================================================================
-- Ubuntu Town OS — authorization hardening + reconciliation of production-only
-- security containment into version control.
--
-- WHY THIS EXISTS
--   Two separate problems are closed by this single migration:
--
--   1. AUTHORIZATION CORRECTNESS (P1-1 / P1-3)
--      uto.is_admin() granted administrative privilege to ANY holder of an
--      'admin' or 'ops' role_assignment, regardless of town_id. Its sibling
--      app.is_national() correctly requires town_id IS NULL. ~27 uto policies
--      named 'admin_all' delegate to uto.is_admin(), so a town-scoped admin
--      would have been treated as a NATIONAL admin across 27 tables for ALL
--      operations.
--
--      Additionally uto.is_admin(), uto.in_town() and uto.auth_role_keys() ran
--      with `SET search_path TO 'uto','public'` while referencing an
--      UNQUALIFIED `role_assignments`. As SECURITY DEFINER functions owned by
--      postgres, a future `public.role_assignments` would silently hijack every
--      authorization decision in the platform.
--
--   2. PRODUCTION-ONLY SECURITY CONTAINMENT (P0-1 / P0-2)
--      Emergency containment was applied directly to production and is
--      reproduced here so the intended architecture is reproducible from Git.
--      These statements are idempotent and safe to re-run.
--
-- ACCESS DELTA: ZERO. Verified against live data immediately before applying:
--   - role_assignments holding 'admin'/'ops' WITH a town_id  ....... 0 rows
--   - role_assignments holding 'admin'/'ops' with town_id IS NULL .. 1 row  (preserved)
--   - 'coordinator' assignments ................................... 45 rows (unaffected)
--   No user gains or loses a single privilege from this migration. It closes a
--   latent defect while the affected population is still zero.
--
-- ROLLBACK: see the commented block at the foot of this file.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. uto.is_admin() — constrain to NATIONAL scope, eliminate search_path ambiguity
-- -----------------------------------------------------------------------------
-- Semantic change: adds `ra.town_id is null`, aligning uto.is_admin() with
-- app.is_national(). Administrative privilege now means national scope only.
create or replace function uto.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $fn$
  select exists (
    select 1
    from uto.role_assignments ra
    where ra.user_id = auth.uid()
      and ra.role_key in ('admin','ops')
      and ra.town_id is null          -- national scope only
  );
$fn$;

comment on function uto.is_admin() is
  'True only for NATIONAL admin/ops (town_id IS NULL). Aligned with app.is_national(). '
  'SECURITY DEFINER with empty search_path and fully schema-qualified references.';

-- -----------------------------------------------------------------------------
-- 2. uto.in_town(uuid) — hardening only, NO semantic change
-- -----------------------------------------------------------------------------
-- Role set is intentionally preserved exactly as-is (coordinator, deputy,
-- ambassador, media). Convergence with app.has_town_scope() is a later,
-- separately-tested decision and is deliberately NOT attempted here.
create or replace function uto.in_town(t uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $fn$
  select uto.is_admin() or exists (
    select 1
    from uto.role_assignments ra
    where ra.user_id = auth.uid()
      and (ra.town_id = t or ra.town_id is null)
      and ra.role_key in ('coordinator','deputy','ambassador','media')
  );
$fn$;

comment on function uto.in_town(uuid) is
  'Town scope check. Hardened: empty search_path, schema-qualified. Role semantics unchanged.';

-- -----------------------------------------------------------------------------
-- 3. uto.auth_role_keys() — hardening only, NO semantic change
-- -----------------------------------------------------------------------------
create or replace function uto.auth_role_keys()
returns uto.role_key[]
language sql
stable
security definer
set search_path to ''
as $fn$
  select coalesce(array_agg(distinct ra.role_key), '{}')::uto.role_key[]
  from uto.role_assignments ra
  where ra.user_id = auth.uid();
$fn$;

comment on function uto.auth_role_keys() is
  'Caller role keys. Hardened: empty search_path, schema-qualified. Semantics unchanged.';

-- -----------------------------------------------------------------------------
-- 4. RECONCILIATION — KasiBuy P0 containment applied directly to production
-- -----------------------------------------------------------------------------
-- P0-1: public.kb_admin_sso(text,uuid) is SECURITY DEFINER owned by postgres and
-- accepts a CALLER-SUPPLIED p_auth_id which it never validates against
-- auth.uid(). It matches kb_admins on email alone, rebinds auth_user_id to the
-- supplied UUID, then mints and RETURNS a session token. Any principal able to
-- reach it could take over the admin console.
--
-- Reachability is closed here. service_role is retained for any server-side
-- route. THE FUNCTION REMAINS STRUCTURALLY UNSOUND and must be rewritten to
-- derive identity from auth.uid() (it should take no p_auth_id at all) or be
-- retired. Tracked as an open P0-by-design.
revoke execute on function public.kb_admin_sso(text, uuid) from anon;
revoke execute on function public.kb_admin_sso(text, uuid) from authenticated;

-- P0-2: public.kb_points.pin holds POS PINs in PLAINTEXT and anon held a
-- table-wide SELECT grant, while the row policy is USING (active) — exposing
-- every active point's PIN to unauthenticated callers. kb_pos_login()
-- authenticates against this exact column.
--
-- NOTE: a column-level `revoke select (pin)` does NOT work against a
-- table-level grant in PostgreSQL — the table privilege continues to cover
-- every column. The table grant must be revoked and the safe columns
-- re-granted explicitly, as below.
--
-- kb_pos_login() is SECURITY DEFINER owned by postgres and reads `pin` as the
-- owner, so POS authentication is unaffected by these grants.
revoke select on table public.kb_points from anon, authenticated;
grant  select (id, town_id, name, distance_km, point_no, has_pos, active)
       on public.kb_points to anon, authenticated;

commit;

-- =============================================================================
-- VALIDATION (run after applying; all must hold)
-- =============================================================================
--   select uto.is_admin();                                    -- executes, false without JWT
--   select uto.in_town(gen_random_uuid());                    -- executes, false without JWT
--   select uto.auth_role_keys();                              -- executes, {}
--   select proname, proconfig from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname='uto'
--      and proname in ('is_admin','in_town','auth_role_keys');
--     -- each must report search_path=""
--   select count(*) from uto.role_assignments
--    where role_key::text in ('admin','ops') and town_id is not null;   -- must be 0
--   select has_function_privilege('anon','public.kb_admin_sso(text,uuid)','EXECUTE');  -- false
--   select has_column_privilege('anon','public.kb_points','pin','SELECT');             -- false
--   select has_column_privilege('anon','public.kb_points','name','SELECT');            -- true
--
-- =============================================================================
-- ROLLBACK
-- =============================================================================
-- begin;
-- create or replace function uto.is_admin()
-- returns boolean language sql stable security definer
-- set search_path to 'uto','public' as $fn$
--   select exists (
--     select 1 from role_assignments
--     where user_id = auth.uid() and role_key in ('admin','ops')
--   );
-- $fn$;
--
-- create or replace function uto.in_town(t uuid)
-- returns boolean language sql stable security definer
-- set search_path to 'uto','public' as $fn$
--   select uto.is_admin() or exists (
--     select 1 from role_assignments
--     where user_id = auth.uid()
--       and (town_id = t or town_id is null)
--       and role_key in ('coordinator','deputy','ambassador','media')
--   );
-- $fn$;
--
-- create or replace function uto.auth_role_keys()
-- returns uto.role_key[] language sql stable security definer
-- set search_path to 'uto','public' as $fn$
--   select coalesce(array_agg(distinct role_key), '{}')::role_key[]
--   from role_assignments where user_id = auth.uid();
-- $fn$;
--
-- grant execute on function public.kb_admin_sso(text, uuid) to anon, authenticated;
-- grant select on table public.kb_points to anon, authenticated;
-- commit;
-- =============================================================================
