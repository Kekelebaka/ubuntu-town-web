-- Fix: 'unpublished' is a work_action, not a work_status. Remove it from the
-- work_status comparison/transition (caused 22P02 at plan time in tg_work_after).

create or replace function app.tg_work_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare req int;
begin
  new.updated_at := now();
  new.fts := setweight(to_tsvector('simple', coalesce(new.title,'')),      'A')
          || setweight(to_tsvector('simple', coalesce(new.description,'')), 'B')
          || setweight(to_tsvector('simple', array_to_string(new.tags,' ')), 'C');
  if tg_op = 'INSERT' then
    if new.created_by is null then new.created_by := auth.uid(); end if;
    if new.status is null then new.status := 'draft'; end if;
    if new.status not in ('draft','submitted') then
      raise exception 'community_work must start as draft or submitted (got %)', new.status;
    end if;
    if new.status = 'submitted' then new.submitted_at := now(); end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status='draft'     and new.status in ('submitted','archived')) or
      (old.status='submitted' and new.status in ('in_review','approved','rejected','draft','archived')) or
      (old.status='in_review' and new.status in ('approved','rejected','submitted')) or
      (old.status='approved'  and new.status in ('published','rejected','archived')) or
      (old.status='published' and new.status in ('archived')) or
      (old.status='rejected'  and new.status in ('draft','submitted','archived')) or
      (old.status='archived'  and new.status in ('draft'))
    ) then raise exception 'illegal status transition % -> %', old.status, new.status; end if;

    if new.status = 'approved' then
      req := app.required_rank(new.visibility, new.town_id);
      if app.rank_for_town(new.town_id) < req then
        raise exception 'approving % work here needs rank % (you have %)',
          new.visibility, req, app.rank_for_town(new.town_id);
      end if;
      new.approved_by := auth.uid(); new.approved_at := now();
      new.status := 'published'; new.published_at := now();
    end if;
    if new.status = 'submitted' and new.submitted_at is null then new.submitted_at := now(); end if;
    if new.status = 'rejected' then new.rejected_at := now(); end if;
  end if;
  return new;
end $$;

create or replace function app.tg_work_after()
returns trigger language plpgsql security definer set search_path = '' as $$
declare act uto.work_action; vis_list uto.work_visibility[];
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status then return null; end if;

  if new.approved_at is not null and (tg_op='INSERT' or old.approved_at is null) then
    insert into uto.work_approvals(work_id, actor, action, from_status, to_status, tier)
    values (new.id, auth.uid(), 'approved',
            case when tg_op='UPDATE' then old.status end, 'approved',
            app.rank_for_town(new.town_id));
  end if;

  act := case
    when tg_op='INSERT' and new.status='submitted' then 'submitted'
    when tg_op='INSERT' then 'created'
    when new.status='published' then 'published'
    when new.status='rejected' then 'rejected'
    when new.status='submitted' then 'submitted'
    when new.status='in_review' then 'review_started'
    when new.status='archived' then 'archived'
    else 'edited' end;

  insert into uto.work_approvals(work_id, actor, action, from_status, to_status, tier, note)
  values (new.id, auth.uid(), act,
          case when tg_op='UPDATE' then old.status end, new.status,
          app.rank_for_town(new.town_id), new.rejection_reason);

  if new.status='published' and (tg_op='INSERT' or old.status <> 'published') then
    vis_list := case new.visibility
      when 'national' then array['public','national']::uto.work_visibility[]
      when 'public'   then array['public']::uto.work_visibility[]
      else array['internal']::uto.work_visibility[] end;
    insert into uto.publish_outbox(work_id, channel, payload)
    select new.id, pr.channel,
           jsonb_build_object('work_id',new.id,'type',new.type,'town_id',new.town_id,'visibility',new.visibility)
    from uto.publishing_rules pr
    where pr.enabled and pr.visibility = any(vis_list)
      and (pr.work_type = new.type or pr.work_type is null);
    perform pg_notify('work_published', new.id::text);
  end if;
  return null;
end $$;
