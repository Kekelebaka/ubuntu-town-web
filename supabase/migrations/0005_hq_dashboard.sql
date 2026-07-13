-- ============================================================================
-- Ubuntu Town OS — HQ Dashboard RPCs (0005)
-- Target: Supabase Postgres 17 · project ubuntu-town-os (afiokbhuxfdacbsipoqk)
-- Applied AFTER 0003 + 0004. Additive only — no writes from the dashboard.
--
-- Every function checks app.is_national() first (double-gate with the route).
-- All functions are SECURITY DEFINER so they run as the owner but with the
-- caller's auth.uid() — the is_national() check uses that.
-- ============================================================================

-- ============================================================================
-- 0. GATE FUNCTION (for route-level check)
-- ============================================================================

create or replace function uto.is_hq()
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_national();
$$;

grant execute on function uto.is_hq() to authenticated;

-- ============================================================================
-- 1. OVERVIEW KPIs (one row)
-- ============================================================================

create or replace function uto.hq_overview()
returns table (
  coordinators       bigint,
  towns_live         bigint,
  total_work         bigint,
  published          bigint,
  pending_review     bigint,
  active_coordinators bigint,
  not_started        bigint,
  outbox_pending     bigint
)
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_national() then
    raise insufficient_privilege using errcode = '42501';
  end if;

  return query
  select
    -- Total coordinators in bootcamp
    (select count(*) from uto.coordinators c
     where c.status in ('bootcamp', 'active')),

    -- Towns with at least one coordinator assigned
    (select count(distinct ra.town_id) from uto.role_assignments ra
     where ra.role_key = 'coordinator' and ra.town_id is not null),

    -- Total community work items
    (select count(*) from uto.community_work),

    -- Published items
    (select count(*) from uto.community_work cw where cw.status = 'published'),

    -- Pending review (submitted or in_review)
    (select count(*) from uto.community_work cw where cw.status in ('submitted', 'in_review')),

    -- Active coordinators (those who have created at least 1 community_work)
    (select count(distinct cw.created_by) from uto.community_work cw
     where cw.created_by is not null),

    -- Not started (coordinators with 0 community_work entries)
    (select count(*) from uto.coordinators co
     where co.status in ('bootcamp', 'active')
       and not exists (
         select 1 from uto.community_work cw where cw.created_by = co.id
       )),

    -- Outbox rows still pending
    (select count(*) from uto.publish_outbox po where po.status = 'pending');
end;
$$;

grant execute on function uto.hq_overview() to authenticated;

-- ============================================================================
-- 2. TOWN ROLLUP (per-town aggregates)
-- ============================================================================

create or replace function uto.hq_town_rollup()
returns table (
  town_name   text,
  town_slug   text,
  town_id     uuid,
  coordinators bigint,
  entries     bigint,
  published   bigint
)
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_national() then
    raise insufficient_privilege using errcode = '42501';
  end if;

  return query
  select
    t.name,
    t.slug,
    t.id,
    (select count(*) from uto.role_assignments ra
     where ra.town_id = t.id and ra.role_key = 'coordinator'),
    (select count(*) from uto.community_work cw where cw.town_id = t.id),
    (select count(*) from uto.community_work cw
     where cw.town_id = t.id and cw.status = 'published')
  from uto.towns t
  where exists (
    select 1 from uto.role_assignments ra
    where ra.town_id = t.id and ra.role_key = 'coordinator'
  )
  order by (select count(*) from uto.community_work cw where cw.town_id = t.id) desc;
end;
$$;

grant execute on function uto.hq_town_rollup() to authenticated;

-- ============================================================================
-- 3. COORDINATOR ROSTER (with activity counts)
-- ============================================================================

create or replace function uto.hq_coordinators()
returns table (
  coordinator_id uuid,
  coordinator_name text,
  town_name   text,
  town_slug   text,
  band        text,
  coord_status text,
  entries     bigint,
  published   bigint,
  last_activity timestamptz
)
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_national() then
    raise insufficient_privilege using errcode = '42501';
  end if;

  return query
  select
    co.id,
    co.display_name,
    t.name,
    t.slug,
    co.band::text,
    co.status,
    (select count(*) from uto.community_work cw where cw.created_by = co.id),
    (select count(*) from uto.community_work cw
     where cw.created_by = co.id and cw.status = 'published'),
    (select max(cw.created_at) from uto.community_work cw where cw.created_by = co.id)
  from uto.coordinators co
  left join uto.towns t on t.id = co.town_id
  where co.status in ('bootcamp', 'active')
  order by (select count(*) from uto.community_work cw where cw.created_by = co.id) desc;
end;
$$;

grant execute on function uto.hq_coordinators() to authenticated;

-- ============================================================================
-- 4. TYPE BREAKDOWN (entries by work_type)
-- ============================================================================

create or replace function uto.hq_type_breakdown()
returns table (
  work_type   text,
  total       bigint,
  published   bigint
)
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_national() then
    raise insufficient_privilege using errcode = '42501';
  end if;

  return query
  select
    cw.type::text,
    count(*),
    count(*) filter (where cw.status = 'published')
  from uto.community_work cw
  group by cw.type
  order by count(*) desc;
end;
$$;

grant execute on function uto.hq_type_breakdown() to authenticated;

-- ============================================================================
-- 5. RECENT ACTIVITY FEED
-- ============================================================================

create or replace function uto.hq_recent(_limit int default 50)
returns table (
  created_at   timestamptz,
  coordinator  text,
  town_name    text,
  work_type    text,
  title        text,
  cw_status    text,
  visibility   text
)
language plpgsql security definer set search_path = '' as $$
begin
  if not app.is_national() then
    raise insufficient_privilege using errcode = '42501';
  end if;

  return query
  select
    cw.created_at,
    co.display_name,
    t.name,
    cw.type::text,
    cw.title,
    cw.status::text,
    cw.visibility::text
  from uto.community_work cw
  left join uto.coordinators co on co.id = cw.created_by
  left join uto.towns t on t.id = cw.town_id
  order by cw.created_at desc
  limit _limit;
end;
$$;

grant execute on function uto.hq_recent(int) to authenticated;

-- ============================================================================
-- END 0005 — HQ dashboard RPCs complete
-- ============================================================================
