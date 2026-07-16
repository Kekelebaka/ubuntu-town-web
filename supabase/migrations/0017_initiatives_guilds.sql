-- 0017 · INITIATIVE + GUILD ASSIGNMENTS
-- The matrix: every coordinator belongs to a town AND to one-or-more
-- initiatives AND (optionally) to guilds. Initiative owners report nationally,
-- NOT through provinces. Guilds belong to the Builders Fellowship.

-- ─── INITIATIVES (reference) ──────────────────────────────────────────────
create table if not exists uto.initiatives(
  key text primary key,               -- 'daycare_os', 'kasibuy', 'fixeasy', ...
  name text not null,
  description text,
  owner_user_id uuid references auth.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table uto.initiatives enable row level security;
create policy initiatives_read on uto.initiatives for select to anon, authenticated using (true);
grant select on uto.initiatives to anon, authenticated;

-- Seed the 10 Ubuntu Town initiatives
insert into uto.initiatives(key, name) values
  ('daycare_os','Ubuntu Daycare OS'),
  ('kasibuy','KasiBuy'),
  ('fixeasy','FixEasy24'),
  ('inside_town','Inside.Town'),
  ('ubuntu_academy','Ubuntu Academy'),
  ('familyhouse','FamilyHouse'),
  ('framesouth','FrameSouth'),
  ('ai_cafe','AI Café'),
  ('orbit_music','Orbit Music'),
  ('ecochar','EcoChar')
on conflict (key) do nothing;

-- ─── INITIATIVE ASSIGNMENTS ───────────────────────────────────────────────
create table if not exists uto.initiative_assignments(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  initiative_key text not null references uto.initiatives(key) on delete cascade,
  role text not null default 'member',   -- 'owner' | 'member'
  created_at timestamptz not null default now(),
  unique(user_id, initiative_key)
);
alter table uto.initiative_assignments enable row level security;
create policy ia_read on uto.initiative_assignments for select to authenticated using (true);
create policy ia_write on uto.initiative_assignments for all to authenticated
  using (user_id = auth.uid() or app.is_national()) with check (user_id = auth.uid());
grant select, insert, update, delete on uto.initiative_assignments to authenticated;

-- ─── GUILDS (reference) ───────────────────────────────────────────────────
create table if not exists uto.guilds(
  key text primary key,
  name text not null,
  description text,
  lead_user_id uuid references auth.users(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table uto.guilds enable row level security;
create policy guilds_read on uto.guilds for select to anon, authenticated using (true);
grant select on uto.guilds to anon, authenticated;

-- Seed the 10 Builders Fellowship guilds
insert into uto.guilds(key, name) values
  ('engineering','Engineering Guild'),
  ('ai','AI Guild'),
  ('design','Design Guild'),
  ('media','Media Guild'),
  ('gis','GIS Guild'),
  ('education','Education Guild'),
  ('community','Community Guild'),
  ('research','Research Guild'),
  ('data','Data Guild'),
  ('security','Security Guild')
on conflict (key) do nothing;

-- ─── GUILD ASSIGNMENTS ────────────────────────────────────────────────────
create table if not exists uto.guild_assignments(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guild_key text not null references uto.guilds(key) on delete cascade,
  role text not null default 'member',   -- 'lead' | 'member'
  created_at timestamptz not null default now(),
  unique(user_id, guild_key)
);
alter table uto.guild_assignments enable row level security;
create policy ga_read on uto.guild_assignments for select to authenticated using (true);
create policy ga_write on uto.guild_assignments for all to authenticated
  using (user_id = auth.uid() or app.is_national()) with check (user_id = auth.uid());
grant select, insert, update, delete on uto.guild_assignments to authenticated;

-- ─── HELPER RPCs ──────────────────────────────────────────────────────────
-- Caller's full scope context. Returned by the workspace on load.
create or replace function uto.my_scope()
returns table(
  user_id uuid,
  town_id uuid, town_name text, role uto.role_key,
  provinces jsonb,
  initiatives jsonb,
  guilds jsonb
)
language sql stable security definer set search_path='' as $$
  select
    auth.uid(),
    ra.town_id,
    coalesce((select t.name from uto.towns t where t.id = ra.town_id), null::text),
    ra.role_key,
    coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'role', ra2.role_key))
              from uto.role_assignments ra2
              join uto.provinces p on p.id = ra2.province_id
              where ra2.user_id = auth.uid() and ra2.role_key in ('province','district')),
             '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', ia.initiative_key, 'name', i.name, 'role', ia.role))
              from uto.initiative_assignments ia
              join uto.initiatives i on i.key = ia.initiative_key
              where ia.user_id = auth.uid()),
             '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', ga.guild_key, 'name', g.name, 'role', ga.role))
              from uto.guild_assignments ga
              join uto.guilds g on g.key = ga.guild_key
              where ga.user_id = auth.uid()),
             '[]'::jsonb)
  from uto.role_assignments ra
  where ra.user_id = auth.uid()
    and ra.role_key in ('coordinator','deputy','admin','ops','province','district','moderator')
  limit 1;
$$;
grant execute on function uto.my_scope() to authenticated;
