-- 0022 · Living Town first durable loop
-- Additive, staging-first primitives for mission acceptance, proof submission,
-- independent review history, and evidence-derived capability.

begin;

create table if not exists uto.mission_acceptances (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references uto.missions(id),
  builder_id uuid not null references auth.users(id),
  town_id uuid not null references uto.towns(id),
  work_id uuid not null references uto.community_work(id),
  status text not null default 'active' check (status in ('active','submitted','verified','returned','cancelled')),
  accepted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, builder_id, town_id),
  unique (work_id)
);

create index if not exists mission_acceptances_builder_idx
  on uto.mission_acceptances(builder_id, status, accepted_at desc);
create index if not exists mission_acceptances_town_idx
  on uto.mission_acceptances(town_id, status, accepted_at desc);

alter table uto.mission_acceptances enable row level security;

drop policy if exists mission_acceptances_read on uto.mission_acceptances;
create policy mission_acceptances_read on uto.mission_acceptances
  for select to authenticated
  using (builder_id = auth.uid() or app.has_town_scope(town_id) or app.is_national());

-- No direct insert/update path: authoritative RPCs own lifecycle and attribution.
revoke all on table uto.mission_acceptances from anon;
revoke insert, update, delete on table uto.mission_acceptances from authenticated;
grant select on table uto.mission_acceptances to authenticated;

create or replace function uto.accept_mission(_mission_id uuid, _town_id uuid)
returns table(acceptance_id uuid, work_id uuid, acceptance_status text)
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_uid uuid := auth.uid();
  v_mission uto.missions%rowtype;
  v_acceptance uto.mission_acceptances%rowtype;
  v_work_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from uto.role_assignments r
    where r.user_id = v_uid and r.town_id = _town_id
  ) and not app.is_national() then
    raise exception 'Mission is outside your town' using errcode = '42501';
  end if;

  select * into v_mission
  from uto.missions m
  where m.id = _mission_id and m.active and (m.town_id is null or m.town_id = _town_id);
  if not found then raise exception 'Mission unavailable' using errcode = 'P0002'; end if;
  if v_mission.work_type is null then
    raise exception 'Mission has no executable work type' using errcode = '22023';
  end if;

  select * into v_acceptance
  from uto.mission_acceptances a
  where a.mission_id = _mission_id and a.builder_id = v_uid and a.town_id = _town_id;
  if found then
    return query select v_acceptance.id, v_acceptance.work_id, v_acceptance.status;
    return;
  end if;

  insert into uto.community_work(type, town_id, coordinator_id, initiative, title, description, visibility, status, detail, created_by)
  values (
    v_mission.work_type, _town_id,
    case when exists(select 1 from uto.coordinators c where c.id = v_uid) then v_uid else null end,
    'Living Town Mission', regexp_replace(v_mission.title, '^[^[:alnum:]]+\\s*', ''),
    v_mission.description, 'internal', 'draft',
    jsonb_build_object('mission_id', v_mission.id, 'mission_key', v_mission.key, 'accepted_at', statement_timestamp()),
    v_uid
  ) returning id into v_work_id;

  insert into uto.work_assignments(work_id, assignee_id, assigned_by, status, note)
  values (v_work_id, v_uid, v_uid, 'open', 'Accepted from Living Town mission');

  insert into uto.mission_acceptances(mission_id, builder_id, town_id, work_id)
  values (_mission_id, v_uid, _town_id, v_work_id)
  returning * into v_acceptance;

  insert into uto.audit_logs(actor_id, action, entity_type, entity_id, after)
  select u.id, 'mission.accepted', 'uto.mission_acceptances', v_acceptance.id,
    jsonb_build_object('mission_id', _mission_id, 'town_id', _town_id, 'work_id', v_work_id)
  from uto.users u where u.id = v_uid;

  return query select v_acceptance.id, v_acceptance.work_id, v_acceptance.status;
exception when unique_violation then
  select * into v_acceptance from uto.mission_acceptances a
  where a.mission_id = _mission_id and a.builder_id = v_uid and a.town_id = _town_id;
  return query select v_acceptance.id, v_acceptance.work_id, v_acceptance.status;
end
$fn$;

create or replace function uto.create_proof_upload(_work_id uuid, _mime_type text, _bytes bigint, _notes text default null)
returns table(proof_id uuid, object_path text)
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_uid uuid := auth.uid();
  v_town uuid;
  v_assignee boolean;
  v_proof uuid := gen_random_uuid();
  v_media uuid := gen_random_uuid();
  v_ext text;
  v_path text;
  v_kind uto.media_kind;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select cw.town_id,
    (cw.created_by = v_uid or exists(select 1 from uto.work_assignments wa where wa.work_id=cw.id and wa.assignee_id=v_uid and wa.status='open'))
  into v_town, v_assignee from uto.community_work cw where cw.id=_work_id and cw.deleted_at is null;
  if v_town is null or not coalesce(v_assignee,false) then raise exception 'Work is not active for this Builder' using errcode='42501'; end if;
  if _mime_type not in ('image/jpeg','image/png','image/webp','image/heic','application/pdf') then
    raise exception 'Unsupported proof file type' using errcode='22023';
  end if;
  if _bytes is null or _bytes < 1 or _bytes > 15728640 then raise exception 'Proof file must be 15 MB or smaller' using errcode='22023'; end if;
  v_ext := case _mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' when 'image/heic' then 'heic' else 'pdf' end;
  v_kind := case when _mime_type like 'image/%' then 'image'::uto.media_kind else 'document'::uto.media_kind end;
  v_path := v_uid::text || '/' || v_town::text || '/' || _work_id::text || '/' || v_proof::text || '.' || v_ext;

  insert into uto.proofs(id, community_work_id, coordinator_id, kind, notes, status)
  values (v_proof, _work_id, case when exists(select 1 from uto.coordinators c where c.id=v_uid) then v_uid else null end, 'file', _notes, 'pending');
  insert into uto.media_assets(id,bucket,path,kind,mime_type,bytes,owner_type,owner_id,uploaded_by)
  values (v_media,'proofs',v_path,v_kind,_mime_type,_bytes,'proof',v_proof,v_uid);
  update uto.proofs set media_asset_id=v_media where id=v_proof;

  insert into uto.audit_logs(actor_id,action,entity_type,entity_id,after)
  select u.id,'proof.upload_reserved','uto.proofs',v_proof,jsonb_build_object('work_id',_work_id,'town_id',v_town,'path',v_path,'mime_type',_mime_type,'bytes',_bytes)
  from uto.users u where u.id=v_uid;
  return query select v_proof,v_path;
end
$fn$;

create or replace function uto.submit_proof(_proof_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $fn$
declare v_uid uuid:=auth.uid(); v_work uuid; v_path text; v_town uuid;
begin
  select p.community_work_id,ma.path,cw.town_id into v_work,v_path,v_town
  from uto.proofs p join uto.media_assets ma on ma.id=p.media_asset_id
  join uto.community_work cw on cw.id=p.community_work_id
  where p.id=_proof_id and ma.uploaded_by=v_uid and p.status='pending';
  if v_work is null then raise exception 'Proof unavailable' using errcode='42501'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='proofs' and o.name=v_path and o.owner=v_uid) then
    raise exception 'Upload must complete before submission' using errcode='23514';
  end if;
  update uto.community_work set status='submitted' where id=v_work and status in ('draft','rejected');
  update uto.work_assignments set status='done',completed_at=statement_timestamp() where work_id=v_work and assignee_id=v_uid and status='open';
  update uto.mission_acceptances set status='submitted',updated_at=statement_timestamp() where work_id=v_work and builder_id=v_uid;
  insert into uto.audit_logs(actor_id,action,entity_type,entity_id,after)
  select u.id,'proof.submitted','uto.proofs',_proof_id,jsonb_build_object('work_id',v_work,'town_id',v_town) from uto.users u where u.id=v_uid;
end
$fn$;

create table if not exists uto.proof_reviews (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references uto.proofs(id),
  reviewer_id uuid not null references auth.users(id),
  decision uto.proof_status not null check (decision in ('approved','returned','rejected')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists proof_reviews_proof_idx on uto.proof_reviews(proof_id,created_at desc);
alter table uto.proof_reviews enable row level security;
drop policy if exists proof_reviews_read on uto.proof_reviews;
create policy proof_reviews_read on uto.proof_reviews for select to authenticated
using (reviewer_id=auth.uid() or exists(select 1 from uto.proofs p where p.id=proof_id and app.can_read_work(p.community_work_id)));
revoke all on table uto.proof_reviews from anon;
revoke insert,update,delete on table uto.proof_reviews from authenticated;
grant select on table uto.proof_reviews to authenticated;

create or replace function uto.review_proof(_proof_id uuid,_decision uto.proof_status,_note text default null)
returns void
language plpgsql
security definer
set search_path to ''
as $fn$
declare v_uid uuid:=auth.uid(); v_work uuid; v_town uuid; v_creator uuid; v_uploader uuid;
begin
  if _decision not in ('approved','returned','rejected') then raise exception 'Invalid decision' using errcode='22023'; end if;
  select p.community_work_id,cw.town_id,cw.created_by,ma.uploaded_by into v_work,v_town,v_creator,v_uploader
  from uto.proofs p join uto.community_work cw on cw.id=p.community_work_id left join uto.media_assets ma on ma.id=p.media_asset_id
  where p.id=_proof_id and p.status='pending';
  if v_work is null then raise exception 'Proof unavailable' using errcode='P0002'; end if;
  if not (app.is_national() or exists(select 1 from uto.role_assignments r where r.user_id=v_uid and r.town_id=v_town and r.role_key::text in ('admin','ops','deputy'))) then raise exception 'Reviewer authority required' using errcode='42501'; end if;
  if v_uid in (v_creator,v_uploader) or exists(select 1 from uto.work_assignments wa where wa.work_id=v_work and wa.assignee_id=v_uid) then raise exception 'Independent reviewer required' using errcode='42501'; end if;
  if _decision in ('returned','rejected') and nullif(btrim(_note),'') is null then raise exception 'Review note required' using errcode='22023'; end if;

  -- The existing staging review trigger remains the first authority for
  -- reviewer independence, attribution, and timestamp. This RPC adds history.
  update uto.proofs set status=_decision,reviewed_by=v_uid,reviewed_at=statement_timestamp() where id=_proof_id;
  insert into uto.proof_reviews(proof_id,reviewer_id,decision,note) values(_proof_id,v_uid,_decision,_note);
  if _decision='approved' then
    update uto.community_work set status='approved' where id=v_work and status in ('submitted','in_review');
    update uto.mission_acceptances set status='verified',updated_at=statement_timestamp() where work_id=v_work;
  else
    update uto.community_work set status='rejected',rejection_reason=_note where id=v_work and status in ('submitted','in_review');
    update uto.mission_acceptances set status='returned',updated_at=statement_timestamp() where work_id=v_work;
  end if;
  insert into uto.audit_logs(actor_id,action,entity_type,entity_id,after)
  select u.id,'proof.'||_decision::text,'uto.proofs',_proof_id,jsonb_build_object('work_id',v_work,'town_id',v_town,'decision',_decision,'note',_note) from uto.users u where u.id=v_uid;
end
$fn$;

create or replace function uto.my_living_town_capability()
returns table(level integer,label text,verified_missions bigint,next_level_verified_missions integer)
language sql
stable
security definer
set search_path to ''
as $fn$
with c as (
  select count(*)::bigint n from uto.mission_acceptances a
  where a.builder_id=auth.uid() and a.status='verified'
), l as (
  select n,case when n>=20 then 5 when n>=12 then 4 when n>=7 then 3 when n>=3 then 2 when n>=1 then 1 else 0 end lvl from c
)
select lvl,
 case lvl when 0 then 'Explorer' when 1 then 'Contributor' when 2 then 'Operator' when 3 then 'Specialist' when 4 then 'Town Steward' else 'Builder' end,
 n,
 case lvl when 0 then 1 when 1 then 3 when 2 then 7 when 3 then 12 when 4 then 20 else 20 end
from l;
$fn$;

-- Uploads must match an RPC-reserved metadata path; no arbitrary object names.
drop policy if exists proofs_insert_own on storage.objects;
create policy proofs_insert_reserved on storage.objects for insert to authenticated
with check (
  bucket_id='proofs' and owner=auth.uid() and exists(
    select 1 from uto.media_assets ma join uto.proofs p on p.id=ma.owner_id
    where ma.path=objects.name and ma.uploaded_by=auth.uid() and ma.bucket='proofs' and p.status='pending'
  )
);

-- Once work is submitted, its evidence object cannot be replaced or deleted.
drop policy if exists proofs_update_own on storage.objects;
create policy proofs_update_pending_own on storage.objects for update to authenticated
using (bucket_id='proofs' and owner=auth.uid() and exists(select 1 from uto.media_assets ma join uto.proofs p on p.id=ma.owner_id where ma.path=objects.name and p.status='pending'))
with check (bucket_id='proofs' and owner=auth.uid() and exists(select 1 from uto.media_assets ma join uto.proofs p on p.id=ma.owner_id where ma.path=objects.name and p.status='pending'));
drop policy if exists proofs_delete_own on storage.objects;

revoke all on function uto.accept_mission(uuid,uuid) from public;
revoke all on function uto.create_proof_upload(uuid,text,bigint,text) from public;
revoke all on function uto.submit_proof(uuid) from public;
revoke all on function uto.review_proof(uuid,uto.proof_status,text) from public;
revoke all on function uto.my_living_town_capability() from public;
grant execute on function uto.accept_mission(uuid,uuid),uto.create_proof_upload(uuid,text,bigint,text),uto.submit_proof(uuid),uto.review_proof(uuid,uto.proof_status,text),uto.my_living_town_capability() to authenticated;

commit;
