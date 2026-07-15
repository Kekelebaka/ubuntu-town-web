-- 0008: REALTIME ACTIVITY FEED
-- Adds town activity feed function for the workspace
-- NOTE: community_work and work_approvals already in realtime publication (0003)

-- Town activity feed (gated, read-only)
create or replace function uto.town_activity(_town_id uuid, _limit int default 50)
returns table(at timestamptz, actor text, action text, work_type text, title text, status text)
language sql stable security definer set search_path='' as $$
  select wa.created_at, coalesce(co.display_name,'Someone'), wa.action::text,
         cw.type::text, cw.title, wa.to_status::text
  from uto.work_approvals wa
  join uto.community_work cw on cw.id = wa.work_id
  left join uto.coordinators co on co.id = wa.actor
  where cw.town_id = _town_id and app.can_read_work(cw.id)
  order by wa.created_at desc limit _limit;
$$;
grant execute on function uto.town_activity(uuid,int) to authenticated;
