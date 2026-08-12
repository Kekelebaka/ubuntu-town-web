-- Ubuntu Town OS v1 Schema
-- Generated from offline-core types (LocalRecord, LocalProfileRecord, etc.)
-- Digital Twin First. Marketplace Second. AI Layer Always Present.

-- 1. Core Entities
create table provinces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);create table users (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  phone text,
  role text not null default 'citizen', -- citizen, coordinator, partner, admin
  created_at timestamptz default now()
);-- 2. Profiles & CV (90% Migrate from LocalProfileRecord, LocalCvDraftRecord)
-- Create profiles first (before towns) to resolve circular dependency
create table profiles (
  id uuid references users(id) on delete cascade primary key,
  display_name text,
  town_id uuid,
  facts jsonb default '{}',
  field_visibility jsonb default '{}', -- private, admin_only, profile_visible, public
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);create table towns (
  id uuid default gen_random_uuid() primary key,
  province_id uuid references provinces(id) on delete cascade,
  name text not null,
  slug text not null unique,
  archetype text, -- "rural", "peri-urban", "metropolitan"
  population_estimate int,
  coordinator_id uuid,
  created_at timestamptz default now()
);-- Now add foreign key constraints for circular references
alter table profiles add constraint profiles_town_id_fkey foreign key (town_id) references towns(id) on delete cascade;alter table towns add constraint towns_coordinator_id_fkey foreign key (coordinator_id) references profiles(id) on delete set null;create table cv_profiles (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  title text,
  sections jsonb default '{}',
  status text default 'draft', -- draft, review, published
  created_at timestamptz default now()
);-- 3. Businesses & Services (New)
create table businesses (
  id uuid default gen_random_uuid() primary key,
  town_id uuid references towns(id) on delete cascade,
  name text not null,
  category text, -- kasibuy, fixeasy24, tutoring, etc.
  owner_profile_id uuid references profiles(id),
  is_verified boolean default false,
  created_at timestamptz default now()
);create table services (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references businesses(id) on delete cascade,
  title text,
  description text,
  price_range text,
  created_at timestamptz default now()
);-- 4. Opportunities (90% Migrate from LocalOpportunityRecord)
create table opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  source text, -- government, private, ngos, etc.
  type text, -- job, training, bursary, internship, tender
  town_id uuid references towns(id) on delete cascade,
  deadline_date date,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);-- 5. Signals (80% Migrate from LocalTownSignalQueueRecord)
create table town_signals (
  id uuid default gen_random_uuid() primary key,
  town_id uuid references towns(id) on delete cascade,
  user_id uuid references users(id),
  category text, -- issue, opportunity, update, business
  title text,
  description text,
  status text default 'pending', -- pending, reviewed, active
  created_at timestamptz default now()
);-- 6. Events (New - extends sync_events)
create table events (
  id uuid default gen_random_uuid() primary key,
  town_id uuid references towns(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz,
  created_at timestamptz default now()
);-- 7. Stories & Media (New - Inside Town)
create table stories (
  id uuid default gen_random_uuid() primary key,
  town_id uuid references towns(id) on delete cascade,
  title text not null,
  author_name text, -- "Local Hero" or name
  content text,
  media_url text,
  created_at timestamptz default now()
);-- 8. Access Points (New - Ubuntu Access Standard)
create table access_points (
  id uuid default gen_random_uuid() primary key,
  town_id uuid references towns(id) on delete cascade,
  name text not null,
  category text, -- internet, food, charging, workspace
  is_verified boolean default false,
  created_at timestamptz default now()
);-- 9. Coordinator & Partner (New)
create table coordinators (
  id uuid references users(id) on delete cascade primary key,
  town_id uuid references towns(id),
  status text default 'active', -- active, pending, suspended
  earnings jsonb default '{}', -- weekly, monthly, total
  created_at timestamptz default now()
);create table partner_offers (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references users(id),
  town_id uuid references towns(id),
  offer_type text, -- sponsorship, campaign, verification
  description text,
  created_at timestamptz default now()
);-- 10. Town Metrics (New)
create table town_metrics (
  id uuid default gen_random_uuid() primary key,
  town_id uuid references towns(id) on delete cascade,
  active_coordinators int default 0,
  open_opportunities int default 0,
  active_signals int default 0,
  youth_mapped int default 0,
  updated_at timestamptz default now()
);-- Row Level Security (RLS)
alter table profiles enable row level security;alter table towns enable row level security;alter table opportunities enable row level security;alter table businesses enable row level security;alter table town_signals enable row level security;alter table stories enable row level security;alter table events enable row level security;alter table access_points enable row level security;-- Basic RLS Policies (Citizens can read public data)
create policy "Allow public read access"
  on towns for select
  to authenticated, anon
  using (true);create policy "Allow public read opportunities"
  on opportunities for select
  to authenticated, anon
  using (true);create policy "Allow public read businesses"
  on businesses for select
  to authenticated, anon
  using (true);-- Seed Data (27 Activation Towns - Sample)
-- Note: This is a sample; full seed will happen in Phase 5
insert into provinces (name, slug) values
('Gauteng', 'gauteng'),
('Western Cape', 'western-cape'),
('KwaZulu-Natal', 'kwazulu-natal'),
('Eastern Cape', 'eastern-cape'),
('Limpopo', 'limpopo'),
('Mpumalanga', 'mpumalanga'),
('North West', 'north-west'),
('Free State', 'free-state'),
('Northern Cape', 'northern-cape');-- Add 27 towns across provinces (abbreviated for brevity)
-- Full seed in Phase 5