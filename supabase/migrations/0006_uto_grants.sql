-- 0006: Grant table privileges on the uto schema to the app roles.
--
-- RLS is already enabled on every uto table and remains the row-level gate.
-- These grants let PostgREST requests from logged-in users actually REACH the
-- tables. Without them, authenticated queries were denied at the privilege
-- layer (SQLSTATE 42501 "permission denied for table ..."), which surfaced
-- in-app as "Not a Coordinator" even though the coordinator's role row existed.
--
-- Idempotent and safe to re-run.

grant usage on schema uto to authenticated, anon;
grant select on all tables in schema uto to authenticated;
grant usage, select on all sequences in schema uto to authenticated;
alter default privileges in schema uto grant select on tables to authenticated;
