-- =====================================================================
-- Ubuntu Town — Identity bridge: mirror auth.users -> uto.users
-- Production-safe, idempotent. Apply via a PRIVILEGED migration
-- (supabase CLI / apply_migration), NOT via the REST API — creating a
-- trigger on auth.users requires the postgres/admin role.
--
-- Verified against the live schema (project ubuntu-town-os):
--   uto.users(id uuid NOT NULL no-default; email/phone/whatsapp nullable;
--             primary_role uto.role_key default 'viewer'; created_at default now())
--   uto.role_assignments: PK id default gen_random_uuid();
--             UNIQUE(user_id, role_key, town_id); granted_by/town_id nullable
--   auth.users has email + phone
-- =====================================================================

create schema if not exists app;   -- private (unexposed) home for the trigger fn

-- 1) MIRROR FUNCTION --------------------------------------------------
-- SECURITY DEFINER: runs as its owner (postgres) so it can write uto.users
-- during a signup that executes as supabase_auth_admin.
-- DEFENSIVE: a mirror failure must NEVER abort an auth signup, so every
-- write is wrapped and downgraded to a WARNING. search_path is pinned.
create or replace function app.sync_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    begin
      insert into uto.users (id, email, phone)
      values (new.id, new.email, new.phone)
      on conflict (id) do nothing;
    exception when others then
      raise warning '[sync_user_from_auth] insert failed for %: %', new.id, sqlerrm;
    end;

  elsif tg_op = 'UPDATE' then
    begin
      update uto.users
         set email = new.email,
             phone = new.phone
       where id = new.id
         and (email is distinct from new.email or phone is distinct from new.phone);
    exception when others then
      raise warning '[sync_user_from_auth] update failed for %: %', new.id, sqlerrm;
    end;
  end if;

  return new;  -- AFTER trigger: return value is ignored
end;
$$;

-- keep it uncallable via the API surface (defence in depth)
revoke all on function app.sync_user_from_auth() from public, anon, authenticated;

-- 2) TRIGGER ON auth.users -------------------------------------------
drop trigger if exists on_auth_user_synced_uto on auth.users;
create trigger on_auth_user_synced_uto
  after insert or update of email, phone on auth.users
  for each row execute function app.sync_user_from_auth();

-- 3) BACKFILL EXISTING USERS (idempotent) ----------------------------
insert into uto.users (id, email, phone)
select id, email, phone
from auth.users
on conflict (id) do nothing;

-- 4) BOOTSTRAP THE FIRST COORDINATOR (idempotent) --------------------
-- Grants the 'coordinator' role for Bushbuckridge to ONE named user.
-- >>> Replace the email below with the real coordinator's auth email. <<<
-- (Runs as a safe no-op if the email doesn't match — it won't error.)
insert into uto.role_assignments (user_id, role_key, town_id)
select u.id, 'coordinator'::uto.role_key, t.id
from auth.users u
join uto.towns t on t.slug = 'bushbuckridge'
where u.email = 'REPLACE_WITH_COORDINATOR_EMAIL'
on conflict (user_id, role_key, town_id) do nothing;

-- Single-user DEV shortcut (do NOT use in prod): grant to every current user
-- insert into uto.role_assignments (user_id, role_key, town_id)
-- select u.id, 'coordinator'::uto.role_key, t.id
-- from auth.users u join uto.towns t on t.slug = 'bushbuckridge'
-- on conflict (user_id, role_key, town_id) do nothing;

-- 5) VERIFY (expect uto_users >= auth_users, coord_grants >= 1) -------
select
  (select count(*) from auth.users)                                   as auth_users,
  (select count(*) from uto.users)                                    as uto_users,
  (select count(*) from uto.role_assignments where role_key='coordinator') as coord_grants;

-- OPTIONAL — stronger integrity (enable deliberately, NOT by default):
--   alter table uto.users
--     add constraint uto_users_auth_fk
--     foreign key (id) references auth.users(id) on delete cascade;
--   -- WARNING: ON DELETE CASCADE means deleting an auth user also removes
--   -- their uto.users row and anything FK'd to it (coordinators, profiles,
--   -- role_assignments). Prefer a deliberate POPIA data-subject-deletion
--   -- flow over a silent cascade in production.
-- =====================================================================
