-- 20260729000000_anon_public_form_access.sql
--
-- Public (anonymous) forms on enter.ubuntutown.co.za were failing silently.
-- Root cause: RLS policies existed, but the `anon` role had no TABLE
-- privileges on the uto schema, so PostgREST returned 42501 permission denied
-- *before* RLS was ever evaluated. The town dropdown rendered empty and the
-- required Town field could never be satisfied.
--
-- Idempotent. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Coordinator apply form (/apply)  — ALREADY APPLIED IN PRODUCTION
-- ---------------------------------------------------------------------------
grant select on uto.towns to anon;
grant insert on uto.applications to anon, authenticated;

drop policy if exists anon_submit_applications on uto.applications;
create policy anon_submit_applications on uto.applications
  for insert to anon, authenticated
  with check (status = 'received');   -- initial state only; cannot self-approve

-- ---------------------------------------------------------------------------
-- 2. Homepage stat block  — ALREADY APPLIED IN PRODUCTION
-- ---------------------------------------------------------------------------
grant select on uto.coordinators to anon;

-- ---------------------------------------------------------------------------
-- 3. Public signal submission (/submit-signal)  — NOT YET APPLIED
--
-- The existing insert policy `town_write_signals` requires uto.in_town(town_id),
-- which is false for an anonymous visitor, so the public form cannot insert
-- even with the grant. This adds a narrow companion policy: anon may only
-- create a signal in the initial 'new' state, tagged source='public_web'.
-- Reads stay gated by town_read_signals / admin_all — anon cannot read signals.
-- ---------------------------------------------------------------------------
grant insert on uto.signals to anon;

drop policy if exists anon_submit_signals on uto.signals;
create policy anon_submit_signals on uto.signals
  for insert to anon
  with check (status = 'new' and source = 'public_web');
