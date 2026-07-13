-- =====================================================================
-- Ubuntu Town — Community Work PUBLISHING SPINE, layered onto the live `uto` schema
-- Target: the ACTIVE Supabase project `ubuntu-town-os` (Postgres 17)
-- Purpose: add the missing content/publishing layer (visibility, approval
--          state-machine, publish fan-out, per-town RLS) WITHOUT duplicating
--          uto's populated reference tables. References uto.towns / uto.coordinators.
--
-- ADDITIVE ONLY. Creates new objects in the `uto` schema; alters two uto tables
-- with new nullable columns. Does not drop or modify existing uto data.
-- NOT YET APPLIED — review, then run via your migration tooling.
--
-- ── PRECONDITIONS (confirm before running) ───────────────────────────
-- 1. IDENTITY MIRROR: uto.users.id == auth.users.id (Supabase auth id).
--    RLS resolves the caller via uto.role_assignments.user_id = auth.uid().
--    If uto.users is decoupled from auth, add a mapping and change the
--    created_by / approved_by FKs to reference uto.users(id).
-- 2. PK TYPES: assumes uto.towns.id, uto.coordinators.id, uto.media_assets.id,
--    uto.proofs.id are uuid. If any are bigint, change the matching FK types.
-- 3. EXTENSIONS: enables pgvector only. Uses built-in FTS. No PostGIS
--    (lat/lng doubles instead) to keep the live-DB footprint light.
-- 4. RLS COEXISTENCE: uto already ran an rls_rbac migration. This adds RLS to
--    NEW tables only and puts helpers in a private `app` schema — it does not
--    touch existing uto policies. If uto already has a role-resolution helper,
--    prefer reusing it over app.* below.
-- 5. APPROVAL TIERS map to uto roles: admin/ops = national (3),
--    coordinator/deputy = town (1). uto has no regional (2) tier yet, so PUBLIC
--    content requires national sign-off unless uto.towns.public_self_approve=true.
-- =====================================================================


-- ===========================================================
-- 01 · EXTENSIONS, PRIVATE SCHEMA & CONTENT ENUMS (in uto)
-- ===========================================================
create extension if not exists vector;      -- pgvector (semantic search)
create schema if not exists app;             -- private helper schema (not exposed)

do $$ begin
  create type uto.work_visibility as enum ('public','internal','national');
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.work_status as enum
    ('draft','submitted','in_review','approved','published','rejected','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.work_type as enum (
    'business','fixeasy_worker','familyhouse','event','podcast','tourism_asset',
    'story','volunteer','job','school','church','farmer','photo',
    'infrastructure_issue','meeting','partner','training','incident');
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.work_action as enum
    ('created','submitted','review_started','approved','rejected','published',
     'unpublished','archived','edited');
exception when duplicate_object then null; end $$;


-- ===========================================================
-- 02 · SMALL ADDITIVE ALTERS ON EXISTING uto TABLES
-- ===========================================================
-- lets a steward publish their own town's PUBLIC content without national sign-off
alter table uto.towns  add column if not exists public_self_approve boolean not null default false;
-- attach a content item to an existing proof (keeps uto.proofs as the proof store)
alter table uto.proofs add column if not exists community_work_id uuid;


-- ===========================================================
-- 03 · ACCESS HELPERS (read uto.role_assignments; no RLS recursion)
-- ===========================================================
create or replace function app.uto_rank(_r uto.role_key)
returns int language sql immutable set search_path = '' as $$
  select case _r when 'admin' then 3 when 'ops' then 3
                 when 'coordinator' then 1 when 'deputy' then 1
                 else 0 end;
$$;

create or replace function app.is_national()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from uto.role_assignments ra
    where ra.user_id = auth.uid() and ra.role_key in ('admin','ops') and ra.town_id is null);
$$;

-- may the caller steward/administer this town? (write + read internal)
create or replace function app.has_town_scope(_town uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_national()
    or exists (
      select 1 from uto.role_assignments ra
      where ra.user_id = auth.uid() and ra.town_id = _town
        and ra.role_key in ('coordinator','deputy','ops','admin'));
$$;

-- highest rank the caller holds for this town
create or replace function app.rank_for_town(_town uuid)
returns int language sql stable security definer set search_path = '' as $$
  select greatest(
    case when app.is_national() then 3 else 0 end,
    coalesce((select max(app.uto_rank(ra.role_key)) from uto.role_assignments ra
              where ra.user_id = auth.uid() and ra.town_id = _town), 0));
$$;

-- rank required to APPROVE work of a given visibility in a given town
create or replace function app.required_rank(_v uto.work_visibility, _town uuid)
returns int language sql stable security definer set search_path = '' as $$
  select case
    when _v = 'national' then 3
    when _v = 'public'   then case when (select public_self_approve from uto.towns where id = _town)
                                   then 1 else 3 end
    else 1 end;
$$;


-- ===========================================================
-- 04 · THE CONTENT OBJECT + TYPED DETAIL (in uto)
-- ===========================================================
create table if not exists uto.community_work (
  id             uuid primary key default gen_random_uuid(),
  type           uto.work_type not null,
  town_id        uuid not null references uto.towns(id),
  coordinator_id uuid references uto.coordinators(id),   -- operational owner (optional)
  initiative     text,                                   -- fixeasy24 | familyhouse | kasibuy | inside_town ...
  parent_id      uuid references uto.community_work(id) on delete set null,
  title          text not null,
  description    text,
  owner_ref      text,
  lat            double precision,
  lng            double precision,
  location_label text,
  tags           text[] not null default '{}',
  visibility     uto.work_visibility not null default 'internal',
  status         uto.work_status not null default 'draft',
  impact_score   numeric(6,2) not null default 0,
  detail         jsonb not null default '{}'::jsonb,
  ai_summary     text,
  embedding      vector(1536),                            -- set to your model dim (gte-small=384)
  fts            tsvector,   -- maintained by tg_work_guard ('simple' cfg isn't immutable enough for a generated column on this PG)
  created_by     uuid not null default auth.uid() references auth.users(id),
  approved_by    uuid references auth.users(id),
  submitted_at   timestamptz, approved_at timestamptz, published_at timestamptz,
  rejected_at    timestamptz, rejection_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index if not exists cw_town_idx       on uto.community_work(town_id);
create index if not exists cw_status_idx      on uto.community_work(status);
create index if not exists cw_type_idx        on uto.community_work(type);
create index if not exists cw_visibility_idx  on uto.community_work(visibility);
create index if not exists cw_created_by_idx  on uto.community_work(created_by);
create index if not exists cw_coordinator_idx on uto.community_work(coordinator_id);
create index if not exists cw_tags_idx        on uto.community_work using gin (tags);
create index if not exists cw_fts_idx         on uto.community_work using gin (fts);
create index if not exists cw_embedding_idx   on uto.community_work using hnsw (embedding vector_cosine_ops);
create index if not exists cw_public_idx on uto.community_work (town_id, published_at desc)
  where visibility in ('public','national') and status = 'published' and deleted_at is null;

-- now that the object exists, complete the proof link added in section 02
do $$ begin
  alter table uto.proofs
    add constraint proofs_community_work_fk
    foreign key (community_work_id) references uto.community_work(id) on delete set null not valid;
exception when duplicate_object then null; end $$;   -- NOT VALID: skips scanning existing proofs; validate later if desired

create table if not exists uto.work_fixeasy_worker (
  work_id uuid primary key references uto.community_work(id) on delete cascade,
  full_name text, skills text[] not null default '{}', years_experience int,
  whatsapp text, available boolean not null default true, hourly_rate_zar numeric(8,2),
  id_verified boolean not null default false, background_checked boolean not null default false
);

create table if not exists uto.work_familyhouse (
  work_id uuid primary key references uto.community_work(id) on delete cascade,
  rooms int, sleeps int, nightly_rate_zar numeric(8,2), amenities text[] not null default '{}',
  review_status text not null default 'pending',
  phone_verified boolean not null default false, photos_checked boolean not null default false,
  scout_checked boolean not null default false, safety_checklist_passed boolean not null default false,
  family_house_verified boolean not null default false, rejection_reason text
);

create table if not exists uto.work_business (
  work_id uuid primary key references uto.community_work(id) on delete cascade,
  category text, whatsapp text, phone text, address text, hours jsonb,
  kasibuy_enabled boolean not null default false
);

create table if not exists uto.work_event (
  work_id uuid primary key references uto.community_work(id) on delete cascade,
  starts_at timestamptz, ends_at timestamptz, venue text,
  is_free boolean not null default true, ticket_url text
);

create table if not exists uto.work_podcast (
  work_id uuid primary key references uto.community_work(id) on delete cascade,
  audio_r2_key text, duration_seconds int, transcript text, spotify_url text,
  guests text[] not null default '{}'
);

-- media link: reuse uto.media_assets where possible, or a direct storage path
create table if not exists uto.work_media (
  id            uuid primary key default gen_random_uuid(),
  work_id       uuid not null references uto.community_work(id) on delete cascade,
  media_asset_id uuid references uto.media_assets(id) on delete set null,
  storage_path  text,
  role          text not null default 'gallery',   -- cover | gallery | audio | document
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists work_media_work_idx on uto.work_media(work_id);


-- ===========================================================
-- 05 · CONTENT APPROVAL TRAIL + PUBLISHING (in uto)
-- ===========================================================
create table if not exists uto.work_approvals (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references uto.community_work(id) on delete cascade,
  actor       uuid references auth.users(id) default auth.uid(),
  action      uto.work_action not null,
  from_status uto.work_status, to_status uto.work_status,
  tier        int, note text,
  created_at  timestamptz not null default now()
);
create index if not exists work_approvals_work_idx on uto.work_approvals(work_id, created_at);

create table if not exists uto.publishing_rules (
  id         uuid primary key default gen_random_uuid(),
  work_type  uto.work_type, visibility uto.work_visibility not null,
  channel    text not null, enabled boolean not null default true
);

create table if not exists uto.publish_outbox (
  id           uuid primary key default gen_random_uuid(),
  work_id      uuid not null references uto.community_work(id) on delete cascade,
  channel      text not null, payload jsonb not null default '{}'::jsonb,
  status       text not null default 'pending', attempts int not null default 0, last_error text,
  created_at   timestamptz not null default now(), processed_at timestamptz
);
create index if not exists publish_outbox_status_idx on uto.publish_outbox(status, created_at);


-- ===========================================================
-- 06 · TRIGGERS — state machine + fan-out (on uto.community_work)
-- ===========================================================
create or replace function app.tg_work_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare req int;
begin
  new.updated_at := now();
  new.fts := setweight(to_tsvector('simple', coalesce(new.title,'')),      'A')
          || setweight(to_tsvector('simple', coalesce(new.description,'')), 'B')
          || setweight(to_tsvector('simple', array_to_string(new.tags,' ')), 'C');
  if tg_op = 'INSERT' then
    if new.created_by is null then new.created_by := auth.uid(); end if;
    if new.status is null then new.status := 'draft'; end if;
    if new.status not in ('draft','submitted') then
      raise exception 'community_work must start as draft or submitted (got %)', new.status;
    end if;
    if new.status = 'submitted' then new.submitted_at := now(); end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status='draft'     and new.status in ('submitted','archived')) or
      (old.status='submitted' and new.status in ('in_review','approved','rejected','draft','archived')) or
      (old.status='in_review' and new.status in ('approved','rejected','submitted')) or
      (old.status='approved'  and new.status in ('published','rejected','archived')) or
      (old.status='published' and new.status in ('archived')) or
      (old.status='rejected'  and new.status in ('draft','submitted','archived')) or
      (old.status='archived'  and new.status in ('draft'))
    ) then raise exception 'illegal status transition % -> %', old.status, new.status; end if;

    if new.status = 'approved' then
      req := app.required_rank(new.visibility, new.town_id);
      if app.rank_for_town(new.town_id) < req then
        raise exception 'approving % work here needs rank % (you have %)',
          new.visibility, req, app.rank_for_town(new.town_id);
      end if;
      new.approved_by := auth.uid(); new.approved_at := now();
      new.status := 'published'; new.published_at := now();   -- auto-publish; external channels async
    end if;
    if new.status = 'submitted' and new.submitted_at is null then new.submitted_at := now(); end if;
    if new.status = 'rejected' then new.rejected_at := now(); end if;
  end if;
  return new;
end $$;

drop trigger if exists work_guard on uto.community_work;
create trigger work_guard before insert or update on uto.community_work
for each row execute function app.tg_work_guard();

create or replace function app.tg_work_after()
returns trigger language plpgsql security definer set search_path = '' as $$
declare act uto.work_action; vis_list uto.work_visibility[];
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status then return null; end if;

  if new.approved_at is not null and (tg_op='INSERT' or old.approved_at is null) then
    insert into uto.work_approvals(work_id, actor, action, from_status, to_status, tier)
    values (new.id, auth.uid(), 'approved',
            case when tg_op='UPDATE' then old.status end, 'approved',
            app.rank_for_town(new.town_id));
  end if;

  act := case
    when tg_op='INSERT' and new.status='submitted' then 'submitted'
    when tg_op='INSERT' then 'created'
    when new.status='published' then 'published'
    when new.status='rejected' then 'rejected'
    when new.status='submitted' then 'submitted'
    when new.status='in_review' then 'review_started'
    when new.status='archived' then 'archived'
    else 'edited' end;

  insert into uto.work_approvals(work_id, actor, action, from_status, to_status, tier, note)
  values (new.id, auth.uid(), act,
          case when tg_op='UPDATE' then old.status end, new.status,
          app.rank_for_town(new.town_id), new.rejection_reason);

  if new.status='published' and (tg_op='INSERT' or old.status <> 'published') then
    vis_list := case new.visibility
      when 'national' then array['public','national']::uto.work_visibility[]
      when 'public'   then array['public']::uto.work_visibility[]
      else array['internal']::uto.work_visibility[] end;
    insert into uto.publish_outbox(work_id, channel, payload)
    select new.id, pr.channel,
           jsonb_build_object('work_id',new.id,'type',new.type,'town_id',new.town_id,'visibility',new.visibility)
    from uto.publishing_rules pr
    where pr.enabled and pr.visibility = any(vis_list)
      and (pr.work_type = new.type or pr.work_type is null);
    perform pg_notify('work_published', new.id::text);
  end if;
  return null;
end $$;

drop trigger if exists work_after on uto.community_work;
create trigger work_after after insert or update on uto.community_work
for each row execute function app.tg_work_after();


-- ===========================================================
-- 07 · ROW-LEVEL SECURITY (new tables only)
-- ===========================================================
create or replace function app.can_read_work(_work uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from uto.community_work w where w.id = _work and (
       (w.visibility in ('public','national') and w.status='published' and w.deleted_at is null)
    or w.created_by = auth.uid() or app.has_town_scope(w.town_id)));
$$;
create or replace function app.can_write_work(_work uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from uto.community_work w where w.id = _work and (
       app.has_town_scope(w.town_id)
    or (w.created_by = auth.uid() and w.status in ('draft','submitted','rejected'))));
$$;

alter table uto.community_work enable row level security;
create policy cw_read_public on uto.community_work for select to anon, authenticated
  using (visibility in ('public','national') and status='published' and deleted_at is null);
create policy cw_read_owner on uto.community_work for select to authenticated using (created_by = auth.uid());
create policy cw_read_scope on uto.community_work for select to authenticated using (app.has_town_scope(town_id));
create policy cw_insert_scope on uto.community_work for insert to authenticated
  with check (created_by = auth.uid() and app.has_town_scope(town_id));
create policy cw_insert_self on uto.community_work for insert to authenticated
  with check (created_by = auth.uid() and status in ('draft','submitted') and visibility <> 'national');
create policy cw_update_scope on uto.community_work for update to authenticated
  using (app.has_town_scope(town_id)) with check (app.has_town_scope(town_id));
create policy cw_update_owner on uto.community_work for update to authenticated
  using (created_by = auth.uid() and status in ('draft','submitted','rejected'))
  with check (created_by = auth.uid());
create policy cw_delete_admin on uto.community_work for delete to authenticated using (app.is_national());

-- typed detail / media: access mirrors the parent work row
do $$ declare t text;
begin
  foreach t in array array['work_fixeasy_worker','work_familyhouse','work_business','work_event','work_podcast','work_media']
  loop
    execute format('alter table uto.%I enable row level security;', t);
    execute format('drop policy if exists %I on uto.%I;', t||'_read', t);
    execute format($f$create policy %I on uto.%I for select to anon, authenticated using (app.can_read_work(work_id));$f$, t||'_read', t);
    execute format('drop policy if exists %I on uto.%I;', t||'_write', t);
    execute format($f$create policy %I on uto.%I for all to authenticated using (app.can_write_work(work_id)) with check (app.can_write_work(work_id));$f$, t||'_write', t);
  end loop;
end $$;

alter table uto.work_approvals enable row level security;
create policy wa_read on uto.work_approvals for select to authenticated
  using (exists (select 1 from uto.community_work w where w.id = work_id and (app.has_town_scope(w.town_id) or w.created_by = auth.uid())));

alter table uto.publishing_rules enable row level security;
create policy pr_read  on uto.publishing_rules for select to authenticated using (true);
create policy pr_admin on uto.publishing_rules for all    to authenticated using (app.is_national()) with check (app.is_national());

alter table uto.publish_outbox enable row level security;
create policy outbox_admin on uto.publish_outbox for select to authenticated using (app.is_national());


-- ===========================================================
-- 08 · GRANTS, REALTIME & HYBRID SEARCH RPC
-- ===========================================================
grant usage on schema uto to anon, authenticated;   -- required: schema-level access for the app + public page
grant usage on schema app to anon, authenticated;
grant execute on all functions in schema app to anon, authenticated;

grant select on uto.community_work, uto.work_fixeasy_worker, uto.work_familyhouse,
                uto.work_business, uto.work_event, uto.work_podcast, uto.work_media,
                uto.publishing_rules to anon, authenticated;
grant insert, update, delete on uto.community_work, uto.work_fixeasy_worker, uto.work_familyhouse,
                uto.work_business, uto.work_event, uto.work_podcast, uto.work_media to authenticated;
-- work_approvals & publish_outbox are written by triggers / the worker only
grant select on uto.work_approvals, uto.publish_outbox to authenticated;

do $$ begin
  alter publication supabase_realtime add table uto.community_work;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table uto.work_approvals;
exception when others then null; end $$;

-- Hybrid search (FTS + vector, RRF). Not security definer -> RLS applies.
create or replace function uto.search_community_work(
  q text, q_embedding vector(1536) default null, _town uuid default null, match_limit int default 20)
returns setof uto.community_work
language sql stable set search_path = uto, public, extensions as $$
  with kw as (
    select id, row_number() over (order by ts_rank(fts, websearch_to_tsquery('simple', q)) desc) rn
    from uto.community_work
    where q is not null and q <> '' and fts @@ websearch_to_tsquery('simple', q)
      and (_town is null or town_id = _town) limit 50),
  vec as (
    select id, row_number() over (order by embedding <=> q_embedding) rn
    from uto.community_work
    where q_embedding is not null and embedding is not null and (_town is null or town_id = _town)
    order by embedding <=> q_embedding limit 50),
  fused as (
    select coalesce(kw.id, vec.id) as id,
           coalesce(1.0/(60+kw.rn),0) + coalesce(1.0/(60+vec.rn),0) as score
    from kw full outer join vec on kw.id = vec.id)
  select w.* from fused f join uto.community_work w on w.id = f.id
  order by f.score desc limit match_limit;
$$;
grant execute on function uto.search_community_work(text, vector, uuid, int) to anon, authenticated;


-- ===========================================================
-- 09 · SEED PUBLISHING RULES (uto)
-- ===========================================================
insert into uto.publishing_rules(work_type, visibility, channel) values
  (null,'public','town_page'), (null,'public','search'), (null,'public','ai_index'), (null,'public','coordinator_dashboard'),
  (null,'national','national_portal'), (null,'national','ubuntu_town_news'), (null,'national','national_dashboard'),
  (null,'internal','coordinator_dashboard'), (null,'internal','regional_lead'), (null,'internal','national_hq'),
  ('fixeasy_worker','public','fixeasy24'), ('fixeasy_worker','public','ubuntu_jobs'),
  ('business','public','kasibuy'), ('business','public','maps'),
  ('familyhouse','public','familyhouse'), ('familyhouse','public','ubuntu_tourism'),
  ('podcast','public','inside_town'), ('podcast','public','homepage'),
  ('event','public','ubuntu_events'), ('event','public','town_calendar'),
  ('tourism_asset','public','ubuntu_tourism'), ('tourism_asset','public','maps')
on conflict do nothing;

-- OPTIONAL: let a specific town's coordinators self-publish public content
-- update uto.towns set public_self_approve = true where id = '...';

-- =====================================================================
-- END. Deprecates (drop in a LATER cleanup migration, once the app is
-- repointed): uto.businesses, uto.events, uto.stories (all 0 rows), and the
-- entire empty `public` schema. Do NOT drop uto.proofs/media_assets/signals/
-- workpack_instances — those are the operational engine and are kept.
-- =====================================================================
