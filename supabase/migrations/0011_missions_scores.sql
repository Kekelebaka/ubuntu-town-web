-- 0011: MISSIONS, TOWN READINESS & LEADERBOARD
-- Daily heartbeat + friendly competition

create table if not exists uto.missions(
  id uuid primary key default gen_random_uuid(),
  key text unique not null, title text not null, description text,
  work_type uto.work_type,                 -- null = any type
  target_count int not null default 1,
  cadence text not null default 'daily',   -- daily | weekly | once
  town_id uuid,                            -- null = global
  active boolean not null default true
);
alter table uto.missions enable row level security;
create policy missions_read on uto.missions for select to authenticated using (true);
grant select on uto.missions to authenticated;

-- progress derived from community_work (no client writes to scores)
create or replace function uto.my_missions(_town_id uuid)
returns table(key text, title text, target int, done int, complete boolean)
language sql stable security definer set search_path='' as $$
  select m.key, m.title, m.target_count,
    (select count(*) from uto.community_work cw
       where cw.created_by = auth.uid()
         and (m.work_type is null or cw.type = m.work_type)
         and (m.town_id is null or cw.town_id = m.town_id)
         and cw.created_at >= case m.cadence
              when 'weekly' then date_trunc('week', now())
              when 'daily'  then date_trunc('day',  now())
              else '-infinity'::timestamptz end)::int as done,
    false
  from uto.missions m
  where m.active and (m.town_id is null or m.town_id = _town_id);
$$;
grant execute on function uto.my_missions(uuid) to authenticated;

-- Town Readiness Score 0-100 (coverage + volume + verification)
create or replace function uto.readiness_score(_town_id uuid) returns int
language sql stable security definer set search_path='' as $$
  with pub as (select count(distinct type) c, count(*) n,
                      count(*) filter (where photo_verified and gps_verified) vf
               from uto.community_work where town_id=_town_id and status='published')
  select least(100,
     (select c from pub)*10                                   -- type coverage (max ~ types*10)
   + least(50,(select n from pub))                            -- volume (cap 50)
   + case when (select n from pub)>0
          then round(40.0*(select vf from pub)/(select n from pub)) else 0 end  -- verified %
  )::int;
$$;
grant execute on function uto.readiness_score(uuid) to authenticated, anon;

-- Index for performance
create index if not exists cw_missions_idx on uto.community_work(town_id, type, status, created_by, created_at);

-- Seed 10 bootcamp missions
insert into uto.missions(key, title, description, work_type, target_count, cadence) values
  ('daycare_os', '🧸 Daycare OS', 'Register a daycare', 'daycare', 1, 'once'),
  ('kasibuy', '🛒 KasiBuy', 'Add a local business', 'business', 1, 'once'),
  ('fixeasy24', '🔧 FixEasy24', 'Register a fixer', 'fixeasy_worker', 1, 'once'),
  ('inside_town', '🎙️ Inside.Town', 'Upload a podcast episode', 'podcast', 1, 'once'),
  ('familyhouse', '🏠 FamilyHouse', 'List a family house', 'familyhouse', 1, 'once'),
  ('event', '🎉 Community Event', 'Post an event', 'event', 1, 'weekly'),
  ('daily_capture', '📸 Daily Capture', 'Add any community work today', null, 1, 'daily'),
  ('weekly_volume', '📈 Weekly Volume', 'Publish 3 items this week', null, 3, 'weekly'),
  ('verified_record', '✅ Verified Record', 'Get a record fully verified', null, 1, 'once'),
  ('town_champion', '🏆 Town Champion', 'Reach readiness score 80', null, 1, 'once')
on conflict (key) do nothing;
