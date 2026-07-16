-- 0015 · PROVINCES, DISTRICTS + ROLE EXTENSIONS
-- Foundation for the Ubuntu Town matrix: provinces (9 of them), districts,
-- and extended role keys. All additive; preserves existing role_assignments.
-- Safe to run against live; existing rows untouched.

-- ─── PROVINCES + DISTRICTS (reference tables) ──────────────────────────────
create table if not exists uto.provinces(
  id uuid primary key default gen_random_uuid(),
  code text unique not null,        -- 'GP', 'WC', 'KZN', etc.
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);
alter table uto.provinces enable row level security;
create policy provinces_read on uto.provinces for select to anon, authenticated using (true);
grant select on uto.provinces to anon, authenticated;

create table if not exists uto.districts(
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references uto.provinces(id) on delete cascade,
  code text unique not null,
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);
create index if not exists districts_province_idx on uto.districts(province_id);
alter table uto.districts enable row level security;
create policy districts_read on uto.districts for select to anon, authenticated using (true);
grant select on uto.districts to anon, authenticated;

-- Seed SA's 9 provinces
insert into uto.provinces(code, name, slug) values
  ('GP','Gauteng','gauteng'),
  ('WC','Western Cape','western-cape'),
  ('KZN','KwaZulu-Natal','kwazulu-natal'),
  ('EC','Eastern Cape','eastern-cape'),
  ('FS','Free State','free-state'),
  ('NW','North West','north-west'),
  ('LP','Limpopo','limpopo'),
  ('MP','Mpumalanga','mpumalanga'),
  ('NC','Northern Cape','northern-cape')
on conflict (code) do nothing;

-- ─── EXTEND ROLE_KEY ENUM (additive only) ──────────────────────────────────
do $$ begin
  alter type uto.role_key add value 'province';
  alter type uto.role_key add value 'district';
  alter type uto.role_key add value 'community_champion';
  alter type uto.role_key add value 'volunteer';
  alter type uto.role_key add value 'moderator';
  alter type uto.role_key add value 'initiative_owner';
  alter type uto.role_key add value 'initiative_member';
  alter type uto.role_key add value 'guild_lead';
  alter type uto.role_key add value 'guild_member';
exception when duplicate_object then null; end $$;

-- ─── EXTEND role_assignments WITH SCOPE COLUMNS ────────────────────────────
alter table uto.role_assignments
  add column if not exists province_id uuid references uto.provinces(id) on delete cascade,
  add column if not exists district_id uuid references uto.districts(id) on delete cascade;
create index if not exists ra_province_idx on uto.role_assignments(province_id);
create index if not exists ra_district_idx on uto.role_assignments(district_id);

-- ─── EXTENDED RANK HELPER (handles province/district scopes) ───────────────
create or replace function app.uto_rank(_r uto.role_key)
returns int language sql immutable set search_path = '' as $$
  select case _r
    when 'admin' then 5
    when 'ops' then 5
    when 'province' then 4
    when 'district' then 3
    when 'coordinator' then 2
    when 'deputy' then 2
    when 'community_champion' then 1
    when 'volunteer' then 1
    when 'moderator' then 2
    when 'initiative_owner' then 4
    when 'initiative_member' then 1
    when 'guild_lead' then 3
    when 'guild_member' then 1
    else 0
  end;
$$;

-- Province scope check (true if the caller has ANY province role covering _province_id,
-- OR is national admin, OR is district coordinator UNDER that province)
create or replace function app.has_province_scope(_province_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select app.is_national()
    or exists (
      select 1 from uto.role_assignments ra
      where ra.user_id = auth.uid()
        and (
          (ra.role_key = 'province' and ra.province_id = _province_id)
          or (ra.role_key = 'district' and ra.district_id in (select id from uto.districts where province_id = _province_id))
        )
    );
$$;
grant execute on function app.has_province_scope(uuid) to anon, authenticated;

create or replace function app.has_district_scope(_district_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select app.is_national()
    or app.has_province_scope((select province_id from uto.districts where id = _district_id))
    or exists (
      select 1 from uto.role_assignments ra
      where ra.user_id = auth.uid()
        and (
          (ra.role_key = 'district' and ra.district_id = _district_id)
          or (ra.role_key = 'coordinator' and ra.town_id in (select id from uto.towns where district_id = _district_id))
        )
    );
$$;
grant execute on function app.has_district_scope(uuid) to authenticated;
