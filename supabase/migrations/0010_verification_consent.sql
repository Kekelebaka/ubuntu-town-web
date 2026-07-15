-- 0010: VERIFICATION & CONSENT (POPIA)
-- Makes data a moat: every record can be verified + consented

alter table uto.community_work
  add column if not exists gps_lat double precision,
  add column if not exists gps_lng double precision,
  add column if not exists photo_verified   boolean not null default false,
  add column if not exists gps_verified      boolean not null default false,
  add column if not exists contact_verified  boolean not null default false,
  add column if not exists verified_by uuid,
  add column if not exists verified_at timestamptz,
  add column if not exists verify_count int not null default 0;

create table if not exists uto.work_consent(
  work_id uuid primary key references uto.community_work(id) on delete cascade,
  subject_name text,
  consent_given boolean not null default false,
  method text,                         -- verbal | written | whatsapp
  captured_by uuid not null default auth.uid(),
  captured_at timestamptz not null default now()
);
alter table uto.work_consent enable row level security;
create policy wcon_read  on uto.work_consent for select to authenticated using (app.can_read_work(work_id));
create policy wcon_write on uto.work_consent for all    to authenticated using (app.can_write_work(work_id)) with check (app.can_write_work(work_id));
grant select on uto.work_consent to authenticated;         -- NOT anon (PII)
grant insert, update, delete on uto.work_consent to authenticated;

-- verified = photo + gps + contact + consent
create or replace function uto.is_work_verified(_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce(cw.photo_verified,false) and coalesce(cw.gps_verified,false)
     and coalesce(cw.contact_verified,false)
     and exists(select 1 from uto.work_consent c where c.work_id=cw.id and c.consent_given)
  from uto.community_work cw where cw.id=_id;
$$;
grant execute on function uto.is_work_verified(uuid) to anon, authenticated;

-- second-coordinator confirmation
create or replace function uto.confirm_verification(_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not app.can_write_work(_id) then raise insufficient_privilege using errcode='42501'; end if;
  update uto.community_work set verify_count = verify_count + 1,
     verified_by = auth.uid(), verified_at = now() where id = _id;
end $$;
grant execute on function uto.confirm_verification(uuid) to authenticated;
