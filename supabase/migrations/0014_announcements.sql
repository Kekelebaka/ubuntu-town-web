-- 0014 · Announcements
-- Town-scoped or national broadcast messages. town_id NULL = visible to everyone.
-- Pinned first, newest second. Realtime-enabled.

create table if not exists uto.announcements(
  id uuid primary key default gen_random_uuid(),
  town_id uuid references uto.towns(id) on delete cascade,   -- null = national/global
  author_id uuid not null default auth.uid(),
  title text not null,
  body text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table uto.announcements enable row level security;
create policy ann_read on uto.announcements for select to authenticated
  using (town_id is null or app.has_town_scope(town_id) or app.is_national());
create policy ann_write on uto.announcements for all to authenticated
  using ((town_id is not null and app.has_town_scope(town_id)) or app.is_national())
  with check ((town_id is not null and app.has_town_scope(town_id)) or app.is_national());
grant select, insert, update, delete on uto.announcements to authenticated;
alter publication supabase_realtime add table uto.announcements;
