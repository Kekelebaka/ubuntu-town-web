-- 0009: COMMENTS, MENTIONS & NOTIFICATIONS
-- Enables coordinator+HQ collaboration on work items

create table if not exists uto.work_comments(
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references uto.community_work(id) on delete cascade,
  author_id uuid not null default auth.uid(),
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table uto.work_comments enable row level security;
create policy wc_read  on uto.work_comments for select to authenticated, anon using (app.can_read_work(work_id));
create policy wc_write on uto.work_comments for insert to authenticated with check (app.can_read_work(work_id) and author_id = auth.uid());
create policy wc_edit  on uto.work_comments for update to authenticated using (author_id = auth.uid());
grant select on uto.work_comments to anon, authenticated;
grant insert, update on uto.work_comments to authenticated;

create table if not exists uto.notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, type text not null,   -- mention|approval|rejection|assignment|system
  title text not null, body text,
  work_id uuid references uto.community_work(id) on delete cascade,
  actor_id uuid, read_at timestamptz, created_at timestamptz not null default now()
);
alter table uto.notifications enable row level security;
create policy notif_self on uto.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_upd  on uto.notifications for update to authenticated using (user_id = auth.uid());
grant select, update on uto.notifications to authenticated;  -- inserts via SECURITY DEFINER only
alter publication supabase_realtime add table uto.notifications;

-- Trigger: mention notifications
create or replace function app.tg_comment_notify() returns trigger
language plpgsql security definer set search_path='' as $$
declare m uuid; begin
  foreach m in array coalesce(new.mentions,'{}') loop
    insert into uto.notifications(user_id,type,title,body,work_id,actor_id)
    values (m,'mention','You were mentioned',left(new.body,140),new.work_id,new.author_id);
  end loop; return new; end $$;
drop trigger if exists comment_notify on uto.work_comments;
create trigger comment_notify after insert on uto.work_comments for each row execute function app.tg_comment_notify();

-- Trigger: approval/rejection notifications to creator
create or replace function app.tg_work_status_notify() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'published' then
      insert into uto.notifications(user_id,type,title,body,work_id,actor_id)
      values (new.created_by,'approval','Work published',new.title,new.id,auth.uid());
    elsif new.status = 'rejected' then
      insert into uto.notifications(user_id,type,title,body,work_id,actor_id)
      values (new.created_by,'rejection',coalesce(new.rejection_reason,'Work rejected'),new.title,new.id,auth.uid());
    end if;
  end if;
  return new;
end $$;
drop trigger if exists work_status_notify on uto.community_work;
create trigger work_status_notify after update on uto.community_work for each row execute function app.tg_work_status_notify();
