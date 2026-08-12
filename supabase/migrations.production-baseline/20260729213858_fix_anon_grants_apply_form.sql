-- Public coordinator apply form: anon needs TABLE PRIVILEGES, not just RLS policies.
-- Without these, PostgREST returns 42501 permission denied before RLS is ever consulted,
-- so the town dropdown renders empty and the required Town field can never be satisfied.
grant select on uto.towns to anon;
grant insert on uto.applications to anon, authenticated;

-- Matching RLS policy. Anonymous submitters may only create an application in the
-- initial 'received' state (they cannot self-advance to approved/active).
drop policy if exists anon_submit_applications on uto.applications;
create policy anon_submit_applications on uto.applications
  for insert to anon, authenticated
  with check (status = 'received');