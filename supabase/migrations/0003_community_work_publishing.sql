-- ============================================================================
-- Ubuntu Town OS — Community Work Publishing Spine (0003)
-- Target: Supabase Postgres 17 · project ubuntu-town-os (afiokbhuxfdacbsipoqk)
-- Applied AFTER 0001 + 0002. Additive & reversible.
-- 
-- This is the moat: one loop — steward does work → approved → publishes
-- everywhere (town page, initiatives, search, AI index, national portal),
-- on one source of truth, re-skinnable per town.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS (for pgvector hybrid search)
-- ============================================================================
create extension if not exists "vector";
create extension if not exists "pg_trgm";       -- trigram similarity

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

do $$ begin
  create type work_visibility as enum ('public', 'internal', 'national');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_status as enum (
    'draft',        -- coordinator is editing
    'submitted',    -- sent for review
    'in_review',    -- ops/admin reviewing
    'approved',     -- approved, pending publish
    'published',    -- live on town page + channels
    'rejected',     -- rejected with reason
    'returned'      -- sent back for edits
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_type as enum (
    'fixeasy_worker',   -- FixEasy24 service provider
    'familyhouse',      -- FamilyHouse host
    'business',         -- KasiBuy / local business
    'event',            -- BuntuBar / community event
    'podcast'           -- Inside.Town podcast episode
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_action as enum (
    'submitted', 'approved', 'published', 'rejected', 'returned', 'edited'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type publish_channel as enum (
    'town_page',            -- public town page rebuild
    'search',               -- search index upsert
    'ai_index',             -- pgvector embedding for AI
    'fixeasy24',            -- FixEasy24 node site
    'ubuntu_jobs',          -- Ubuntu Jobs board
    'coordinator_dashboard' -- coordinator notification
  );
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- The unified content object — every piece of community work flows through here
create table if not exists community_work (
  id              uuid primary key default gen_random_uuid(),
  type            work_type not null,
  town_id         uuid not null references towns(id) on delete cascade,
  
  -- Content
  title           text not null,
  description     text,
  summary         text,               -- short blurb for cards/feeds
  
  -- Publishing controls
  visibility      work_visibility not null default 'public',
  status          work_status not null default 'draft',
  
  -- Timestamps
  submitted_at    timestamptz,
  approved_at     timestamptz,
  published_at    timestamptz,
  rejected_at     timestamptz,
  
  -- Metadata
  created_by      uuid references users(id) on delete set null,
  updated_by      uuid references users(id) on delete set null,
  rejection_reason text,
  
  -- SEO / social
  slug            text,
  cover_image_url text,
  
  -- Search
  search_vector   tsvector,
  embedding       vector(1536),       -- OpenAI ada-002 dimension
  
  -- Audit
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_cw_town_id on community_work(town_id);
create index if not exists idx_cw_type on community_work(type);
create index if not exists idx_cw_status on community_work(status);
create index if not exists idx_cw_visibility on community_work(visibility);
create index if not exists idx_cw_published on community_work(published_at desc) where status = 'published';
create index if not exists idx_cw_search on community_work using gin(search_vector);
create index if not exists idx_cw_slug on community_work(town_id, slug) where slug is not null;

-- ============================================================================
-- 3. TYPED DETAIL TABLES (one per work_type)
-- ============================================================================

-- FixEasy Worker — service provider profile
create table if not exists work_fixeasy_worker (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  -- Provider details
  full_name       text not null,
  phone           text,
  whatsapp        text,
  service_category text not null,      -- 'plumber', 'electrician', 'handyman', etc.
  service_areas   text[] default '{}', -- neighbourhoods served
  certifications  text[] default '{}',
  years_experience integer,
  hourly_rate     numeric(10,2),
  available_now   boolean not null default true,
  portfolio_urls  text[] default '{}',
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists idx_few_cw on work_fixeasy_worker(community_work_id);

-- FamilyHouse — hospitality host profile
create table if not exists work_familyhouse (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  host_name       text not null,
  phone           text,
  whatsapp        text,
  property_type   text not null,      -- 'room', 'cottage', 'house'
  max_guests      integer not null default 2,
  price_per_night numeric(10,2),
  amenities       text[] default '{}',
  address         text,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists idx_fh_cw on work_familyhouse(community_work_id);

-- Business — local business / spaza listing
create table if not exists work_business (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  business_name   text not null,
  owner_name      text,
  phone           text,
  whatsapp        text,
  category        text not null,      -- 'spaza', 'restaurant', 'salon', etc.
  address         text,
  operating_hours text,
  products        text[] default '{}',
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists idx_biz_cw on work_business(community_work_id);

-- Event — community event listing
create table if not exists work_event (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  event_name      text not null,
  organizer_name  text,
  phone           text,
  event_date      timestamptz not null,
  end_date        timestamptz,
  venue           text not null,
  capacity        integer,
  ticket_price    numeric(10,2),
  category        text,               -- 'music', 'workshop', 'market', etc.
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists idx_evt_cw on work_event(community_work_id);

-- Podcast — Inside.Town episode
create table if not exists work_podcast (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  host_name       text not null,
  episode_title   text not null,
  audio_url       text,
  duration_seconds integer,
  guests          text[] default '{}',
  transcript      text,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists idx_pod_cw on work_podcast(community_work_id);

-- ============================================================================
-- 4. MEDIA ATTACHMENTS
-- ============================================================================

create table if not exists work_media (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  kind            media_kind not null default 'image',
  url             text not null,
  alt_text        text,
  caption         text,
  sort_order      integer not null default 0,
  
  created_at      timestamptz not null default now()
);

create index if not exists idx_wm_cw on work_media(community_work_id, sort_order);

-- ============================================================================
-- 5. APPROVAL WORKFLOW
-- ============================================================================

create table if not exists work_approvals (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  action          work_action not null,
  from_status     work_status,
  to_status       work_status not null,
  
  performed_by    uuid references users(id) on delete set null,
  notes           text,
  
  created_at      timestamptz not null default now()
);

create index if not exists idx_wa_cw on work_approvals(community_work_id, created_at desc);

-- ============================================================================
-- 6. PUBLISHING RULES (per-town auto-approve configuration)
-- ============================================================================

create table if not exists publishing_rules (
  id              uuid primary key default gen_random_uuid(),
  town_id         uuid not null references towns(id) on delete cascade,
  
  -- Which types auto-approve for this town
  work_type       work_type not null,
  auto_approve    boolean not null default false,
  require_review  boolean not null default true,
  
  -- Visibility defaults
  default_visibility work_visibility not null default 'public',
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  
  unique(town_id, work_type)
);

create index if not exists idx_pr_town on publishing_rules(town_id);

-- ============================================================================
-- 7. PUBLISH OUTBOX (fan-out queue)
-- ============================================================================

create table if not exists publish_outbox (
  id              uuid primary key default gen_random_uuid(),
  community_work_id uuid not null references community_work(id) on delete cascade,
  
  channel         publish_channel not null,
  status          text not null default 'pending',  -- pending / processing / done / failed
  attempts        integer not null default 0,
  max_attempts    integer not null default 3,
  
  payload         jsonb not null default '{}',
  error           text,
  
  scheduled_at    timestamptz not null default now(),
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_po_status on publish_outbox(status, scheduled_at)
  where status in ('pending', 'failed');
create index if not exists idx_po_cw on publish_outbox(community_work_id);

-- ============================================================================
-- 8. EXTEND EXISTING TABLES (additive, nullable)
-- ============================================================================

-- Towns: allow self-approval for community work (coordinator can auto-approve)
alter table towns
  add column if not exists public_self_approve boolean not null default false;

-- Proofs: link back to community work (when a proof validates a published item)
alter table proofs
  add column if not exists community_work_id uuid references community_work(id) on delete set null;

-- ============================================================================
-- 9. RLS HELPER FUNCTIONS (app.* schema for security definer functions)
-- ============================================================================

-- Create app schema if it doesn't exist
create schema if not exists app;

-- Check if the current user has a specific role in a specific town
create or replace function app.has_role(check_role role_key, check_town_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from role_assignments
    where user_id = auth.uid()
      and role_key = check_role
      and (check_town_id is null or town_id = check_town_id or town_id is null)
  );
$$;

-- Check if the current user has any town-scoped role (coordinator/deputy/ambassador/media)
create or replace function app.has_town_scope(check_town_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from role_assignments
    where user_id = auth.uid()
      and role_key in ('coordinator', 'deputy', 'ambassador', 'media')
      and (check_town_id is null or town_id = check_town_id or town_id is null)
  );
$$;

-- Check if the current user is admin/ops
create or replace function app.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from role_assignments
    where user_id = auth.uid()
      and role_key in ('admin', 'ops')
  );
$$;

-- Get the town_id for the current user's coordinator role
create or replace function app.my_town_id()
returns uuid language sql stable security definer set search_path = public as $$
  select town_id from role_assignments
  where user_id = auth.uid()
    and role_key = 'coordinator'
    and town_id is not null
  limit 1;
$$;

-- ============================================================================
-- 10. RLS POLICIES FOR COMMUNITY_WORK
-- ============================================================================

alter table community_work enable row level security;
alter table community_work force row level security;

-- Anonymous: read published + public/national only
create policy anon_read_published_cw on community_work
  for select
  using (
    status = 'published'
    and visibility in ('public', 'national')
  );

-- Authenticated: read published + public/national (same as anon for now)
create policy auth_read_published_cw on community_work
  for select
  using (
    status = 'published'
    and visibility in ('public', 'national')
  );

-- Coordinator: full CRUD on their own town's community work
create policy coordinator_manage_own_town_cw on community_work
  for all
  using (
    app.has_town_scope(town_id)
  )
  with check (
    app.has_town_scope(town_id)
  );

-- Admin/Ops: full access
create policy admin_all_cw on community_work
  for all
  using (app.is_admin())
  with check (app.is_admin());

-- ============================================================================
-- 11. RLS POLICIES FOR DETAIL TABLES
-- ============================================================================

-- FixEasy Worker
alter table work_fixeasy_worker enable row level security;
alter table work_fixeasy_worker force row level security;

create policy anon_read_few on work_fixeasy_worker for select using (
  exists (
    select 1 from community_work cw
    where cw.id = work_fixeasy_worker.community_work_id
      and cw.status = 'published' and cw.visibility in ('public', 'national')
  )
);
create policy coordinator_manage_few on work_fixeasy_worker for all
  using (exists (select 1 from community_work cw where cw.id = work_fixeasy_worker.community_work_id and app.has_town_scope(cw.town_id)))
  with check (exists (select 1 from community_work cw where cw.id = work_fixeasy_worker.community_work_id and app.has_town_scope(cw.town_id)));
create policy admin_all_few on work_fixeasy_worker for all using (app.is_admin()) with check (app.is_admin());

-- FamilyHouse
alter table work_familyhouse enable row level security;
alter table work_familyhouse force row level security;

create policy anon_read_fh on work_familyhouse for select using (
  exists (select 1 from community_work cw where cw.id = work_familyhouse.community_work_id and cw.status = 'published' and cw.visibility in ('public', 'national'))
);
create policy coordinator_manage_fh on work_familyhouse for all
  using (exists (select 1 from community_work cw where cw.id = work_familyhouse.community_work_id and app.has_town_scope(cw.town_id)))
  with check (exists (select 1 from community_work cw where cw.id = work_familyhouse.community_work_id and app.has_town_scope(cw.town_id)));
create policy admin_all_fh on work_familyhouse for all using (app.is_admin()) with check (app.is_admin());

-- Business
alter table work_business enable row level security;
alter table work_business force row level security;

create policy anon_read_biz on work_business for select using (
  exists (select 1 from community_work cw where cw.id = work_business.community_work_id and cw.status = 'published' and cw.visibility in ('public', 'national'))
);
create policy coordinator_manage_biz on work_business for all
  using (exists (select 1 from community_work cw where cw.id = work_business.community_work_id and app.has_town_scope(cw.town_id)))
  with check (exists (select 1 from community_work cw where cw.id = work_business.community_work_id and app.has_town_scope(cw.town_id)));
create policy admin_all_biz on work_business for all using (app.is_admin()) with check (app.is_admin());

-- Event
alter table work_event enable row level security;
alter table work_event force row level security;

create policy anon_read_evt on work_event for select using (
  exists (select 1 from community_work cw where cw.id = work_event.community_work_id and cw.status = 'published' and cw.visibility in ('public', 'national'))
);
create policy coordinator_manage_evt on work_event for all
  using (exists (select 1 from community_work cw where cw.id = work_event.community_work_id and app.has_town_scope(cw.town_id)))
  with check (exists (select 1 from community_work cw where cw.id = work_event.community_work_id and app.has_town_scope(cw.town_id)));
create policy admin_all_evt on work_event for all using (app.is_admin()) with check (app.is_admin());

-- Podcast
alter table work_podcast enable row level security;
alter table work_podcast force row level security;

create policy anon_read_pod on work_podcast for select using (
  exists (select 1 from community_work cw where cw.id = work_podcast.community_work_id and cw.status = 'published' and cw.visibility in ('public', 'national'))
);
create policy coordinator_manage_pod on work_podcast for all
  using (exists (select 1 from community_work cw where cw.id = work_podcast.community_work_id and app.has_town_scope(cw.town_id)))
  with check (exists (select 1 from community_work cw where cw.id = work_podcast.community_work_id and app.has_town_scope(cw.town_id)));
create policy admin_all_pod on work_podcast for all using (app.is_admin()) with check (app.is_admin());

-- Work Media
alter table work_media enable row level security;
alter table work_media force row level security;

create policy anon_read_wm on work_media for select using (
  exists (select 1 from community_work cw where cw.id = work_media.community_work_id and cw.status = 'published' and cw.visibility in ('public', 'national'))
);
create policy coordinator_manage_wm on work_media for all
  using (exists (select 1 from community_work cw where cw.id = work_media.community_work_id and app.has_town_scope(cw.town_id)))
  with check (exists (select 1 from community_work cw where cw.id = work_media.community_work_id and app.has_town_scope(cw.town_id)));
create policy admin_all_wm on work_media for all using (app.is_admin()) with check (app.is_admin());

-- Work Approvals (audit trail — append-only, read for own town)
alter table work_approvals enable row level security;
alter table work_approvals force row level security;

create policy admin_all_wa on work_approvals for all using (app.is_admin()) with check (app.is_admin());
create policy coordinator_read_wa on work_approvals for select using (
  exists (select 1 from community_work cw where cw.id = work_approvals.community_work_id and app.has_town_scope(cw.town_id))
);
create policy coordinator_insert_wa on work_approvals for insert with check (
  exists (select 1 from community_work cw where cw.id = work_approvals.community_work_id and app.has_town_scope(cw.town_id))
);

-- Publish Outbox (system-managed, admin read)
alter table publish_outbox enable row level security;
alter table publish_outbox force row level security;

create policy admin_all_po on publish_outbox for all using (app.is_admin()) with check (app.is_admin());

-- Publishing Rules
alter table publishing_rules enable row level security;
alter table publishing_rules force row level security;

create policy admin_all_pr on publishing_rules for all using (app.is_admin()) with check (app.is_admin());
create policy coordinator_read_pr on publishing_rules for select using (app.has_town_scope(town_id));

-- ============================================================================
-- 12. STATE MACHINE TRIGGER (BEFORE INSERT/UPDATE on community_work)
-- ============================================================================

create or replace function trg_community_work_state_machine()
returns trigger language plpgsql as $$
declare
  _rule publishing_rules%rowtype;
  _self_approve boolean;
begin
  -- Only process status changes
  if tg_op = 'UPDATE' and new.status = old.status then
    new.updated_at = now();
    return new;
  end if;

  -- ---- SUBMITTED ----
  if new.status = 'submitted' then
    -- Must come from draft or returned
    if tg_op = 'UPDATE' and old.status not in ('draft', 'returned') then
      raise exception 'Can only submit from draft or returned status, current: %', old.status;
    end if;
    new.submitted_at = coalesce(new.submitted_at, now());
    
    -- Check if this town has self-approve for this work type
    select public_self_approve into _self_approve
    from towns where id = new.town_id;
    
    select * into _rule from publishing_rules
    where town_id = new.town_id and work_type = new.type;
    
    -- Auto-approve if town allows self-approval AND publishing rule says auto_approve
    if coalesce(_self_approve, false) and coalesce(_rule.auto_approve, false) then
      new.status = 'approved';
      new.approved_at = now();
      -- Fall through to approved handling below
    else
      -- Need human review
      new.status = 'submitted';
      return new;
    end if;
  end if;

  -- ---- APPROVED ----
  if new.status = 'approved' then
    if tg_op = 'UPDATE' and old.status not in ('submitted', 'in_review') and new.status = 'approved' then
      -- Allow direct approve from draft if admin
      if old.status != 'draft' or not app.is_admin() then
        raise exception 'Can only approve from submitted/in_review status, current: %', old.status;
      end if;
    end if;
    new.approved_at = coalesce(new.approved_at, now());
    
    -- Auto-publish: approved always goes to published immediately
    new.status = 'published';
    new.published_at = now();
    return new;
  end if;

  -- ---- REJECTED ----
  if new.status = 'rejected' then
    new.rejected_at = now();
    if new.rejection_reason is null then
      raise exception 'Rejection reason is required';
    end if;
    return new;
  end if;

  -- ---- RETURNED ----
  if new.status = 'returned' then
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cw_state_machine on community_work;
create trigger trg_cw_state_machine
  before insert or update on community_work
  for each row execute function trg_community_work_state_machine();

-- ============================================================================
-- 13. FAN-OUT TRIGGER (AFTER INSERT/UPDATE on community_work)
-- ============================================================================

create or replace function trg_community_work_fanout()
returns trigger language plpgsql as $$
begin
  -- Only fan out when status changes to 'published'
  if new.status = 'published' and (tg_op = 'INSERT' or old.status != 'published') then
    
    -- Record approval action
    insert into work_approvals (community_work_id, action, from_status, to_status, performed_by)
    values (new.id, 'published', coalesce(old.status, 'draft'), 'published', auth.uid());

    -- Fan out to all channels
    insert into publish_outbox (community_work_id, channel, payload) values
      (new.id, 'town_page', jsonb_build_object(
        'town_id', new.town_id,
        'work_type', new.type,
        'title', new.title,
        'visibility', new.visibility,
        'action', 'revalidate'
      )),
      (new.id, 'search', jsonb_build_object(
        'town_id', new.town_id,
        'work_type', new.type,
        'title', new.title,
        'description', new.description,
        'action', 'upsert'
      )),
      (new.id, 'ai_index', jsonb_build_object(
        'town_id', new.town_id,
        'work_type', new.type,
        'title', new.title,
        'description', new.description,
        'action', 'embed'
      )),
      (new.id, 'coordinator_dashboard', jsonb_build_object(
        'town_id', new.town_id,
        'work_type', new.type,
        'title', new.title,
        'action', 'notify'
      ));

    -- Conditional channels based on work type
    if new.type = 'fixeasy_worker' then
      insert into publish_outbox (community_work_id, channel, payload)
      values (new.id, 'fixeasy24', jsonb_build_object(
        'town_id', new.town_id,
        'title', new.title,
        'action', 'upsert_worker'
      ));
      insert into publish_outbox (community_work_id, channel, payload)
      values (new.id, 'ubuntu_jobs', jsonb_build_object(
        'town_id', new.town_id,
        'title', new.title,
        'action', 'upsert_provider'
      ));
    end if;

    -- Update search vector
    new.search_vector :=
      setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(new.description, '')), 'C');

  end if;

  -- Update search vector on any content change
  if tg_op = 'UPDATE' and (
    old.title != new.title or
    old.summary is distinct from new.summary or
    old.description is distinct from new.description
  ) then
    new.search_vector :=
      setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(new.description, '')), 'C');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cw_fanout on community_work;
create trigger trg_cw_fanout
  after insert or update on community_work
  for each row execute function trg_community_work_fanout();

-- ============================================================================
-- 14. HYBRID SEARCH RPC (text + vector)
-- ============================================================================

create or replace function search_community_work(
  query_text text default null,
  query_embedding vector(1536) default null,
  filter_town_id uuid default null,
  filter_type work_type default null,
  filter_visibility work_visibility default null,
  result_limit integer default 20,
  result_offset integer default 0
)
returns table (
  id uuid,
  type work_type,
  town_id uuid,
  title text,
  summary text,
  visibility work_visibility,
  published_at timestamptz,
  score real
) language sql stable as $$
  with text_matches as (
    select
      cw.id,
      cw.type,
      cw.town_id,
      cw.title,
      cw.summary,
      cw.visibility,
      cw.published_at,
      case
        when query_text is not null then
          ts_rank(cw.search_vector, plainto_tsquery('english', query_text))
        else 0
      end as text_score,
      case
        when query_embedding is not null and cw.embedding is not null then
          1 - (cw.embedding <=> query_embedding)
        else 0
      end as vector_score
    from community_work cw
    where cw.status = 'published'
      and cw.visibility in ('public', 'national')
      and (filter_town_id is null or cw.town_id = filter_town_id)
      and (filter_type is null or cw.type = filter_type)
      and (filter_visibility is null or cw.visibility = filter_visibility)
      and (
        query_text is null
        or cw.search_vector @@ plainto_tsquery('english', query_text)
        or cw.title ilike '%' || query_text || '%'
        or cw.summary ilike '%' || query_text || '%'
      )
  )
  select
    id, type, town_id, title, summary, visibility, published_at,
    (text_score + vector_score)::real as score
  from text_matches
  order by score desc
  limit result_limit
  offset result_offset;
$$;

-- ============================================================================
-- 15. NOTIFY TRIGGER (for outbox worker)
-- ============================================================================

create or replace function notify_work_published()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status != 'published') then
    perform pg_notify('work_published', json_build_object(
      'id', new.id,
      'type', new.type,
      'town_id', new.town_id,
      'title', new.title
    )::text);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cw_notify on community_work;
create trigger trg_cw_notify
  after insert or update on community_work
  for each row execute function notify_work_published();

-- ============================================================================
-- 16. SEED: Default publishing rules for Bushbuckridge
-- ============================================================================

-- Insert default rules for Bushbuckridge (all types, auto-approve off by default)
insert into publishing_rules (town_id, work_type, auto_approve, require_review, default_visibility)
select t.id, wt::work_type, false, true, 'public'::work_visibility
from towns t
cross join unnest(enum_range(null::work_type)) as wt
where t.slug = 'bushbuckridge'
on conflict (town_id, work_type) do nothing;

-- ============================================================================
-- 17. GRANTS (for anon/authenticated roles)
-- ============================================================================

-- Grant usage on app schema
grant usage on schema app to anon, authenticated;

-- Grant execute on helper functions
grant execute on function app.has_role(role_key, uuid) to anon, authenticated;
grant execute on function app.has_town_scope(uuid) to anon, authenticated;
grant execute on function app.is_admin() to anon, authenticated;
grant execute on function app.my_town_id() to authenticated;
grant execute on function search_community_work(text, vector, uuid, work_type, work_visibility, integer, integer) to anon, authenticated;

-- Grant select on published community work to anon
grant select on community_work to anon;
grant select on work_fixeasy_worker to anon;
grant select on work_familyhouse to anon;
grant select on work_business to anon;
grant select on work_event to anon;
grant select on work_podcast to anon;
grant select on work_media to anon;

-- Grant full access to authenticated (RLS will scope it)
grant all on community_work to authenticated;
grant all on work_fixeasy_worker to authenticated;
grant all on work_familyhouse to authenticated;
grant all on work_business to authenticated;
grant all on work_event to authenticated;
grant all on work_podcast to authenticated;
grant all on work_media to authenticated;
grant all on work_approvals to authenticated;
grant select on publishing_rules to authenticated;

-- ============================================================================
-- END 0003 — publishing spine complete
-- ============================================================================
