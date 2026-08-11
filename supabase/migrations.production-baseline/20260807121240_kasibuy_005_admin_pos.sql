create extension if not exists pgcrypto;

-- ============ settings (drives the masthead / weekly poster) ============
create table if not exists kb_settings (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into kb_settings(key,value) values
 ('poster', jsonb_build_object('week',32,'valid_from','2026-08-03','valid_to','2026-08-09','banner','New poster every Monday 6am')),
 ('contact', jsonb_build_object('whatsapp','','ussd','*134*8425#'))
on conflict (key) do nothing;

-- ============ admins ============
create table if not exists kb_admins (
  id serial primary key,
  username text not null unique,
  pass_hash text not null,
  name text not null,
  role text not null default 'coordinator' check (role in ('super','coordinator')),
  town_id int references kb_towns(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists kb_sessions (
  token uuid primary key default gen_random_uuid(),
  admin_id int not null references kb_admins(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '12 hours',
  created_at timestamptz not null default now()
);
create index if not exists kb_sessions_exp on kb_sessions(expires_at);

-- ============ coordinators (public-facing, per town) ============
create table if not exists kb_coordinators (
  id serial primary key,
  town_id int not null references kb_towns(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp_group text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists kb_coord_town on kb_coordinators(town_id);

-- ============ POS pins on collection points ============
alter table kb_points add column if not exists pin text;
update kb_points set pin = lpad(((abs(hashtext('kbpos'||id)) % 9000) + 1000)::text, 4, '0') where pin is null;
alter table kb_points alter column pin set not null;

-- ============ product week/visibility ============
alter table kb_products add column if not exists stock_note text;

-- ============ RLS ============
alter table kb_settings     enable row level security;
alter table kb_admins       enable row level security;
alter table kb_sessions     enable row level security;
alter table kb_coordinators enable row level security;

drop policy if exists kb_r_settings on kb_settings;
create policy kb_r_settings on kb_settings for select using (key = 'poster');
drop policy if exists kb_r_coord on kb_coordinators;
create policy kb_r_coord on kb_coordinators for select using (active);
-- kb_admins and kb_sessions: no policies at all. Only the service role reaches them.

-- ============ login / session (service role only) ============
create or replace function kb_admin_login(p_user text, p_pass text)
returns json language plpgsql security definer set search_path=public as $$
declare a kb_admins; t uuid;
begin
  select * into a from kb_admins where lower(username)=lower(trim(p_user)) and active;
  if a.id is null then return json_build_object('ok',false,'error','bad_credentials'); end if;
  if a.pass_hash <> crypt(p_pass, a.pass_hash) then
    return json_build_object('ok',false,'error','bad_credentials');
  end if;
  delete from kb_sessions where expires_at < now();
  insert into kb_sessions(admin_id) values (a.id) returning token into t;
  return json_build_object('ok',true,'token',t,'admin',
    json_build_object('name',a.name,'role',a.role,'username',a.username,
      'town',(select name from kb_towns where id=a.town_id),'town_id',a.town_id));
end $$;

create or replace function kb_admin_whoami(p_token uuid)
returns json language plpgsql security definer set search_path=public as $$
declare a kb_admins;
begin
  select ad.* into a from kb_sessions s join kb_admins ad on ad.id=s.admin_id
    where s.token=p_token and s.expires_at > now() and ad.active;
  if a.id is null then return json_build_object('ok',false); end if;
  return json_build_object('ok',true,'admin',json_build_object('id',a.id,'name',a.name,'role',a.role,
    'username',a.username,'town',(select name from kb_towns where id=a.town_id),'town_id',a.town_id));
end $$;

create or replace function kb_admin_logout(p_token uuid)
returns json language sql security definer set search_path=public as $$
  delete from kb_sessions where token=p_token; select json_build_object('ok',true);
$$;

create or replace function kb_admin_set_password(p_token uuid, p_new text)
returns json language plpgsql security definer set search_path=public as $$
declare a int;
begin
  select admin_id into a from kb_sessions where token=p_token and expires_at > now();
  if a is null then return json_build_object('ok',false,'error','session'); end if;
  if length(coalesce(p_new,'')) < 10 then return json_build_object('ok',false,'error','too_short'); end if;
  update kb_admins set pass_hash = crypt(p_new, gen_salt('bf',10)) where id=a;
  delete from kb_sessions where admin_id=a and token<>p_token;
  return json_build_object('ok',true);
end $$;

-- ============ dashboard ============
create or replace function kb_admin_stats(p_token uuid)
returns json language plpgsql security definer set search_path=public as $$
declare a json; res json;
begin
  a := kb_admin_whoami(p_token);
  if not (a->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;

  select json_build_object('ok',true,
    'kpi', json_build_object(
      'orders',       (select count(*) from kb_orders),
      'orders_7d',    (select count(*) from kb_orders where created_at > now()-interval '7 days'),
      'gmv',          (select coalesce(sum(total),0) from kb_orders),
      'gmv_7d',       (select coalesce(sum(total),0) from kb_orders where created_at > now()-interval '7 days'),
      'awaiting',     (select count(*) from kb_orders where status in ('placed','ordered','transit')),
      'ready',        (select count(*) from kb_orders where status='ready'),
      'joins',        (select count(*) from kb_stokvel_joins),
      'apps_new',     (select count(*) from kb_applications where created_at > now()-interval '14 days'),
      'products',     (select count(*) from kb_products where active),
      'towns',        (select count(*) from kb_towns where active),
      'points',       (select count(*) from kb_points where active),
      'coordinators', (select count(*) from kb_coordinators where active)
    ),
    'by_town', (select coalesce(json_agg(x order by x->>'gmv' desc),'[]'::json) from (
        select json_build_object('town',t.name,'province',t.province,
          'orders',count(o.id),'gmv',coalesce(sum(o.total),0),
          'joins',(select count(*) from kb_stokvel_joins j where j.town_id=t.id)) x, coalesce(sum(o.total),0) gmv
        from kb_towns t left join kb_orders o on o.town_id=t.id
        group by t.id,t.name,t.province having count(o.id) > 0 or exists(select 1 from kb_stokvel_joins j where j.town_id=t.id)
        order by coalesce(sum(o.total),0) desc limit 25) s),
    'top_products', (select coalesce(json_agg(x),'[]'::json) from (
        select json_build_object('code',p.code,'name',p.name,'qty',coalesce(sum(i.qty),0),
          'revenue',coalesce(sum(i.qty*i.unit_price),0)) x
        from kb_products p left join kb_order_items i on i.product_id=p.id
        group by p.id,p.code,p.name order by coalesce(sum(i.qty*i.unit_price),0) desc limit 10) s),
    'stokvel', (select coalesce(json_agg(x),'[]'::json) from (
        select json_build_object('code',p.code,'name',p.name,'town',t.name,
          'joined',kb_joined_count(p.id,t.id),'price',kb_price_for(p.id,t.id),
          'next',(select json_build_object('qty',qty,'price',price) from kb_stokvel_tiers
                  where product_id=p.id and qty > kb_joined_count(p.id,t.id) order by qty limit 1)) x
        from kb_products p join kb_towns t on true
        where exists(select 1 from kb_stokvel_tiers z where z.product_id=p.id)
          and kb_joined_count(p.id,t.id) > 0
        order by kb_joined_count(p.id,t.id) desc limit 20) s),
    'recent_orders', (select coalesce(json_agg(x),'[]'::json) from (
        select json_build_object('order_no',o.order_no,'town',t.name,'point',pt.name,'total',o.total,
          'status',o.status,'otp',o.otp,'placed',o.created_at,
          'items',(select coalesce(json_agg(pr.code||' x'||i.qty),'[]'::json)
                   from kb_order_items i join kb_products pr on pr.id=i.product_id where i.order_id=o.id)) x
        from kb_orders o join kb_towns t on t.id=o.town_id left join kb_points pt on pt.id=o.point_id
        order by o.created_at desc limit 40) s),
    'applications', (select coalesce(json_agg(x),'[]'::json) from (
        select json_build_object('id',id,'kind',kind,'town',town,'payload',payload,'at',created_at) x
        from kb_applications order by created_at desc limit 60) s)
  ) into res;
  return res;
end $$;

-- ============ order status ============
create or replace function kb_admin_order_status(p_token uuid, p_order text, p_status text)
returns json language plpgsql security definer set search_path=public as $$
declare a json;
begin
  a := kb_admin_whoami(p_token);
  if not (a->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;
  if p_status not in ('placed','ordered','transit','ready','collected','cancelled') then
    return json_build_object('ok',false,'error','bad_status'); end if;
  update kb_orders set status=p_status where upper(order_no)=upper(trim(p_order));
  if not found then return json_build_object('ok',false,'error','not_found'); end if;
  return json_build_object('ok',true);
end $$;

-- bulk move every order in a town to a status (the weekly logistics run)
create or replace function kb_admin_bulk_status(p_token uuid, p_town text, p_from text, p_to text)
returns json language plpgsql security definer set search_path=public as $$
declare a json; n int;
begin
  a := kb_admin_whoami(p_token);
  if not (a->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;
  update kb_orders o set status=p_to
    where o.status=p_from and (p_town is null or o.town_id=(select id from kb_towns where name=p_town or slug=p_town));
  get diagnostics n = row_count;
  return json_build_object('ok',true,'updated',n);
end $$;

-- ============ POS: merchant terminal ============
create or replace function kb_pos_login(p_point int, p_pin text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points; t kb_towns;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  select * into t from kb_towns where id=pt.town_id;
  return json_build_object('ok',true,'point',json_build_object('id',pt.id,'no',pt.point_no,'name',pt.name),
    'town',json_build_object('name',t.name,'slug',t.slug));
end $$;

create or replace function kb_pos_queue(p_point int, p_pin text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  return json_build_object('ok',true,'orders',(
    select coalesce(json_agg(json_build_object('order_no',o.order_no,'total',o.total,'status',o.status,
      'placed',o.created_at,
      'items',(select coalesce(json_agg(pr.code||' — '||pr.name||' x'||i.qty),'[]'::json)
               from kb_order_items i join kb_products pr on pr.id=i.product_id where i.order_id=o.id))
      order by o.created_at desc),'[]'::json)
    from kb_orders o where o.point_id=pt.id and o.status <> 'collected'));
end $$;

create or replace function kb_pos_collect(p_point int, p_pin text, p_order text, p_otp text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points; o kb_orders;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  select * into o from kb_orders where upper(order_no)=upper(trim(p_order)) and point_id=pt.id;
  if o.id is null then return json_build_object('ok',false,'error','not_at_this_point'); end if;
  if o.status = 'collected' then return json_build_object('ok',false,'error','already_collected'); end if;
  if o.otp <> trim(p_otp) then return json_build_object('ok',false,'error','bad_otp'); end if;
  update kb_orders set status='collected' where id=o.id;
  return json_build_object('ok',true,'order_no',o.order_no,'total',o.total);
end $$;

grant execute on function kb_pos_login(int,text)              to anon, authenticated;
grant execute on function kb_pos_queue(int,text)              to anon, authenticated;
grant execute on function kb_pos_collect(int,text,text,text)  to anon, authenticated;

-- admin functions: service role only (never anon)
revoke all on function kb_admin_login(text,text)             from anon, authenticated;
revoke all on function kb_admin_whoami(uuid)                 from anon, authenticated;
revoke all on function kb_admin_logout(uuid)                 from anon, authenticated;
revoke all on function kb_admin_set_password(uuid,text)      from anon, authenticated;
revoke all on function kb_admin_stats(uuid)                  from anon, authenticated;
revoke all on function kb_admin_order_status(uuid,text,text) from anon, authenticated;
revoke all on function kb_admin_bulk_status(uuid,text,text,text) from anon, authenticated;

-- ============ poster now carries settings + coordinator ============
create or replace function kb_poster(p_town text)
returns json language plpgsql stable security definer set search_path=public as $$
declare t kb_towns; res json;
begin
  select * into t from kb_towns where slug=p_town or name=p_town limit 1;
  if t.id is null then select * into t from kb_towns order by id limit 1; end if;

  select json_build_object(
    'town', json_build_object('id',t.id,'name',t.name,'slug',t.slug,'province',t.province,'shops',t.shops),
    'poster', (select value from kb_settings where key='poster'),
    'coordinator', (select json_build_object('name',name,'phone',phone,'group',whatsapp_group)
                    from kb_coordinators where town_id=t.id and active order by id limit 1),
    'points', (select coalesce(json_agg(json_build_object('id',id,'no',point_no,'name',name,'km',distance_km) order by distance_km),'[]'::json)
               from kb_points where town_id=t.id and active),
    'products', (select coalesce(json_agg(s.p order by s.sort),'[]'::json) from (
        select json_build_object(
          'code',pr.code,'name',pr.name,'price',kb_price_for(pr.id,t.id),'list_price',pr.price,
          'was',pr.was_price,'category',pr.category,'icon',pr.icon,'image',pr.image_url,
          'maker',pr.maker,'maker_town',pr.maker_town,'live',pr.is_live,'hero',pr.is_hero,'sort',pr.sort,
          'note',pr.stock_note,
          'joined', case when exists(select 1 from kb_stokvel_tiers where product_id=pr.id)
                         then kb_joined_count(pr.id,t.id) else null end,
          'tiers', (select coalesce(json_agg(json_build_object('qty',qty,'price',price) order by qty),'[]'::json)
                    from kb_stokvel_tiers where product_id=pr.id)
        ) p, pr.sort
        from kb_products pr where pr.active order by pr.sort
      ) s)
  ) into res;
  return res;
end $$;

-- ============ seed the first super admin + a coordinator per Free State town ============
insert into kb_admins(username,pass_hash,name,role)
values ('admin', crypt('KasiBuy-Admin-2026', gen_salt('bf',10)), 'KasiBuy HQ', 'super')
on conflict (username) do nothing;

insert into kb_coordinators(town_id,name,phone)
select id, 'Coordinator — '||name, null from kb_towns where province='Free State'
on conflict do nothing;
