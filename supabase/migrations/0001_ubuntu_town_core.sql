-- ============================================================================
-- Ubuntu Town OS — Canonical Core Model  (Phase 2)
-- Target: Supabase Postgres 17 · project ubuntu-town-os (afiokbhuxfdacbsipoqk)
-- Idempotent DDL. Apply with: supabase db push  (or the MCP apply_migration)
-- RLS + RBAC policies live in 0002_rls_rbac.sql (apply AFTER this file).
-- NOTE: project is currently PAUSED — resume before applying.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ---------- shared: updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- enums ----------
do $$ begin
  create type role_key as enum ('admin','ops','coordinator','deputy','ambassador','media','partner','sponsor','viewer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type application_band as enum ('A','A-','B','B+','C','C+','D');
exception when duplicate_object then null; end $$;
do $$ begin
  create type application_status as enum ('received','assessed','interview','approved','onboarding','active','declined','hold');
exception when duplicate_object then null; end $$;
do $$ begin
  create type town_status as enum ('launch','pilot','support','recruit');
exception when duplicate_object then null; end $$;
do $$ begin
  create type signal_status as enum ('new','triaged','opportunity','workpacked','closed','rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type op_point_type as enum ('connect','upgrade','transform');
exception when duplicate_object then null; end $$;
do $$ begin
  create type op_point_status as enum ('identified','assessed','partnered','funded','active','inactive');
exception when duplicate_object then null; end $$;
do $$ begin
  create type wp_status as enum ('identified','assessed','partnered','funded','implemented','operating','abandoned');
exception when duplicate_object then null; end $$;
do $$ begin
  create type proof_status as enum ('pending','approved','returned','rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payout_status as enum ('draft','approved','paid','void');
exception when duplicate_object then null; end $$;
do $$ begin
  create type comm_channel as enum ('email','whatsapp','sms','push','in_app');
exception when duplicate_object then null; end $$;
do $$ begin
  create type comm_status as enum ('draft','scheduled','sending','sent','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type contact_type as enum ('applicant','coordinator','partner','investor','municipality','business','media','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type media_kind as enum ('image','audio','video','document');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1. GEOGRAPHY / TENANCY
-- ============================================================================
create table if not exists municipalities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  district      text,
  province      text not null,
  created_at    timestamptz not null default now()
);

create table if not exists towns (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text unique not null,
  municipality_id     uuid references municipalities(id) on delete set null,
  province            text not null,
  archetype           text,
  population_estimate integer,
  status              town_status not null default 'recruit',
  opportunity_notes   text,
  lat                 double precision,
  lng                 double precision,
  aliases             text[] default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_towns_province on towns(province);
create index if not exists idx_towns_status on towns(status);

-- ============================================================================
-- 2. IDENTITY / RBAC
-- ============================================================================
-- users mirrors auth.users (1:1). Populate via a trigger on auth.users in prod.
create table if not exists users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique,
  phone         text,
  whatsapp      text,
  primary_role  role_key not null default 'viewer',
  created_at    timestamptz not null default now()
);

create table if not exists profiles (
  id                uuid primary key references users(id) on delete cascade,
  display_name      text,
  avatar_url        text,
  town_id           uuid references towns(id) on delete set null,
  facts             jsonb not null default '{}',
  field_visibility  jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists roles (
  id           uuid primary key default gen_random_uuid(),
  key          role_key unique not null,
  name         text not null,
  description  text,
  permissions  jsonb not null default '{}'
);

-- a user may hold a role globally (town_id null) or scoped to a town
create table if not exists role_assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  role_key    role_key not null,
  town_id     uuid references towns(id) on delete cascade,
  granted_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (user_id, role_key, town_id)
);
create index if not exists idx_role_assign_user on role_assignments(user_id);
create index if not exists idx_role_assign_town on role_assignments(town_id);

-- ============================================================================
-- 3. RECRUITMENT / COORDINATORS
-- ============================================================================
create table if not exists applications (
  id             uuid primary key default gen_random_uuid(),
  submission_id  text,
  full_name      text not null,
  email          text,
  phone          text,
  town_id        uuid references towns(id) on delete set null,
  town_name_raw  text,          -- preserved from import before town match
  province       text,
  role_track     text,
  ecosystem_fit  text,
  score          numeric(5,2),
  band           application_band,
  town_status_at_apply town_status,
  sub_scores     jsonb not null default '{}',
  form_answers   jsonb not null default '{}',
  status         application_status not null default 'received',
  source         text default 'mailchimp_pack',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_applications_town on applications(town_id);
create index if not exists idx_applications_status on applications(status);

create table if not exists coordinators (
  id                 uuid primary key references users(id) on delete cascade,
  application_id     uuid references applications(id) on delete set null,
  display_name       text,
  phone              text,
  town_id            uuid references towns(id) on delete set null,
  band               application_band,
  status             text not null default 'onboarding',   -- onboarding|active|paused|exited
  reliability_score  numeric(5,2) default 0,
  started_at         date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists coordinator_assignments (
  id             uuid primary key default gen_random_uuid(),
  coordinator_id uuid not null references coordinators(id) on delete cascade,
  town_id        uuid not null references towns(id) on delete cascade,
  role_key       role_key not null default 'coordinator',
  status         text not null default 'active',
  assigned_at    timestamptz not null default now(),
  ended_at       timestamptz
);
create index if not exists idx_coord_assign_town on coordinator_assignments(town_id);

-- ============================================================================
-- 4. MEDIA (Supabase Storage / R2 pointers)
-- ============================================================================
create table if not exists media_assets (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null default 'proofs',
  path         text,
  r2_key       text,
  kind         media_kind not null default 'image',
  mime_type    text,
  bytes        bigint,
  owner_type   text,             -- 'proof' | 'story' | 'profile' | ...
  owner_id     uuid,
  uploaded_by  uuid references users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- 5. THE OS LOOP: signals -> opportunity points -> workpacks -> proofs -> memory
-- ============================================================================
create table if not exists signals (
  id            uuid primary key default gen_random_uuid(),
  town_id       uuid references towns(id) on delete set null,
  created_by    uuid references users(id) on delete set null,
  title         text not null,
  description   text,
  category      text,
  source        text,            -- 'field'|'whatsapp'|'web'|'import'
  status        signal_status not null default 'new',
  lat           double precision,
  lng           double precision,
  media_asset_id uuid references media_assets(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_signals_town on signals(town_id);
create index if not exists idx_signals_status on signals(status);

create table if not exists opportunity_points (
  id             uuid primary key default gen_random_uuid(),
  town_id        uuid not null references towns(id) on delete cascade,
  signal_id      uuid references signals(id) on delete set null,
  name           text not null,
  type           op_point_type not null default 'connect',
  status         op_point_status not null default 'identified',
  owner_name     text,
  owner_contact  text,
  node           text,            -- AI Café | KasiBuy | FixEasy24 | ...
  lat            double precision,
  lng            double precision,
  activated_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_oppoints_town on opportunity_points(town_id);

create table if not exists workpacks (          -- reusable templates
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,
  title         text not null,
  intent        text,
  ecosystem     text,
  node          text,
  steps         jsonb not null default '[]',
  proof_required jsonb not null default '[]',
  is_template   boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists workpack_instances (
  id                   uuid primary key default gen_random_uuid(),
  workpack_id          uuid references workpacks(id) on delete set null,
  town_id              uuid not null references towns(id) on delete cascade,
  opportunity_point_id uuid references opportunity_points(id) on delete set null,
  signal_id            uuid references signals(id) on delete set null,
  assigned_to          uuid references coordinators(id) on delete set null,
  title                text,
  status               wp_status not null default 'identified',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_wpi_town on workpack_instances(town_id);
create index if not exists idx_wpi_assignee on workpack_instances(assigned_to);

create table if not exists proofs (
  id                    uuid primary key default gen_random_uuid(),
  workpack_instance_id  uuid references workpack_instances(id) on delete cascade,
  coordinator_id        uuid references coordinators(id) on delete set null,
  kind                  text,
  media_asset_id        uuid references media_assets(id) on delete set null,
  lat                   double precision,
  lng                   double precision,
  notes                 text,
  status                proof_status not null default 'pending',
  kopano_recommendation jsonb,          -- AI suggests; human approves
  reviewed_by           uuid references users(id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now()
);
create index if not exists idx_proofs_wpi on proofs(workpack_instance_id);
create index if not exists idx_proofs_status on proofs(status);

-- town memory: reviewed work feeds back into a durable record
create table if not exists memories (
  id            uuid primary key default gen_random_uuid(),
  town_id       uuid references towns(id) on delete cascade,
  subject_type  text,             -- 'opportunity_point' | 'workpack_instance' | 'proof'
  subject_id    uuid,
  summary       text not null,
  payload       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists idx_memories_town on memories(town_id);

-- ============================================================================
-- 6. LOCAL ECONOMY
-- ============================================================================
create table if not exists businesses (
  id                    uuid primary key default gen_random_uuid(),
  town_id               uuid references towns(id) on delete set null,
  opportunity_point_id  uuid references opportunity_points(id) on delete set null,
  name                  text not null,
  category              text,
  owner_profile_id      uuid references profiles(id) on delete set null,
  is_verified           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists town_scores (            -- unified Opportunity Index
  id                    uuid primary key default gen_random_uuid(),
  town_id               uuid not null references towns(id) on delete cascade,
  period                date not null default current_date,
  opportunity_index     numeric(5,2),
  youth_population       numeric(5,2),
  vacant_spaces          numeric(5,2),
  connectivity           numeric(5,2),
  entrepreneurship       numeric(5,2),
  coordinator_readiness  numeric(5,2),
  funding_availability   numeric(5,2),
  computed_at           timestamptz not null default now(),
  unique (town_id, period)
);

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  town_id     uuid references towns(id) on delete set null,
  title       text not null,
  description text,
  event_date  timestamptz,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists stories (
  id             uuid primary key default gen_random_uuid(),
  town_id        uuid references towns(id) on delete set null,
  title          text not null,
  content        text,
  author_name    text,
  media_asset_id uuid references media_assets(id) on delete set null,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================================
-- 7. REVENUE-SHARE / EARNINGS  (the missing ledger)
-- ============================================================================
create table if not exists payout_runs (
  id            uuid primary key default gen_random_uuid(),
  period_start  date not null,
  period_end    date not null,
  town_id       uuid references towns(id) on delete set null,
  status        payout_status not null default 'draft',
  total_amount  numeric(12,2) not null default 0,
  created_by    uuid references users(id) on delete set null,
  approved_by   uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists payout_lines (
  id                  uuid primary key default gen_random_uuid(),
  payout_run_id       uuid not null references payout_runs(id) on delete cascade,
  coordinator_id      uuid references coordinators(id) on delete set null,
  role_key            role_key,
  revenue_share_amount numeric(12,2) not null default 0,
  stipend_amount       numeric(12,2) not null default 0,
  total_amount         numeric(12,2) not null default 0,
  status              payout_status not null default 'draft',
  notes               text,
  created_at          timestamptz not null default now()
);
create index if not exists idx_payout_lines_run on payout_lines(payout_run_id);
create index if not exists idx_payout_lines_coord on payout_lines(coordinator_id);

-- running earnings per coordinator per period (replaces coordinators.earnings JSON blob)
create table if not exists earnings (
  id             uuid primary key default gen_random_uuid(),
  coordinator_id uuid not null references coordinators(id) on delete cascade,
  period         date not null,
  revenue_share  numeric(12,2) not null default 0,
  stipend        numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  source         jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  unique (coordinator_id, period)
);

-- ============================================================================
-- 8. COMMUNICATIONS + CRM  (UhuruMail comms operating system)
-- ============================================================================
create table if not exists crm_contacts (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  email        text,
  phone        text,
  whatsapp     text,
  type         contact_type not null default 'other',
  town_id      uuid references towns(id) on delete set null,
  tags         text[] default '{}',
  external_ids jsonb not null default '{}',   -- {uhurumail_id, mailchimp_id, ...}
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_crm_contacts_type on crm_contacts(type);
create index if not exists idx_crm_contacts_email on crm_contacts(email);

create table if not exists crm_activities (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid not null references crm_contacts(id) on delete cascade,
  activity_type text not null,        -- 'email_sent'|'whatsapp'|'call'|'note'|...
  notes         text,
  occurred_at   timestamptz not null default now(),
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists communications (
  id            uuid primary key default gen_random_uuid(),
  channel       comm_channel not null default 'email',
  provider      text default 'uhurumail',    -- uhurumail | mailchimp | whatsapp
  template_key  text,
  subject       text,
  audience      jsonb not null default '{}',  -- segment definition
  status        comm_status not null default 'draft',
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  stats         jsonb not null default '{}',  -- opens/clicks/delivered
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- 9. AUDIT
-- ============================================================================
create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references users(id) on delete set null,
  action       text not null,
  entity_type  text,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  ip           inet,
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_logs(entity_type, entity_id);
create index if not exists idx_audit_actor on audit_logs(actor_id);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array[
    'towns','profiles','applications','coordinators','signals','opportunity_points',
    'workpack_instances','businesses','crm_contacts'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ---------- seed the role catalogue ----------
insert into roles (key, name, description) values
  ('admin','Administrator','Full platform access'),
  ('ops','Operations','National ops + review'),
  ('coordinator','Founding Town Coordinator','Leads a town'),
  ('deputy','Deputy / Admin Lead','Runs town operations'),
  ('ambassador','Youth Opportunity Ambassador','Field engine'),
  ('media','Inside Town Media','Storyteller'),
  ('partner','Partner','External partner'),
  ('sponsor','Sponsor','Funder'),
  ('viewer','Viewer','Read-only')
on conflict (key) do nothing;

-- ============================================================================
-- END 0001 — apply 0002_rls_rbac.sql next
-- ============================================================================
