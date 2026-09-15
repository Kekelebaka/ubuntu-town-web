-- Northstar Gate 1: Founding Geography Reconciliation
-- Target: staging lgbkfthojyxhwemgkpgo (NEVER production)
-- Idempotent: safe to re-run. All51 canonical towns via ON CONFLICT.
-- Province membership is canonical and enforced by this migration.
--
-- This migration:
-- 1. Adds missing columns touto.towns (is_founding, recruitment_status, applicant_count)
-- 2. Creates the town_readiness table if missing
-- 3. Inserts/updates all51 canonical towns from the register
-- 4. Ensures province membership matches the canonical register exactly

-- ============================================================
-- 1. ADD MISSING COLUMNS (additive, reversible)
-- ============================================================
alter table uto.towns add column if not exists is_founding boolean not null default false;
alter table uto.towns add column if not exists recruitment_status text;
alter table uto.towns add column if not exists applicant_count integer not null default 0;

-- ============================================================
-- 2. CREATE town_readiness TABLE (additive)
-- ============================================================
create table if not exists uto.town_readiness (
  id uuid primary key default gen_random_uuid(),
  town_id uuid not null unique references uto.towns(id) on delete cascade,
  applicant_count integer not null default 0,
  assessment_score numeric,
  interview_status text not null default 'not_started',
  coordinator_status text not null default 'vacant',
  coordinator_position text,
  whatsapp_joined boolean not null default false,
  contract_signed boolean not null default false,
  kit_sent boolean not null default false,
  town_profile_complete boolean not null default false,
  first_meeting_held boolean not null default false,
  first_partnership_signed boolean not null default false,
  os_activated boolean not null default false,
  launch_readiness_pct integer not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

alter table uto.town_readiness enable row level security;

-- ============================================================
-- 3. UPSERT ALL51 CANONICAL TOWNS
-- ============================================================
-- Uses INSERT ... ON CONFLICT (slug) DO UPDATE for idempotency.
-- Province membership is set here and must match canonical-register.ts.

-- Gauteng (8)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Johannesburg', 'johannesburg', 'Gauteng', 'launch', true, 'applicant', 1, array['JOHANNESBURG']),
  ('Pretoria', 'pretoria', 'Gauteng', 'recruit', true, 'recruit', 0, '{}'),
  ('Soweto', 'soweto', 'Gauteng', 'recruit', true, 'recruit', 0, '{}'),
  ('Tembisa', 'tembisa', 'Gauteng', 'recruit', true, 'recruit', 0, '{}'),
  ('Springs', 'springs', 'Gauteng', 'recruit', true, 'recruit', 0, '{}'),
  ('Vanderbijlpark', 'vanderbijlpark', 'Gauteng', 'launch', true, 'applicant', 1, '{}'),
  ('Randfontein', 'randfontein', 'Gauteng', 'recruit', true, 'recruit', 0, '{}'),
  ('Kempton Park', 'kempton-park', 'Gauteng', 'launch', true, 'applicant', 1, array['Kempton park'])
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- Free State (9:8 founding +1 non-founding)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Bloemfontein', 'bloemfontein', 'Free State', 'launch', true, 'strong', 3, array['Bloemfontein Free State']),
  ('Bethlehem', 'bethlehem', 'Free State', 'launch', true, 'strong', 3, '{}'),
  ('Harrismith', 'harrismith', 'Free State', 'launch', true, 'strong', 3, '{}'),
  ('Ficksburg', 'ficksburg', 'Free State', 'launch', true, 'strong', 3, '{}'),
  ('Senekal', 'senekal', 'Free State', 'launch', true, 'strong', 2, '{}'),
  ('Ladybrand', 'ladybrand', 'Free State', 'launch', true, 'applicant', 1, '{}'),
  ('Phuthaditjhaba', 'phuthaditjhaba', 'Free State', 'launch', true, 'applicant', 1, '{}'),
  ('Welkom', 'welkom', 'Free State', 'recruit', true, 'recruit', 0, '{}'),
  ('Thaba Nchu', 'thaba-nchu', 'Free State', 'recruit', false, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- KwaZulu-Natal (7)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Durban', 'durban', 'KwaZulu-Natal', 'launch', true, 'applicant', 1, '{}'),
  ('Newcastle', 'newcastle', 'KwaZulu-Natal', 'launch', true, 'strong', 2, '{}'),
  ('Kokstad', 'kokstad', 'KwaZulu-Natal', 'launch', true, 'applicant', 1, '{}'),
  ('Harding', 'harding', 'KwaZulu-Natal', 'launch', true, 'applicant', 1, '{}'),
  ('Greytown', 'greytown', 'KwaZulu-Natal', 'launch', true, 'applicant', 1, '{}'),
  ('Nquthu', 'nquthu', 'KwaZulu-Natal', 'launch', true, 'applicant', 1, '{}'),
  ('Richards Bay', 'richards-bay', 'KwaZulu-Natal', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- Eastern Cape (5)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Matatiele', 'matatiele', 'Eastern Cape', 'launch', true, 'strong', 1, '{}'),
  ('KwaMaqoma', 'kwamaqoma', 'Eastern Cape', 'launch', true, 'applicant', 1, '{}'),
  ('Mthatha', 'mthatha', 'Eastern Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('Gqeberha', 'gqeberha', 'Eastern Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('East London', 'east-london', 'Eastern Cape', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- Mpumalanga (5)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Emalahleni', 'emalahleni', 'Mpumalanga', 'launch', true, 'applicant', 1, '{}'),
  ('Bushbuckridge', 'bushbuckridge', 'Mpumalanga', 'launch', true, 'applicant', 2, array['Bushbukridge']),
  ('Acornhoek', 'acornhoek', 'Mpumalanga', 'launch', true, 'applicant', 1, '{}'),
  ('Sabie', 'sabie', 'Mpumalanga', 'launch', true, 'applicant', 1, array['Sabbie', 'Hazyview']),
  ('Mbombela', 'mbombela', 'Mpumalanga', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- Limpopo (5)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Burgersfort', 'burgersfort', 'Limpopo', 'launch', true, 'strong', 2, array['Burgersford']),
  ('Mokopane', 'mokopane', 'Limpopo', 'launch', true, 'applicant', 1, '{}'),
  ('Polokwane', 'polokwane', 'Limpopo', 'recruit', true, 'recruit', 0, '{}'),
  ('Tzaneen', 'tzaneen', 'Limpopo', 'recruit', true, 'recruit', 0, '{}'),
  ('Thohoyandou', 'thohoyandou', 'Limpopo', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- North West (4)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Brits', 'brits', 'North West', 'launch', true, 'applicant', 1, '{}'),
  ('Rustenburg', 'rustenburg', 'North West', 'recruit', true, 'recruit', 0, '{}'),
  ('Mahikeng', 'mahikeng', 'North West', 'recruit', true, 'recruit', 0, '{}'),
  ('Klerksdorp', 'klerksdorp', 'North West', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- Western Cape (4)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Cape Town', 'cape-town', 'Western Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('George', 'george', 'Western Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('Paarl', 'paarl', 'Western Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('Worcester', 'worcester', 'Western Cape', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- Northern Cape (4)
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count, aliases)
values
  ('Kimberley', 'kimberley', 'Northern Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('Upington', 'upington', 'Northern Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('Kuruman', 'kuruman', 'Northern Cape', 'recruit', true, 'recruit', 0, '{}'),
  ('De Aar', 'de-aar', 'Northern Cape', 'recruit', true, 'recruit', 0, '{}')
on conflict (slug) do update set
  name = excluded.name,
  province = excluded.province,
  is_founding = excluded.is_founding,
  recruitment_status = excluded.recruitment_status,
  applicant_count = excluded.applicant_count,
  aliases = (select array(select distinct unnest(coalesce(uto.towns.aliases, '{}'::text[]) || excluded.aliases))),
  updated_at = now();

-- ============================================================
-- 4. POPULATE town_readiness FOR FOUNDING TOWNS
-- ============================================================
insert into uto.town_readiness (town_id, applicant_count, coordinator_status, launch_readiness_pct)
select id, applicant_count,
  case when recruitment_status in ('strong','applicant') then 'pending' else 'vacant' end,
  case recruitment_status when 'strong' then 15 when 'applicant' then 10 else 0 end
from uto.towns where is_founding = true
on conflict (town_id) do nothing;

-- ============================================================
-- 5. GRANT READ ACCESS (anon + authenticated)
-- ============================================================
grant select on uto.towns to anon, authenticated;
grant select on uto.town_readiness to anon, authenticated;

-- ============================================================
-- 6. RLS POLICIES FOR town_readiness
-- ============================================================
do $$ begin
  create policy "town_readiness_select_anon" on uto.town_readiness
    for select to anon using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "town_readiness_select_auth" on uto.town_readiness
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;
