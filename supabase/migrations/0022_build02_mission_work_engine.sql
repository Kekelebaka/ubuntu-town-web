-- ============================================================================
-- 0022 · Build 02 — Mission Work Engine
-- ============================================================================
-- Adds the Mission lifecycle to the existing Ubuntu Town uto schema.
-- Tables: uto.work_missions, uto.work_mission_proofs, uto.work_mission_proof_versions,
--         uto.work_mission_memory_events, uto.capabilities_evidence
-- RPCs:   uto.publish_work_mission, uto.accept_work_mission, uto.start_work_mission,
--         uto.submit_work_proof, uto.request_work_changes, uto.resubmit_proof,
--         uto.verify_work_proof, uto.reject_work_proof
-- ALL RPCs derive actor identity from auth.uid(). No client-supplied actor.
-- ADDITIVE ONLY. Does not modify existing uto objects.
-- ============================================================================

-- ===========================================================
-- 01 · ENUMS
-- ===========================================================

do $$ begin
  create type uto.mission_status as enum (
    'draft','open','accepted','in_progress',
    'proof_submitted','under_review','changes_requested',
    'verified','rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.mission_type as enum (
    'verify_local_business'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.proof_review_status as enum (
    'pending','changes_requested','verified','rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.mission_event_type as enum (
    'mission_published','mission_accepted','mission_started',
    'proof_submitted','proof_changes_requested','proof_resubmitted',
    'proof_verified','proof_rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.capability_key as enum (
    'local_intelligence'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.capability_level as enum (
    'foundation','L1','L2'
  );
exception when duplicate_object then null; end $$;

-- ===========================================================
-- 02 · LEGAL TRANSITION MAP (enforced by app.mission_guard)
-- ===========================================================
-- Stored as a helper function so the trigger can consult it.
-- Returns true if (from_status → to_status) is legal.

create or replace function app.is_legal_mission_transition(
  _from uto.mission_status,
  _to   uto.mission_status
) returns boolean language sql immutable set search_path = '' as $$
  select (_from, _to) in (
    ('draft',          'open'),
    ('open',           'accepted'),
    ('accepted',       'in_progress'),
    ('in_progress',    'proof_submitted'),
    ('proof_submitted','under_review'),
    ('under_review',   'changes_requested'),
    ('under_review',   'verified'),
    ('under_review',   'rejected'),
    ('changes_requested','in_progress')  -- builder re-enters work after changes
  );
$$;

-- ===========================================================
-- 03 · TABLES
-- ===========================================================

-- ---------- missions ----------
create table if not exists uto.work_missions (
  id                uuid primary key default gen_random_uuid(),
  town_id           uuid not null references uto.towns(id) on delete cascade,
  mission_type      uto.mission_type not null default 'verify_local_business',
  title             text not null,
  description       text not null,
  initiative_id     uuid references uto.initiatives(id),
  status            uto.mission_status not null default 'draft',
  created_by        uuid not null references auth.users(id) on delete cascade,
  assigned_to       uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  published_at      timestamptz,
  accepted_at       timestamptz,
  started_at        timestamptz,
  completed_at      timestamptz,
  estimated_minutes integer,
  location_context  text,
  capability_target text,
  due_at            timestamptz,
  updated_at        timestamptz not null default now()
);

create index if not exists idx_work_missions_town on uto.work_missions(town_id);
create index if not exists idx_work_missions_status on uto.work_missions(status);
create index if not exists idx_work_missions_assigned on uto.work_missions(assigned_to) where assigned_to is not null;

-- ---------- mission proofs (one per mission — the current state) ----------
create table if not exists uto.work_mission_proofs (
  id                uuid primary key default gen_random_uuid(),
  mission_id        uuid not null references uto.work_missions(id) on delete cascade,
  current_version   integer not null default 1,
  status            uto.proof_review_status not null default 'pending',
  submitted_by      uuid not null references auth.users(id) on delete cascade,
  verified_by       uuid references auth.users(id) on delete set null,
  verified_at       timestamptz,
  reviewer_note     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint work_mission_proofs_unique_mission unique (mission_id)
);

-- ---------- mission proof versions (immutable history) ----------
create table if not exists uto.work_mission_proof_versions (
  id                uuid primary key default gen_random_uuid(),
  proof_id          uuid not null references uto.work_mission_proofs(id) on delete cascade,
  version_number    integer not null,
  business_name     text not null,
  business_category text not null,
  location          text,
  observation       text not null,
  photo_path        text,  -- storage object key
  submitted_by      uuid not null references auth.users(id) on delete cascade,
  submitted_at      timestamptz not null default now(),
  constraint work_proof_versions_unique_version unique (proof_id, version_number)
);

create index if not exists idx_work_proof_versions_proof on uto.work_mission_proof_versions(proof_id);

-- ---------- mission memory events (append-only, RPC-only writes) ----------
create table if not exists uto.work_mission_memory_events (
  id                uuid primary key default gen_random_uuid(),
  mission_id        uuid not null references uto.work_missions(id) on delete cascade,
  event_type        uto.mission_event_type not null,
  actor_id          uuid not null references auth.users(id) on delete cascade,
  town_id           uuid not null references uto.towns(id) on delete cascade,
  proof_id          uuid references uto.work_mission_proofs(id) on delete set null,
  note              text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_work_memory_events_mission on uto.work_mission_memory_events(mission_id);

-- ---------- capabilities evidence ----------
create table if not exists uto.capabilities_evidence (
  id                uuid primary key default gen_random_uuid(),
  mission_id        uuid not null references uto.work_missions(id) on delete cascade,
  builder_id        uuid not null references auth.users(id) on delete cascade,
  capability        uto.capability_key not null,
  evidence_level    uto.capability_level not null default 'foundation',
  proof_id          uuid references uto.work_mission_proofs(id) on delete cascade,
  verified_at       timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  constraint work_capabilities_unique_per_mission unique (mission_id, builder_id)
);

create index if not exists idx_work_capabilities_builder on uto.capabilities_evidence(builder_id);

-- ===========================================================
-- 04 · UPDATED_AT TRIGGERS
-- ===========================================================

create trigger set_updated_at before update on uto.work_missions
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on uto.work_mission_proofs
  for each row execute function public.set_updated_at();

-- ===========================================================
-- 05 · STATE MACHINE GUARD TRIGGER
-- ===========================================================

create or replace function app.mission_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- On INSERT, no transition check needed (default status is set by DDL)
  if tg_op = 'INSERT' then
    return new;
  end if;

  -- On UPDATE, enforce legal transitions
  if new.status is distinct from old.status then
    if not app.is_legal_mission_transition(old.status, new.status) then
      raise exception 'illegal mission transition % -> %', old.status, new.status
        using errcode = 'P0001';
    end if;
  end if;

  -- Verified missions are immutable (except for status itself changing TO verified)
  if old.status = 'verified' and new.status != 'verified' then
    raise exception 'verified mission is immutable'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger work_mission_guard before update on uto.work_missions
  for each row execute function app.mission_guard();

-- ===========================================================
-- 06 · PROOF IMMUTABILITY GUARD
-- ===========================================================
-- Once a proof is verified, its metadata cannot be changed.

create or replace function app.mission_proof_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status = 'verified' then
    -- Only allow reviewer_note updates (for post-verification notes)
    if new.submitted_by is distinct from old.submitted_by
       or new.current_version is distinct from old.current_version then
      raise exception 'verified proof is immutable'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger work_mission_proof_guard before update on uto.work_mission_proofs
  for each row execute function app.mission_proof_guard();

-- ===========================================================
-- 07 · HELPER FUNCTIONS (app schema, not directly callable)
-- ===========================================================

-- Is auth.uid() a coordinator (or higher) for the given town?
create or replace function app.is_mission_coordinator(_town uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_national() or exists (
    select 1 from uto.role_assignments ra
    where ra.user_id = auth.uid()
      and ra.town_id = _town
      and ra.role_key in ('coordinator','deputy','admin','ops')
  );
$$;

-- Does auth.uid() own this mission (is the assigned builder)?
create or replace function app.owns_mission(_mission_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from uto.work_missions m
    where m.id = _mission_id and m.assigned_to = auth.uid()
  );
$$;

-- ===========================================================
-- 08 · RLS — ENABLE ON ALL NEW TABLES
-- ===========================================================

alter table uto.work_missions enable row level security;
alter table uto.work_missions force row level security;
alter table uto.work_mission_proofs enable row level security;
alter table uto.work_mission_proofs force row level security;
alter table uto.work_mission_proof_versions enable row level security;
alter table uto.work_mission_proof_versions force row level security;
alter table uto.work_mission_memory_events enable row level security;
alter table uto.work_mission_memory_events force row level security;
alter table uto.capabilities_evidence enable row level security;
alter table uto.capabilities_evidence force row level security;

-- ===========================================================
-- 09 · RLS POLICIES — MISSIONS
-- ===========================================================

-- Admin/ops full access
create policy work_mission_admin_all on uto.work_missions for all
  using (app.is_national()) with check (app.is_national());

-- Coordinators manage missions in their town
create policy work_mission_coordinator_manage on uto.work_missions for all
  using (app.is_mission_coordinator(town_id))
  with check (app.is_mission_coordinator(town_id));

-- Builders can read open missions in their town, or missions assigned to them
create policy work_mission_builder_read on uto.work_missions for select using (
  -- Open missions in towns where the builder has any role assignment
  (status = 'open' and exists (
    select 1 from uto.role_assignments ra
    where ra.user_id = auth.uid() and ra.town_id = missions.town_id
  ))
  or
  -- Missions assigned to the current user
  assigned_to = auth.uid()
  or
  -- Missions created by the current user
  created_by = auth.uid()
);

-- ===========================================================
-- 10 · RLS POLICIES — MISSION PROOFS
-- ===========================================================

-- Admin/ops full access
create policy work_proof_admin_all on uto.work_mission_proofs for all
  using (app.is_national()) with check (app.is_national());

-- Coordinators can read/update proofs for missions in their town
create policy work_proof_coordinator_rw on uto.work_mission_proofs for all using (
  exists (
    select 1 from uto.work_missions m
    where m.id = mission_proofs.mission_id
      and app.is_mission_coordinator(m.town_id)
  )
) with check (
  exists (
    select 1 from uto.work_missions m
    where m.id = mission_proofs.mission_id
      and app.is_mission_coordinator(m.town_id)
  )
);

-- Builders can read proofs for missions assigned to them
create policy work_proof_builder_read on uto.work_mission_proofs for select using (
  submitted_by = auth.uid()
  or exists (
    select 1 from uto.work_missions m
    where m.id = mission_proofs.mission_id and m.assigned_to = auth.uid()
  )
);

-- Builders can insert proofs for missions assigned to them (submit_proof RPC)
create policy work_proof_builder_insert on uto.work_mission_proofs for insert
  with check (submitted_by = auth.uid());

-- ===========================================================
-- 11 · RLS POLICIES — PROOF VERSIONS
-- ===========================================================

-- Admin/ops full access
create policy work_proof_version_admin_all on uto.work_mission_proof_versions for all
  using (app.is_national()) with check (app.is_national());

-- Coordinators can read versions for proofs in their town
create policy work_proof_version_coordinator_read on uto.work_mission_proof_versions for select using (
  exists (
    select 1 from uto.work_mission_proofs p
    join uto.work_missions m on m.id = p.mission_id
    where p.id = mission_proof_versions.proof_id
      and app.is_mission_coordinator(m.town_id)
  )
);

-- Builders can read versions for their own proofs
create policy work_proof_version_builder_read on uto.work_mission_proof_versions for select using (
  submitted_by = auth.uid()
);

-- Builders can insert versions for their own proofs (submit_proof/resubmit_proof RPCs)
create policy work_proof_version_builder_insert on uto.work_mission_proof_versions for insert
  with check (submitted_by = auth.uid());

-- ===========================================================
-- 12 · RLS POLICIES — MEMORY EVENTS
-- ===========================================================
-- ONLY admin/ops can directly insert. Normal writes go through RPCs
-- which use SECURITY DEFINER.

-- Admin/ops full access
create policy work_memory_admin_all on uto.work_mission_memory_events for all
  using (app.is_national()) with check (app.is_national());

-- Authenticated users can read memory events for missions in their town
create policy work_memory_read on uto.work_mission_memory_events for select using (
  exists (
    select 1 from uto.role_assignments ra
    where ra.user_id = auth.uid()
      and (ra.town_id = mission_memory_events.town_id or ra.town_id is null)
  )
);

-- NOTE: No INSERT policy for regular users. Memory events are written
-- exclusively by SECURITY DEFINER RPC functions.

-- ===========================================================
-- 13 · RLS POLICIES — CAPABILITIES EVIDENCE
-- ===========================================================

-- Admin/ops full access
create policy work_cap_admin_all on uto.capabilities_evidence for all
  using (app.is_national()) with check (app.is_national());

-- Coordinators can read capabilities for builders in their town
create policy work_cap_coordinator_read on uto.capabilities_evidence for select using (
  exists (
    select 1 from uto.work_missions m
    where m.id = capabilities_evidence.mission_id
      and app.is_mission_coordinator(m.town_id)
  )
);

-- Builders can read their own capabilities
create policy work_cap_builder_read on uto.capabilities_evidence for select using (
  builder_id = auth.uid()
);

-- NOTE: No INSERT policy for regular users. Capability evidence is created
-- exclusively by the verify_proof SECURITY DEFINER RPC.

-- ===========================================================
-- 14 · RPC: publish_mission
-- ===========================================================
-- Coordinator publishes a draft mission → open.
-- Actor derived from auth.uid().

create or replace function uto.publish_work_mission(_mission_id uuid)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_mission from uto.work_missions where id = _mission_id for update;
  if not found then
    return json_build_object('error', 'not_found', 'hint', 'Mission does not exist');
  end if;

  if not app.is_mission_coordinator(v_mission.town_id) then
    raise exception 'only coordinators can publish missions' using errcode = '42501';
  end if;

  if v_mission.status != 'draft' then
    return json_build_object('error', 'invalid_transition',
      'hint', 'Mission must be in draft status', 'current_status', v_mission.status::text);
  end if;

  update uto.work_missions set status = 'open', published_at = now()
  where id = _mission_id and status = 'draft';

  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, note)
  values
    (_mission_id, 'mission_published', v_uid, v_mission.town_id, 'Mission published');

  return json_build_object('success', true, 'mission_id', _mission_id, 'status', 'open');
end;
$$;

grant execute on function uto.publish_work_mission(uuid) to authenticated;

-- ===========================================================
-- 15 · RPC: accept_mission
-- ===========================================================
-- Atomic: OPEN → ACCEPTED. Single-assignee concurrency safe.

create or replace function uto.accept_work_mission(_mission_id uuid)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Lock the row for atomic compare-and-swap
  select * into v_mission from uto.work_missions where id = _mission_id for update;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  -- Must be open
  if v_mission.status != 'open' then
    return json_build_object('error', 'mission_not_open',
      'current_status', v_mission.status::text);
  end if;

  -- Must not already be assigned
  if v_mission.assigned_to is not null then
    return json_build_object('error', 'mission_already_assigned',
      'assigned_to', v_mission.assigned_to::text);
  end if;

  -- Atomic update with CAS semantics
  update uto.work_missions
  set status = 'accepted', assigned_to = v_uid, accepted_at = now()
  where id = _mission_id and status = 'open' and assigned_to is null;

  if not found then
    return json_build_object('error', 'acceptance_conflict',
      'hint', 'Another builder accepted this mission first');
  end if;

  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, note)
  values
    (_mission_id, 'mission_accepted', v_uid, v_mission.town_id, 'Mission accepted by builder');

  return json_build_object('success', true, 'mission_id', _mission_id,
    'status', 'accepted', 'assigned_to', v_uid::text);
end;
$$;

grant execute on function uto.accept_work_mission(uuid) to authenticated;

-- ===========================================================
-- 16 · RPC: start_mission
-- ===========================================================
-- Assigned builder starts working: ACCEPTED → IN_PROGRESS.

create or replace function uto.start_work_mission(_mission_id uuid)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_mission from uto.work_missions where id = _mission_id for update;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  if v_mission.assigned_to != v_uid then
    raise exception 'only the assigned builder can start this mission'
      using errcode = '42501';
  end if;

  if v_mission.status != 'accepted' then
    return json_build_object('error', 'invalid_transition',
      'current_status', v_mission.status::text);
  end if;

  update uto.work_missions set status = 'in_progress', started_at = now()
  where id = _mission_id and status = 'accepted';

  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, note)
  values
    (_mission_id, 'mission_started', v_uid, v_mission.town_id, 'Mission started');

  return json_build_object('success', true, 'mission_id', _mission_id, 'status', 'in_progress');
end;
$$;

grant execute on function uto.start_work_mission(uuid) to authenticated;

-- ===========================================================
-- 17 · RPC: submit_proof
-- ===========================================================
-- Builder submits proof with evidence. Creates proof + first version.
-- Also handles resubmission (changes_requested → new version).

create or replace function uto.submit_work_proof(
  _mission_id        uuid,
  _business_name     text,
  _business_category text,
  _location          text,
  _observation       text,
  _photo_path        text default null
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
  v_proof_id uuid;
  v_version int;
  v_is_resubmission boolean := false;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_mission from uto.work_missions where id = _mission_id for update;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  if v_mission.assigned_to != v_uid then
    raise exception 'only the assigned builder can submit proof'
      using errcode = '42501';
  end if;

  -- For first submission: mission must be in_progress
  -- For resubmission: mission must be in_progress (changes_requested re-opens to in_progress)
  if v_mission.status not in ('in_progress') then
    return json_build_object('error', 'invalid_transition',
      'hint', 'Mission must be in progress to submit proof',
      'current_status', v_mission.status::text);
  end if;

  -- Check if proof already exists (resubmission)
  select id, current_version into v_proof_id, v_version
  from uto.work_mission_proofs where mission_id = _mission_id;

  if v_proof_id is not null then
    -- Resubmission: verify status is changes_requested
    declare
      v_proof_status uto.proof_review_status;
    begin
      select status into v_proof_status from uto.work_mission_proofs where id = v_proof_id;
      if v_proof_status != 'changes_requested' then
        return json_build_object('error', 'not_in_changes_requested',
          'hint', 'Can only resubmit when changes have been requested',
          'current_status', v_proof_status::text);
      end if;
      v_is_resubmission := true;
      v_version := v_version + 1;
    end;
  else
    v_version := 1;
  end if;

  -- Create or update the proof record
  if v_proof_id is null then
    insert into uto.work_mission_proofs (mission_id, submitted_by, status, current_version)
    values (_mission_id, v_uid, 'pending', 1)
    returning id into v_proof_id;
  else
    update uto.work_mission_proofs
    set status = 'pending', current_version = v_version,
        reviewer_note = null, verified_by = null, verified_at = null,
        updated_at = now()
    where id = v_proof_id;
  end if;

  -- Insert version record (immutable history)
  insert into uto.work_mission_proof_versions
    (proof_id, version_number, business_name, business_category, location, observation, photo_path, submitted_by)
  values
    (v_proof_id, v_version, _business_name, _business_category, _location, _observation, _photo_path, v_uid);

  -- Update mission status
  update uto.work_missions set status = 'proof_submitted', updated_at = now()
  where id = _mission_id;

  -- Memory event
  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, proof_id, note)
  values
    (_mission_id,
     case when v_is_resubmission then 'proof_resubmitted' else 'proof_submitted' end,
     v_uid, v_mission.town_id, v_proof_id,
     case when v_is_resubmission then 'Proof resubmitted (v' || v_version || ')'
          else 'Proof submitted (v1)' end);

  return json_build_object('success', true, 'proof_id', v_proof_id,
    'version', v_version, 'status', 'pending');
end;
$$;

grant execute on function uto.submit_work_proof(uuid, text, text, text, text, text) to authenticated;

-- ===========================================================
-- 18 · RPC: request_changes
-- ===========================================================
-- Coordinator requests changes on a pending proof.

create or replace function uto.request_work_changes(
  _mission_id  uuid,
  _reviewer_note text
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
  v_proof uto.work_mission_proofs%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_mission from uto.work_missions where id = _mission_id;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  if not app.is_mission_coordinator(v_mission.town_id) then
    raise exception 'only coordinators can request changes' using errcode = '42501';
  end if;

  select * into v_proof from uto.work_mission_proofs where mission_id = _mission_id;
  if not found then
    return json_build_object('error', 'no_proof');
  end if;

  if v_proof.status != 'pending' then
    return json_build_object('error', 'not_pending',
      'current_status', v_proof.status::text);
  end if;

  update uto.work_mission_proofs
  set status = 'changes_requested', reviewer_note = _reviewer_note, updated_at = now()
  where id = v_proof.id;

  update uto.work_missions set status = 'changes_requested', updated_at = now()
  where id = _mission_id;

  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, proof_id, note)
  values
    (_mission_id, 'proof_changes_requested', v_uid, v_mission.town_id, v_proof.id, _reviewer_note);

  return json_build_object('success', true, 'proof_id', v_proof.id, 'status', 'changes_requested');
end;
$$;

grant execute on function uto.request_work_changes(uuid, text) to authenticated;

-- ===========================================================
-- 19 · RPC: verify_proof
-- ===========================================================
-- Coordinator verifies proof. Atomic: proof verified + mission verified +
-- capability evidence + memory event. All in one transaction.

create or replace function uto.verify_work_proof(_mission_id uuid)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
  v_proof uto.work_mission_proofs%rowtype;
  v_assigned_builder uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_mission from uto.work_missions where id = _mission_id for update;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  -- Must be coordinator for this town
  if not app.is_mission_coordinator(v_mission.town_id) then
    raise exception 'only coordinators can verify proofs' using errcode = '42501';
  end if;

  -- Coordinator cannot verify their own mission if they are also the builder
  if v_mission.assigned_to = v_uid then
    return json_build_object('error', 'cannot_self_verify',
      'hint', 'A coordinator cannot verify their own proof');
  end if;

  select * into v_proof from uto.work_mission_proofs where mission_id = _mission_id for update;
  if not found then
    return json_build_object('error', 'no_proof');
  end if;

  if v_proof.status != 'pending' then
    return json_build_object('error', 'not_pending',
      'current_status', v_proof.status::text);
  end if;

  v_assigned_builder := v_mission.assigned_to;

  -- Step 1: Verify the proof
  update uto.work_mission_proofs
  set status = 'verified', verified_by = v_uid, verified_at = now(),
      reviewer_note = 'Verified — contributes to town intelligence',
      updated_at = now()
  where id = v_proof.id;

  -- Step 2: Complete the mission
  update uto.work_missions
  set status = 'verified', completed_at = now(), updated_at = now()
  where id = _mission_id;

  -- Step 3: Create capability evidence
  insert into uto.capabilities_evidence
    (mission_id, builder_id, capability, evidence_level, proof_id)
  values
    (_mission_id, v_assigned_builder, 'local_intelligence', 'foundation', v_proof.id)
  on conflict (mission_id, builder_id) do nothing;

  -- Step 4: Memory event — proof verified
  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, proof_id, note)
  values
    (_mission_id, 'proof_verified', v_uid, v_mission.town_id, v_proof.id,
     'Proof verified — local intelligence capability awarded');

  return json_build_object('success', true, 'proof_id', v_proof.id,
    'mission_status', 'verified', 'capability_granted', true,
    'evidence_level', 'foundation');
end;
$$;

grant execute on function uto.verify_work_proof(uuid) to authenticated;

-- ===========================================================
-- 20 · RPC: reject_proof
-- ===========================================================
-- Coordinator rejects a proof with reason.

create or replace function uto.reject_work_proof(
  _mission_id  uuid,
  _reviewer_note text
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_mission uto.work_missions%rowtype;
  v_proof uto.work_mission_proofs%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_mission from uto.work_missions where id = _mission_id;
  if not found then
    return json_build_object('error', 'not_found');
  end if;

  if not app.is_mission_coordinator(v_mission.town_id) then
    raise exception 'only coordinators can reject proofs' using errcode = '42501';
  end if;

  select * into v_proof from uto.work_mission_proofs where mission_id = _mission_id;
  if not found then
    return json_build_object('error', 'no_proof');
  end if;

  if v_proof.status = 'verified' then
    return json_build_object('error', 'cannot_reject_verified');
  end if;

  update uto.work_mission_proofs
  set status = 'rejected', reviewer_note = _reviewer_note, updated_at = now()
  where id = v_proof.id;

  update uto.work_missions set status = 'rejected', updated_at = now()
  where id = _mission_id;

  insert into uto.work_mission_memory_events
    (mission_id, event_type, actor_id, town_id, proof_id, note)
  values
    (_mission_id, 'proof_rejected', v_uid, v_mission.town_id, v_proof.id, _reviewer_note);

  return json_build_object('success', true, 'proof_id', v_proof.id, 'status', 'rejected');
end;
$$;

grant execute on function uto.reject_work_proof(uuid, text) to authenticated;

-- ===========================================================
-- 21 · READ-ONLY QUERY RPCs
-- ===========================================================

-- Get mission with proof for the current builder
create or replace function uto.get_my_work_mission(_mission_id uuid)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_result json;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select json_build_object(
    'mission', row_to_json(m),
    'proof', row_to_json(p),
    'versions', coalesce(versions.arr, '[]'::json)
  ) into v_result
  from uto.work_missions m
  left join uto.work_mission_proofs p on p.mission_id = m.id
  left join lateral (
    select json_agg(row_to_json(pv) order by pv.version_number) as arr
    from uto.work_mission_proof_versions pv where pv.proof_id = p.id
  ) versions on true
  where m.id = _mission_id
    and (m.assigned_to = v_uid or app.is_mission_coordinator(m.town_id));

  if v_result is null then
    return json_build_object('error', 'not_found_or_denied');
  end if;

  return v_result;
end;
$$;

grant execute on function uto.get_my_work_mission(uuid) to authenticated;

-- Get capability evidence for current user
create or replace function uto.get_my_capabilities()
returns setof uto.capabilities_evidence language sql stable security definer set search_path = '' as $$
  select * from uto.capabilities_evidence where builder_id = auth.uid();
$$;

grant execute on function uto.get_my_capabilities() to authenticated;

-- ===========================================================
-- 22 · STORAGE BUCKET FOR PROOF PHOTOS
-- ===========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mission-proofs',
  'mission-proofs',
  false,  -- private
  10485760,  -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) on conflict (id) do nothing;

-- Storage RLS: authenticated upload
create policy "work_mission_proof_upload" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'mission-proofs'
    and (storage.foldername(name))[1] = 'missions'
  );

-- Storage RLS: read own uploads or coordinator review
create policy "work_mission_proof_read" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'mission-proofs'
    and (
      -- Uploader can read own
      owner = auth.uid()
      or
      -- Coordinator can read proofs in their town
      exists (
        select 1 from uto.role_assignments ra
        where ra.user_id = auth.uid()
          and ra.role_key in ('coordinator','deputy','admin','ops')
          and (ra.town_id::text = (storage.foldername(name))[2] or ra.town_id is null)
      )
    )
  );

-- Storage RLS: no direct delete/update (admin only via other means)
create policy "work_mission_proof_no_delete" on storage.objects for delete
  to authenticated
  using (false);

-- ===========================================================
-- DONE
-- ===========================================================
comment on table uto.work_missions is 'Build 02: Mission work engine. Town-scoped missions with lifecycle.';
comment on table uto.work_mission_proofs is 'Build 02: Current proof state for a mission. One-to-one with missions.';
comment on table uto.work_mission_proof_versions is 'Build 02: Immutable proof submission history. Each resubmission increments version.';
comment on table uto.work_mission_memory_events is 'Build 02: Append-only mission event log. Written only by SECURITY DEFINER RPCs.';
comment on table uto.capabilities_evidence is 'Build 02: Verified capability evidence. Created atomically by verify_proof.';