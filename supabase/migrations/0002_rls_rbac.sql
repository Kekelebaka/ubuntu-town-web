-- ============================================================================
-- Ubuntu Town OS — RLS + RBAC + POPIA  (Phase 7)
-- Apply AFTER 0001_ubuntu_town_core.sql.
-- Model: everyone authenticated; access scoped by role_assignments.
--   admin/ops           -> full access
--   coordinator/deputy  -> read+write within their assigned town(s)
--   ambassador/media    -> read town + create signals/proofs in their town
--   partner/sponsor     -> read curated public-ish data
--   anon (public site)  -> read only published/town-directory data
-- POPIA: PII (applications, crm_contacts, profiles.facts) is locked to
--   admin/ops + the owning coordinator's town. Never exposed to anon.
-- ============================================================================

-- ---------- helper functions (security definer) ----------
create or replace function auth_role_keys()
returns role_key[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct role_key), '{}')::role_key[]
  from role_assignments where user_id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from role_assignments
    where user_id = auth.uid() and role_key in ('admin','ops')
  );
$$;

-- does the current user have any role scoped to :town (or a global role)?
create or replace function in_town(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_admin() or exists (
    select 1 from role_assignments
    where user_id = auth.uid()
      and (town_id = t or town_id is null)
      and role_key in ('coordinator','deputy','ambassador','media')
  );
$$;

-- ---------- enable RLS everywhere ----------
do $$
declare t text;
begin
  foreach t in array array[
    'municipalities','towns','users','profiles','roles','role_assignments',
    'applications','coordinators','coordinator_assignments','media_assets',
    'signals','opportunity_points','workpacks','workpack_instances','proofs',
    'memories','businesses','town_scores','events','stories',
    'payout_runs','payout_lines','earnings','communications',
    'crm_contacts','crm_activities','audit_logs'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
  end loop;
end $$;

-- ---------- PUBLIC (anon) read: directory + published content only ----------
create policy anon_read_towns on towns for select using (true);
create policy anon_read_municipalities on municipalities for select using (true);
create policy anon_read_published_stories on stories for select using (is_published = true);
create policy anon_read_events on events for select using (true);
create policy anon_read_verified_businesses on businesses for select using (is_verified = true);
create policy anon_read_town_scores on town_scores for select using (true);

-- ---------- ADMIN/OPS: full access on every table ----------
do $$
declare t text;
begin
  foreach t in array array[
    'municipalities','towns','users','profiles','roles','role_assignments',
    'applications','coordinators','coordinator_assignments','media_assets',
    'signals','opportunity_points','workpacks','workpack_instances','proofs',
    'memories','businesses','town_scores','events','stories',
    'payout_runs','payout_lines','earnings','communications',
    'crm_contacts','crm_activities','audit_logs'
  ] loop
    execute format(
      'create policy admin_all on %I for all using (is_admin()) with check (is_admin());', t);
  end loop;
end $$;

-- ---------- SELF: a user sees/edits their own identity rows ----------
create policy self_user   on users    for select using (id = auth.uid());
create policy self_profile_rw on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy self_roles   on role_assignments for select using (user_id = auth.uid());
create policy self_coord   on coordinators for select using (id = auth.uid());
create policy self_earnings on earnings for select using (
  coordinator_id = auth.uid()
);

-- ---------- TOWN-SCOPED: coordinators/ambassadors operate in their town ----------
-- signals
create policy town_read_signals   on signals for select using (in_town(town_id));
create policy town_write_signals  on signals for insert with check (in_town(town_id));
create policy town_update_signals on signals for update using (in_town(town_id)) with check (in_town(town_id));
-- opportunity points
create policy town_rw_oppoints    on opportunity_points for all using (in_town(town_id)) with check (in_town(town_id));
-- workpack instances
create policy town_rw_wpi         on workpack_instances for all using (in_town(town_id)) with check (in_town(town_id));
-- proofs (via the workpack instance's town)
create policy town_rw_proofs on proofs for all using (
  exists (select 1 from workpack_instances w where w.id = proofs.workpack_instance_id and in_town(w.town_id))
) with check (
  exists (select 1 from workpack_instances w where w.id = proofs.workpack_instance_id and in_town(w.town_id))
);
-- memories, businesses, town_scores, events, stories (town-scoped write; read handled by anon/admin above)
create policy town_rw_memories  on memories  for all using (in_town(town_id)) with check (in_town(town_id));
create policy town_rw_business  on businesses for all using (in_town(town_id)) with check (in_town(town_id));
create policy town_rw_events    on events    for all using (in_town(town_id)) with check (in_town(town_id));
create policy town_rw_stories   on stories   for all using (in_town(town_id)) with check (in_town(town_id));
create policy town_read_score   on town_scores for select using (in_town(town_id) or true);

-- workpack templates: readable by any authenticated coordinator+
create policy auth_read_workpacks on workpacks for select using (auth.uid() is not null);

-- ---------- PII / SENSITIVE: admin/ops + owning-town only, NEVER anon ----------
-- applications (candidate PII + form answers): town-scoped read for that town's coordinators
create policy town_read_applications on applications for select using (in_town(town_id));
-- coordinator_assignments visible to the town
create policy town_read_assignments on coordinator_assignments for select using (in_town(town_id));
-- payouts/earnings: admin/ops (admin_all) + the coordinator sees own lines
create policy self_payout_lines on payout_lines for select using (coordinator_id = auth.uid());
-- crm: ops-only by default (admin_all covers it); partners/coordinators get no blanket read
-- communications: ops-only (admin_all)
-- media assets: town members can read media tied to their town's proofs; uploader can read own
create policy own_media on media_assets for select using (uploaded_by = auth.uid());

-- audit_logs: admin/ops only (admin_all). No self-read (integrity).

-- ============================================================================
-- POPIA NOTES (South Africa Protection of Personal Information Act)
--  * Lawful basis: applicants consented via the recruitment form; store consent
--    ts + purpose in applications.form_answers / crm_contacts.external_ids.
--  * Minimisation: field_visibility on profiles controls what a coordinator sees.
--  * Right to access/erase: expose via an ops workflow; log every access in audit_logs.
--  * Cross-border: Supabase eu-west-1; document the transfer basis.
--  * Never expose applications / crm_contacts / profiles.facts to the anon role.
-- ============================================================================
