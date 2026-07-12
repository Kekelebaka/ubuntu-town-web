-- ============================================================================
-- Ubuntu Town OS — Identity Bridge (0004)
-- Target: Supabase Postgres 17 · project ubuntu-town-os (afiokbhuxfdacbsipoqk)
-- Applied AFTER 0003. Additive & reversible.
--
-- Bridges auth.users → uto.users so RLS resolves correctly.
-- Until this runs, role_assignments is empty and RLS denies everyone.
-- ============================================================================

-- ============================================================================
-- 1. BACKFILL: Copy existing auth.users into uto.users
-- ============================================================================

insert into users (id, email, phone)
select
  au.id,
  au.email,
  au.phone
from auth.users au
on conflict (id) do update set
  email = excluded.email,
  phone = excluded.phone;

-- ============================================================================
-- 2. TRIGGER: Auto-sync new auth.users → uto.users on signup
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (id) do update set
    email = excluded.email,
    phone = excluded.phone;
  return new;
end;
$$;

-- Drop if exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- 3. GRANT COORDINATOR ROLE FOR BUSHBUCKRIDGE
-- ============================================================================
-- This makes the first authenticated user a coordinator of Bushbuckridge.
-- In production, you'd do this manually per user. For the vertical slice,
-- we create a function that can be called with a user_id.

create or replace function app.grant_coordinator(
  target_user_id uuid,
  target_town_slug text default 'bushbuckridge'
)
returns void language plpgsql security definer set search_path = public as $$
declare
  _town_id uuid;
begin
  -- Find the town
  select id into _town_id from towns where slug = target_town_slug;
  if _town_id is null then
    raise exception 'Town not found: %', target_town_slug;
  end if;

  -- Ensure user exists in uto.users
  insert into users (id) values (target_user_id)
  on conflict (id) do nothing;

  -- Grant coordinator role
  insert into role_assignments (user_id, role_key, town_id)
  values (target_user_id, 'coordinator', _town_id)
  on conflict (user_id, role_key, town_id) do nothing;
end;
$$;

-- Grant execute to service_role only (admin function)
-- The service-role key bypasses RLS, so this is safe
grant execute on function app.grant_coordinator(uuid, text) to service_role;

-- ============================================================================
-- 4. VERIFICATION FUNCTION: Check if identity bridge is working
-- ============================================================================

create or replace function app.verify_identity_bridge()
returns table (
  check_name text,
  result boolean,
  detail text
) language plpgsql security definer set search_path = public as $$
begin
  -- Check 1: auth.users count
  return query
  select
    'auth.users has rows'::text,
    exists(select 1 from auth.users),
    (select count(*)::text || ' users in auth.users' from auth.users);

  -- Check 2: uto.users count
  return query
  select
    'uto.users has rows'::text,
    exists(select 1 from users),
    (select count(*)::text || ' users in uto.users' from users);

  -- Check 3: 1:1 match
  return query
  select
    'auth.users = uto.users (1:1)'::text,
    not exists(select 1 from auth.users au where not exists(select 1 from users u where u.id = au.id)),
    'All auth.users have corresponding uto.users'::text;

  -- Check 4: role_assignments has data
  return query
  select
    'role_assignments has rows'::text,
    exists(select 1 from role_assignments),
    (select count(*)::text || ' role assignments' from role_assignments);

  -- Check 5: Bushbuckridge has a coordinator
  return query
  select
    'Bushbuckridge has coordinator'::text,
    exists(
      select 1 from role_assignments ra
      join towns t on t.id = ra.town_id
      where ra.role_key = 'coordinator' and t.slug = 'bushbuckridge'
    ),
    'Coordinator role assigned for Bushbuckridge'::text;
end;
$$;

grant execute on function app.verify_identity_bridge() to authenticated;

-- ============================================================================
-- 5. HELPER: set_jwt_claims for RLS testing
-- ============================================================================
-- Usage: select set_config('request.jwt.claims', '{"sub":"<user-uuid>"}', true);
-- Then:  set role authenticated;
-- This simulates an authenticated user for testing RLS policies.

-- ============================================================================
-- END 0004 — identity bridge complete
-- ============================================================================
