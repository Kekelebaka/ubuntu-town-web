-- Founding 50 reconciliation + Town Readiness dashboard
alter table uto.towns add column if not exists is_founding boolean not null default false;
alter table uto.towns add column if not exists recruitment_status text;
alter table uto.towns add column if not exists applicant_count integer not null default 0;
update uto.towns set name='Johannesburg', slug='johannesburg', province='Gauteng', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array['JOHANNESBURG']::text[]))), updated_at=now() where name='JOHANNESBURG';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Pretoria','pretoria','Gauteng','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Soweto','soweto','Gauteng','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Tembisa','tembisa','Gauteng','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Springs','springs','Gauteng','recruit',true,'recruit',0);
update uto.towns set name='Vanderbijlpark', slug='vanderbijlpark', province='Gauteng', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Vanderbijlpark';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Randfontein','randfontein','Gauteng','recruit',true,'recruit',0);
update uto.towns set name='Kempton Park', slug='kempton-park', province='Gauteng', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array['Kempton park']::text[]))), updated_at=now() where name='Kempton park';
update uto.towns set name='Bloemfontein', slug='bloemfontein', province='Free State', is_founding=true, recruitment_status='strong', applicant_count=3, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array['Bloemfontein Free State']::text[]))), updated_at=now() where name='Bloemfontein';
update uto.towns set name='Bethlehem', slug='bethlehem', province='Free State', is_founding=true, recruitment_status='strong', applicant_count=3, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Bethlehem';
update uto.towns set name='Harrismith', slug='harrismith', province='Free State', is_founding=true, recruitment_status='strong', applicant_count=3, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Harrismith';
update uto.towns set name='Ficksburg', slug='ficksburg', province='Free State', is_founding=true, recruitment_status='strong', applicant_count=3, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Ficksburg';
update uto.towns set name='Senekal', slug='senekal', province='Free State', is_founding=true, recruitment_status='strong', applicant_count=2, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Senekal';
update uto.towns set name='Ladybrand', slug='ladybrand', province='Free State', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Ladybrand';
update uto.towns set name='Phuthaditjhaba', slug='phuthaditjhaba', province='Free State', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Phuthaditjhaba';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Welkom','welkom','Free State','recruit',true,'recruit',0);
update uto.towns set name='Durban', slug='durban', province='KwaZulu-Natal', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Durban';
update uto.towns set name='Newcastle', slug='newcastle', province='KwaZulu-Natal', is_founding=true, recruitment_status='strong', applicant_count=2, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Newcastle';
update uto.towns set name='Kokstad', slug='kokstad', province='KwaZulu-Natal', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Kokstad';
update uto.towns set name='Harding', slug='harding', province='KwaZulu-Natal', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Harding';
update uto.towns set name='Greytown', slug='greytown', province='KwaZulu-Natal', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Greytown';
update uto.towns set name='Nquthu', slug='nquthu', province='KwaZulu-Natal', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Nquthu';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Richards Bay','richards-bay','KwaZulu-Natal','recruit',true,'recruit',0);
update uto.towns set name='Matatiele', slug='matatiele', province='Eastern Cape', is_founding=true, recruitment_status='strong', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Matatiele';
update uto.towns set name='KwaMaqoma', slug='kwamaqoma', province='Eastern Cape', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='KwaMaqoma';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Mthatha','mthatha','Eastern Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Gqeberha','gqeberha','Eastern Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('East London','east-london','Eastern Cape','recruit',true,'recruit',0);
update uto.towns set name='Emalahleni', slug='emalahleni', province='Mpumalanga', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Emalahleni';
update uto.towns set name='Bushbuckridge', slug='bushbuckridge', province='Mpumalanga', is_founding=true, recruitment_status='applicant', applicant_count=2, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array['Bushbukridge']::text[]))), updated_at=now() where name='Bushbuckridge';
update uto.towns set name='Acornhoek', slug='acornhoek', province='Mpumalanga', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Acornhoek';
update uto.towns set name='Sabie', slug='sabie', province='Mpumalanga', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array['Sabbie','Hazyview']::text[]))), updated_at=now() where name='Sabie';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Mbombela','mbombela','Mpumalanga','recruit',true,'recruit',0);
update uto.towns set name='Burgersfort', slug='burgersfort', province='Limpopo', is_founding=true, recruitment_status='strong', applicant_count=2, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || array['Burgersford']::text[]))), updated_at=now() where name='Burgersfort';
update uto.towns set name='Mokopane', slug='mokopane', province='Limpopo', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Mokopane';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Polokwane','polokwane','Limpopo','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Tzaneen','tzaneen','Limpopo','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Thohoyandou','thohoyandou','Limpopo','recruit',true,'recruit',0);
update uto.towns set name='Brits', slug='brits', province='North West', is_founding=true, recruitment_status='applicant', applicant_count=1, aliases=(select array(select distinct unnest(coalesce(aliases,'{}'::text[]) || '{}'::text[]))), updated_at=now() where name='Brits';
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Rustenburg','rustenburg','North West','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Mahikeng','mahikeng','North West','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Klerksdorp','klerksdorp','North West','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Cape Town','cape-town','Western Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('George','george','Western Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Paarl','paarl','Western Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Worcester','worcester','Western Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Kimberley','kimberley','Northern Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Upington','upington','Northern Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('Kuruman','kuruman','Northern Cape','recruit',true,'recruit',0);
insert into uto.towns (name, slug, province, status, is_founding, recruitment_status, applicant_count) values ('De Aar','de-aar','Northern Cape','recruit',true,'recruit',0);
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
insert into uto.town_readiness (town_id, applicant_count, coordinator_status, launch_readiness_pct)
select id, applicant_count,
  case when recruitment_status in ('strong','applicant') then 'pending' else 'vacant' end,
  case recruitment_status when 'strong' then 15 when 'applicant' then 10 else 0 end
from uto.towns where is_founding = true
on conflict (town_id) do nothing;