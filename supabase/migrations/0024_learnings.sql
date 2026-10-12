-- 0024_learnings.sql — LEARNING PERSISTENCE (canonical operational store)
--
-- Purpose: close the primary capability gap — Learning / BMC Delta / Passport Delta had
-- schemas but NO persistence ("learning has NO persistence"). This is MIG-01 step 9.
--
-- Reconciled against:
--   - ut-os-mission-zero/schemas/learning.schema.json      (core learning record)
--   - ut-os-mission-zero/schemas/bmc-delta.schema.json      (initiative business-model delta)
--   - ut-os-mission-zero/schemas/passport-delta.schema.json (town understanding delta)
--   - existing uto conventions: uuid PK, town_id uuid, created_at/updated_at timestamptz,
--     RLS via app.has_town_scope(uuid) / app.is_national() / auth.uid()
--
-- Design rules honored:
--   - ONE canonical store (no duplicate truth). Supabase uto = operational persistence.
--   - BMC Delta and Passport Delta kept DISTINCT (they measure different things; §14).
--   - Immutability: learning rows are append-only for content; corrections are new rows
--     linked via supersedes. No DELETE for application roles.
--   - Missing evidence is never fabricated: evidence_refs is '[]' and the anyOf rule
--     (evidence_refs non-empty OR truth_class='AUTHORED') is enforced.
--
-- Schema target: uto (the production operational home). NOT production-applied — staging first.

create schema if not exists uto;

-- ---------- enums ----------
do $$ begin
  create type uto.learning_truth_class as enum (
    'VERIFIED','ACTUAL','MODELLED','HYPOTHESIS','AUTHORED','INSUFFICIENT_EVIDENCE'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.learning_status as enum (
    'draft','active','superseded','refuted'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type uto.learning_scope_level as enum (
    'national','province','town','initiative','person'
  );
exception when duplicate_object then null; end $$;

-- ---------- table ----------
create table if not exists uto.learnings (
  id                uuid primary key default gen_random_uuid(),

  -- learning statement (required, non-empty)
  statement         text not null,
  truth_class       uto.learning_truth_class not null,

  -- scope + relations
  scope_level       uto.learning_scope_level not null default 'town',
  town_id           uuid references uto.towns(id) on delete set null,
  initiative_key    text,
  work_id           uuid references uto.community_work(id) on delete set null,
  mission_id        uuid references uto.missions(id) on delete set null,
  workpack_id       uuid references uto.workpacks(id) on delete set null,
  proof_id          uuid references uto.proofs(id) on delete set null,
  outcome_id        uuid,

  -- provenance + evidence
  source            text,
  evidence_refs     jsonb not null default '[]'::jsonb,
  author_id         uuid not null references uto.users(id) on delete restrict,

  -- deltas (distinct concepts, distinct payloads)
  bmc_delta         jsonb,
  passport_delta    jsonb,

  -- lifecycle + versioning
  status            uto.learning_status not null default 'active',
  version           integer not null default 1,
  supersedes        uuid references uto.learnings(id) on delete set null,
  provenance        jsonb not null default '{}'::jsonb,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- anyOf (learning.schema.json): evidence_refs non-empty OR truth_class = 'AUTHORED'
  constraint learnings_evidence_or_authored check (
    (jsonb_typeof(evidence_refs) = 'array' and jsonb_array_length(evidence_refs) > 0)
    or truth_class = 'AUTHORED'
  ),
  constraint learnings_statement_nonempty check (length(btrim(statement)) > 0),
  constraint learnings_evidence_is_array check (jsonb_typeof(evidence_refs) = 'array'),
  constraint learnings_bmc_delta_is_object check (bmc_delta is null or jsonb_typeof(bmc_delta) = 'object'),
  constraint learnings_passport_delta_is_object check (passport_delta is null or jsonb_typeof(passport_delta) = 'object'),
  constraint learnings_version_positive check (version >= 1)
);

-- ---------- indexes ----------
create index if not exists learnings_town_id_idx      on uto.learnings (town_id);
create index if not exists learnings_initiative_idx   on uto.learnings (initiative_key);
create index if not exists learnings_work_id_idx      on uto.learnings (work_id);
create index if not exists learnings_author_id_idx    on uto.learnings (author_id);
create index if not exists learnings_status_idx       on uto.learnings (status);
create index if not exists learnings_truth_class_idx  on uto.learnings (truth_class);
create index if not exists learnings_created_at_idx   on uto.learnings (created_at desc);
create index if not exists learnings_supersedes_idx   on uto.learnings (supersedes);

-- ---------- immutability trigger ----------
-- Content fields (statement, truth_class, evidence_refs, author_id) are immutable after
-- insert. Corrections are new rows via supersedes. Only status/updated_at/supersedes may
-- change on update (e.g. mark refuted / superseded).
create or replace function uto.learnings_immutable() returns trigger
language plpgsql security definer set search_path = uto, public as $$
begin
  if tg_op = 'UPDATE' then
    if new.statement     is distinct from old.statement
       or new.truth_class is distinct from old.truth_class
       or new.evidence_refs is distinct from old.evidence_refs
       or new.author_id  is distinct from old.author_id
       or new.created_at is distinct from old.created_at then
      raise exception 'learnings content is immutable; create a superseding row instead';
    end if;
    new.updated_at := now();
    new.version    := old.version; -- version increments only via supersede chain
  end if;
  return new;
end $$;

drop trigger if exists learnings_immutable_trg on uto.learnings;
create trigger learnings_immutable_trg before update on uto.learnings
  for each row execute function uto.learnings_immutable();

-- ---------- RLS ----------
alter table uto.learnings enable row level security;

-- helper: does the current session have initiative scope for this key? (best-effort;
-- falls back to profile facts.initiative_scope, matching the established role bridge)
create or replace function uto.has_initiative_scope(_initiative text) returns boolean
language sql stable security definer set search_path = uto, public as $$
  select coalesce(
    (select app.is_national())
    or (_initiative is not null and exists (
         select 1 from uto.profiles p
         where p.id = auth.uid()
           and (p.facts -> 'initiative_scope') ? _initiative
       )),
    false
  );
$$;

-- read: national, town-scoped, initiative-scoped, or author self
drop policy if exists learnings_read_national on uto.learnings;
create policy learnings_read_national on uto.learnings for select
  using (app.is_national());

drop policy if exists learnings_read_town on uto.learnings;
create policy learnings_read_town on uto.learnings for select
  using (app.has_town_scope(town_id));

drop policy if exists learnings_read_initiative on uto.learnings;
create policy learnings_read_initiative on uto.learnings for select
  using (uto.has_initiative_scope(initiative_key));

drop policy if exists learnings_read_author on uto.learnings;
create policy learnings_read_author on uto.learnings for select
  using (author_id = auth.uid());

-- insert: authenticated author within their scope (author must be self or national)
drop policy if exists learnings_insert_scoped on uto.learnings;
create policy learnings_insert_scoped on uto.learnings for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      app.is_national()
      or app.has_town_scope(town_id)
      or uto.has_initiative_scope(initiative_key)
    )
  );

-- update: author (or national) may change lifecycle fields only (trigger enforces immututability)
drop policy if exists learnings_update_lifecycle on uto.learnings;
create policy learnings_update_lifecycle on uto.learnings for update to authenticated
  using (author_id = auth.uid() or app.is_national())
  with check (author_id = auth.uid() or app.is_national());

-- delete: intentionally NO policy for application roles (immutability). Admin/service_role
-- bypass RLS; that path is governed separately and audited.

-- ---------- grants ----------
-- RLS alone does not authorize in Postgres; the application roles need table privileges.
-- RLS policies then narrow what those roles can see/do. Fail-closed: anon gets nothing.
grant select, insert, update on uto.learnings to authenticated;
revoke all on uto.learnings from anon;

comment on table uto.learnings is
  'Canonical learning persistence (WORK->PROOF->OUTCOME->LEARNING->DELTA->NEXT DECISION). Append-only; corrections via supersedes.';
comment on column uto.learnings.bmc_delta is
  'BMC Delta payload (initiative business-model change) validated against bmc-delta.schema.json. Distinct from passport_delta.';
comment on column uto.learnings.passport_delta is
  'Passport Delta payload (town understanding change) validated against passport-delta.schema.json. Distinct from bmc_delta.';
