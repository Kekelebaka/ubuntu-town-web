-- 0007: Daycare OS work type.
--
-- Adds `daycare` to uto.work_type and a work_daycare detail table that mirrors
-- the other work_* detail tables (RLS via app.can_read_work / app.can_write_work,
-- grants: authenticated CRUD, anon SELECT). Safe: the publish triggers do not
-- switch on work_type exhaustively, and publishing_rules with work_type IS NULL
-- apply to all types, so `daycare` inherits the generic publish channels.

alter type uto.work_type add value if not exists 'daycare';

create table if not exists uto.work_daycare (
  work_id             uuid primary key references uto.community_work(id) on delete cascade,
  principal_name      text,
  whatsapp            text,
  phone               text,
  address             text,
  children_count      integer,
  age_groups          text[] not null default '{}',
  registration_status text,
  subsidised          boolean not null default false,
  created_at          timestamptz not null default now()
);

alter table uto.work_daycare enable row level security;

drop policy if exists work_daycare_read on uto.work_daycare;
create policy work_daycare_read on uto.work_daycare
  for select to authenticated, anon
  using (app.can_read_work(work_id));

drop policy if exists work_daycare_write on uto.work_daycare;
create policy work_daycare_write on uto.work_daycare
  for all to authenticated
  using (app.can_write_work(work_id))
  with check (app.can_write_work(work_id));

grant select on uto.work_daycare to anon, authenticated;
grant insert, update, delete on uto.work_daycare to authenticated;
