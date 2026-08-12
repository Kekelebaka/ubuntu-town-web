-- =============================================================================
-- 0019_proof_authz_and_work_audit.sql
-- =============================================================================
-- NORTH STAR GATE 1 — close the Work → Proof database boundary.
--
-- DEPENDS ON: 0018_authz_hardening_and_kb_containment.sql (PR #8).
--   0018 narrowed uto.is_admin() to national scope. The proofs `admin_all`
--   policy calls uto.is_admin(), so this migration's authorization model
--   assumes 0018's semantics are in place.
--
-- ---------------------------------------------------------------------------
-- THE BLOCKER
-- ---------------------------------------------------------------------------
-- uto.proofs was built for a different parent. Its only tenancy policy,
-- `town_rw_proofs`, resolves through uto.workpack_instances — a table that is
-- EMPTY, as is uto.workpacks. The community_work_id column was added later with
-- a NOT VALID foreign key, and NO policy referenced it.
--
-- Consequence: a coordinator with legitimate write access to a piece of
-- community work had NO authorization path to attach evidence to it. The
-- policy evaluated a workpack instance that is always NULL. The Work Proof Loop
-- could not execute.
--
-- A second, independent blocker sat underneath it: `authenticated` held only
-- SELECT on uto.proofs. Even with correct RLS, every INSERT would have been
-- refused at the grant layer before a policy was ever evaluated.
--
-- ---------------------------------------------------------------------------
-- THE PRINCIPLE
-- ---------------------------------------------------------------------------
-- Proof inherits authorization from its parent work, via the canonical app.*
-- family. No new proof model, no new parent, no new helper, no new RBAC.
--
--   read  proof  <=  app.can_read_work(community_work_id)
--   write proof  <=  app.can_write_work(community_work_id)
--
-- The legacy workpack path is preserved untouched for backwards compatibility.
--
-- ---------------------------------------------------------------------------
-- AMBIGUOUS-PARENT RULE (least privilege, enforced by a RESTRICTIVE policy)
-- ---------------------------------------------------------------------------
-- Permissive policies OR together, so adding a community-work policy alongside
-- the workpack policy would let a proof with BOTH parents inherit the WIDER of
-- the two authorities. That is precisely the escalation we must not create.
-- A RESTRICTIVE policy is therefore AND-ed over the top to force conjunction:
--
--   Case A — community_work_id only ...... community-work authority applies
--   Case B — workpack_instance_id only ... legacy workpack authority applies
--   Case C — both populated .............. BOTH parents must permit
--   Case D — neither populated ........... DENIED (national ops exempt, so
--                                          orphaned rows remain administrable)
--
-- ---------------------------------------------------------------------------
-- AUDIT
-- ---------------------------------------------------------------------------
-- uto.audit_logs already existed and was empty; nothing wrote to it. Rather
-- than modify app.tg_work_after() — which owns approvals and the publish
-- outbox, and must not be destabilised — audit is added as a SEPARATE trigger.
-- It fires after `work_after` (triggers fire in alphabetical order: work_after,
-- work_audit, work_guard, work_status_notify), so audit is a consequence of a
-- transition that has already succeeded. The state machine is NOT modified.
--
-- actor_id is resolved defensively: uto.audit_logs.actor_id is a foreign key to
-- uto.users, so a caller absent from that table would raise and roll back the
-- user's transition. We therefore look the id up first and leave actor_id NULL
-- if absent, preserving the raw claim in after->>'claimed_uid'. Audit must
-- never be able to block legitimate work.
--
-- NOTE ON THE STATE MACHINE (observed, not changed): app.tg_work_guard()
-- rewrites 'approved' to 'published' within the same statement. 'approved' is
-- therefore never observable as a resting status — approval and publication are
-- ONE atomic transition. The audit trigger emits BOTH `work.approved` and
-- `work.published` so the evidence trail records the decision and its effect
-- separately, mirroring what tg_work_after already does for work_approvals.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Grant layer — without this, RLS is never reached on write
-- ---------------------------------------------------------------------------
-- DELETE is deliberately NOT granted: Slice #1 does not require proof deletion,
-- and permissions are not widened speculatively.
grant insert, update on table uto.proofs to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Community-work authorization path (permissive)
-- ---------------------------------------------------------------------------
drop policy if exists proofs_cw_read on uto.proofs;
create policy proofs_cw_read on uto.proofs
  for select to authenticated
  using (community_work_id is not null and app.can_read_work(community_work_id));

drop policy if exists proofs_cw_insert on uto.proofs;
create policy proofs_cw_insert on uto.proofs
  for insert to authenticated
  with check (community_work_id is not null and app.can_write_work(community_work_id));

-- USING gates the row as it stands; WITH CHECK gates the row as it will be.
-- Both are required: WITH CHECK is what blocks re-parenting a proof from
-- authorised work onto unauthorised work (test T04).
drop policy if exists proofs_cw_update on uto.proofs;
create policy proofs_cw_update on uto.proofs
  for update to authenticated
  using       (community_work_id is not null and app.can_write_work(community_work_id))
  with check  (community_work_id is not null and app.can_write_work(community_work_id));

-- ---------------------------------------------------------------------------
-- 3. Parent integrity (restrictive — AND-ed over all permissive policies)
-- ---------------------------------------------------------------------------
drop policy if exists proofs_parent_integrity on uto.proofs;
create policy proofs_parent_integrity on uto.proofs
  as restrictive for all to authenticated
  using (
    app.is_national()
    or (
      (community_work_id is not null or workpack_instance_id is not null)
      and (community_work_id is null or app.can_read_work(community_work_id))
      and (workpack_instance_id is null or exists (
             select 1 from uto.workpack_instances w
             where w.id = workpack_instance_id and uto.in_town(w.town_id)))
    )
  )
  with check (
    app.is_national()
    or (
      (community_work_id is not null or workpack_instance_id is not null)
      and (community_work_id is null or app.can_write_work(community_work_id))
      and (workpack_instance_id is null or exists (
             select 1 from uto.workpack_instances w
             where w.id = workpack_instance_id and uto.in_town(w.town_id)))
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Foreign key closure
-- ---------------------------------------------------------------------------
-- Pre-checked before running: uto.proofs held 0 rows, 0 non-null
-- community_work_id values, 0 orphans. Validation cannot fail or block.
alter table uto.proofs validate constraint proofs_community_work_fk;

-- ---------------------------------------------------------------------------
-- 5. Audit consequence
-- ---------------------------------------------------------------------------
create or replace function app.tg_work_audit()
returns trigger
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_actor  uuid;
  v_before jsonb;
  v_after  jsonb;
begin
  -- Only material events: creation, and genuine status transitions.
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;

  -- Defensive: never let an FK violation here roll back a legitimate transition.
  select u.id into v_actor from uto.users u where u.id = auth.uid();

  v_before := case when tg_op = 'UPDATE' then jsonb_build_object(
    'status', old.status, 'visibility', old.visibility,
    'approved_at', old.approved_at, 'published_at', old.published_at) end;

  v_after := jsonb_build_object(
    'status', new.status, 'visibility', new.visibility, 'town_id', new.town_id,
    'type', new.type, 'title', new.title, 'approved_at', new.approved_at,
    'published_at', new.published_at, 'rejection_reason', new.rejection_reason,
    'claimed_uid', auth.uid());

  -- Approval is atomic with publication (tg_work_guard rewrites the status),
  -- so the decision is recorded explicitly alongside its effect.
  if new.approved_at is not null and (tg_op = 'INSERT' or old.approved_at is null) then
    insert into uto.audit_logs(actor_id, action, entity_type, entity_id, before, after)
    values (v_actor, 'work.approved', 'uto.community_work', new.id, v_before, v_after);
  end if;

  insert into uto.audit_logs(actor_id, action, entity_type, entity_id, before, after)
  values (v_actor, 'work.' || new.status::text, 'uto.community_work', new.id, v_before, v_after);

  return null;
end
$fn$;

comment on function app.tg_work_audit() is
  'Audit consequence of community_work state transitions. Fires after work_after '
  '(alphabetical trigger order). Does not alter state machine semantics.';

drop trigger if exists work_audit on uto.community_work;
create trigger work_audit
  after insert or update on uto.community_work
  for each row execute function app.tg_work_audit();

commit;

-- =============================================================================
-- VALIDATION — executed against production, all 15 assertions passed
-- =============================================================================
-- Personas: real coordinators in two different towns, the single national
-- admin, and an authenticated user holding no role. Executed inside a
-- transaction and rolled back; zero residue confirmed afterwards.
--
--  T01 coordinator attaches proof to own-town work ............ inserted ok
--  T02 coordinator attaches proof to other town's work ........ denied 42501
--  T03 coordinator reads other town's proof ................... 0 rows visible
--  T04 coordinator re-parents proof to unauthorised work ...... denied 42501
--  T05 proof inserted with no parent .......................... denied 42501
--  T06 coordinator submits own draft .......................... 1 row
--  T07 coordinator forces draft -> approved ................... illegal transition
--  T08 coordinator forces draft -> published .................. illegal transition
--  T09 no-role user changes status ............................ 0 rows affected
--  T10 coordinator inserts into work_approvals ................ denied 42501
--  T11 national approves submitted work ....................... final status published
--  T12 approval record generated by trigger ................... 1 row
--  T13 publish_outbox consequence ............................. 4 rows
--  T14-17 audit trail ......... work.submitted > work.approved > work.published
--  T14-17b audit actor attribution ............................ 3 of 3 attributed
--
-- =============================================================================
-- ROLLBACK
-- =============================================================================
-- begin;
-- drop trigger if exists work_audit on uto.community_work;
-- drop function if exists app.tg_work_audit();
-- drop policy if exists proofs_parent_integrity on uto.proofs;
-- drop policy if exists proofs_cw_update on uto.proofs;
-- drop policy if exists proofs_cw_insert on uto.proofs;
-- drop policy if exists proofs_cw_read on uto.proofs;
-- revoke insert, update on table uto.proofs from authenticated;
-- -- The FK validation is intentionally NOT reversed: it asserts a true fact
-- -- about the data and reverting it would only restore a latent defect.
-- commit;
-- =============================================================================
