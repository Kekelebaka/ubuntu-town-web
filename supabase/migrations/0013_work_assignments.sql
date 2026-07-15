-- 0013 · Work Assignments
-- Coordination primitive: coordinators assign work to each other; the assignee
-- marks it done. Realtime-enabled; paired with notifications trigger.

create table if not exists uto.work_assignments(
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references uto.community_work(id) on delete cascade,
  assignee_id uuid not null,
  assigned_by uuid not null default auth.uid(),
  status text not null default 'open',   -- open | done | dropped
  note text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table uto.work_assignments enable row level security;
create policy wa_read on uto.work_assignments for select to authenticated
  using (app.can_read_work(work_id) or assignee_id = auth.uid());
create policy wa_manage on uto.work_assignments for all to authenticated
  using (app.can_write_work(work_id)) with check (app.can_write_work(work_id));
create policy wa_self_update on uto.work_assignments for update to authenticated
  using (assignee_id = auth.uid()) with check (assignee_id = auth.uid());
grant select, insert, update, delete on uto.work_assignments to authenticated;
alter publication supabase_realtime add table uto.work_assignments;

-- Assignment → notification trigger
create or replace function app.tg_assignment_notify() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_title text;
begin
  select title into v_title from uto.community_work where id = new.work_id;
  insert into uto.notifications(user_id, type, title, body, work_id, actor_id)
  values (new.assignee_id, 'assignment', 'You were assigned work', v_title, new.work_id, new.assigned_by);
  return new;
end $$;
drop trigger if exists assignment_notify on uto.work_assignments;
create trigger assignment_notify after insert on uto.work_assignments
  for each row execute function app.tg_assignment_notify();

-- Caller's own assignments, joined to work title + type
create or replace function uto.my_assignments()
returns table(id uuid, work_id uuid, title text, work_type text, status text, note text, assigned_by uuid, created_at timestamptz, completed_at timestamptz)
language sql stable security definer set search_path='' as $$
  select wa.id, wa.work_id, cw.title, cw.type::text, wa.status, wa.note, wa.assigned_by, wa.created_at, wa.completed_at
  from uto.work_assignments wa
  join uto.community_work cw on cw.id = wa.work_id
  where wa.assignee_id = auth.uid()
  order by case wa.status when 'open' then 0 when 'done' then 1 else 2 end, wa.created_at desc;
$$;
grant execute on function uto.my_assignments() to authenticated;
