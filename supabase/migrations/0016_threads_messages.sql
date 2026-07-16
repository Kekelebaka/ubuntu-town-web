-- 0016 · THREADS + MESSAGES
-- The collaboration primitive that makes cross-town, cross-initiative,
-- cross-guild, and email threads work. One table, scope-aware via RLS.

-- ─── scope_kind ENUM ───────────────────────────────────────────────────────
do $$ begin
  create type uto.scope_kind as enum (
    'town','province','district','initiative','guild','national','work','ad_hoc'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.message_kind as enum ('email','comment','mention','system','assignment','voice');
exception when duplicate_object then null; end $$;

-- ─── THREADS ───────────────────────────────────────────────────────────────
create table if not exists uto.threads(
  id uuid primary key default gen_random_uuid(),
  scope_kind uto.scope_kind not null,
  scope_id uuid,                                -- town/province/district/initiative/guild/work id (or null for national)
  title text not null,
  description text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);
create index if not exists threads_scope_idx on uto.threads(scope_kind, scope_id);
create index if not exists threads_activity_idx on uto.threads(last_activity_at desc);

alter table uto.threads enable row level security;
-- A member sees a thread iff they have scope access OR they've posted in it
create policy threads_read on uto.threads for select to authenticated using (
  (scope_kind = 'national')
  or (scope_kind = 'town' and app.has_town_scope(scope_id))
  or (scope_kind = 'province' and scope_id is not null and app.has_province_scope(scope_id))
  or (scope_kind = 'district' and scope_id is not null and app.has_district_scope(scope_id))
  or (scope_kind = 'initiative' and exists (select 1 from uto.initiative_assignments ia where ia.initiative_key = (select scope_id::text from (values (scope_id)) v(scope_id)) and ia.user_id = auth.uid()))
  or (scope_kind = 'guild' and exists (select 1 from uto.guild_assignments ga where ga.guild_key = (select scope_id::text from (values (scope_id)) v(scope_id)) and ga.user_id = auth.uid()))
  or (scope_kind = 'work' and scope_id is not null and app.can_read_work(scope_id))
  or exists (select 1 from uto.thread_members tm where tm.thread_id = id and tm.user_id = auth.uid())
);
create policy threads_write on uto.threads for insert to authenticated with check (
  created_by = auth.uid() and (
    scope_kind = 'ad_hoc'
    or (scope_kind = 'town' and app.has_town_scope(scope_id))
    or (scope_kind = 'province' and scope_id is not null and app.has_province_scope(scope_id))
    or (scope_kind = 'district' and scope_id is not null and app.has_district_scope(scope_id))
    or (scope_kind = 'initiative' and exists (select 1 from uto.initiative_assignments ia where ia.initiative_key = (select scope_id::text from uto.initiative_assignments limit 1) and ia.user_id = auth.uid() and ia.role in ('owner','member')))
    or (scope_kind = 'work' and scope_id is not null and app.can_write_work(scope_id))
  )
);
grant select, insert, update on uto.threads to authenticated;

-- ─── THREAD MEMBERS (for ad_hoc + explicit subscription) ──────────────────
create table if not exists uto.thread_members(
  thread_id uuid not null references uto.threads(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
alter table uto.thread_members enable row level security;
create policy tm_read on uto.thread_members for select to authenticated using (auth.uid() = user_id);
create policy tm_manage on uto.thread_members for all to authenticated using (true) with check (true);
grant select, insert, delete on uto.thread_members to authenticated;

-- ─── MESSAGES ──────────────────────────────────────────────────────────────
create table if not exists uto.messages(
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references uto.threads(id) on delete cascade,
  work_id uuid references uto.community_work(id) on delete set null,
  town_id uuid references uto.towns(id) on delete set null,
  from_user_id uuid,                                  -- internal sender
  from_email text,                                    -- external email sender (for inbound)
  to_emails text[] not null default '{}',
  subject text,
  body text not null,
  kind uto.message_kind not null default 'comment',
  external_id text,                                   -- Message-ID for email threading
  in_reply_to text,                                   -- parent email Message-ID
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_idx on uto.messages(thread_id, created_at);
create index if not exists messages_town_idx on uto.messages(town_id, created_at desc);
create index if not exists messages_kind_idx on uto.messages(kind, created_at desc);

alter table uto.messages enable row level security;
create policy messages_read on uto.messages for select to authenticated using (
  -- email threads scoped via the threads table (already RLS-checked)
  (thread_id is not null and app.can_read_thread(thread_id))
  -- work-linked messages inherit work RLS
  or (work_id is not null and app.can_read_work(work_id))
  -- town-scoped messages for town members
  or (town_id is not null and app.has_town_scope(town_id))
  -- own messages
  or from_user_id = auth.uid()
);
create policy messages_write on uto.messages for insert to authenticated with check (
  from_user_id = auth.uid() and (
    thread_id is null
    or app.can_read_thread(thread_id)
  )
);
create policy messages_self_update on uto.messages for update to authenticated
  using (from_user_id = auth.uid()) with check (from_user_id = auth.uid());
grant select, insert, update on uto.messages to authenticated;

-- Helper function for RLS on threads (called from messages_read)
create or replace function app.can_read_thread(_thread_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from uto.threads t where t.id = _thread_id and (
      (t.scope_kind = 'national')
      or (t.scope_kind = 'town' and app.has_town_scope(t.scope_id))
      or (t.scope_kind = 'province' and t.scope_id is not null and app.has_province_scope(t.scope_id))
      or (t.scope_kind = 'district' and t.scope_id is not null and app.has_district_scope(t.scope_id))
      or (t.scope_kind = 'work' and t.scope_id is not null and app.can_read_work(t.scope_id))
      or exists (select 1 from uto.thread_members tm where tm.thread_id = t.id and tm.user_id = auth.uid())
    )
  );
$$;
grant execute on function app.can_read_thread(uuid) to authenticated;

-- Realtime
alter publication supabase_realtime add table uto.threads;
alter publication supabase_realtime add table uto.messages;

-- Caller's visible threads, ranked by activity
create or replace function uto.my_threads(_limit int default 50)
returns setof uto.threads
language sql stable security definer set search_path='' as $$
  select t.* from uto.threads t
  where (
    (t.scope_kind = 'national')
    or (t.scope_kind = 'town' and app.has_town_scope(t.scope_id))
    or (t.scope_kind = 'province' and t.scope_id is not null and app.has_province_scope(t.scope_id))
    or (t.scope_kind = 'district' and t.scope_id is not null and app.has_district_scope(t.scope_id))
    or exists (select 1 from uto.thread_members tm where tm.thread_id = t.id and tm.user_id = auth.uid())
  )
  order by t.last_activity_at desc limit _limit;
$$;
grant execute on function uto.my_threads(int) to authenticated;
