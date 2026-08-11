-- ============================================================
-- 009  Ubuntu Town SSO for coordinators  +  Paystack on the terminal
-- ============================================================

-- ---------- console users can now be Ubuntu Town accounts ----------
alter table kb_admins add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table kb_admins add column if not exists email text;
alter table kb_admins alter column pass_hash drop not null;   -- SSO users have no local password
create unique index if not exists kb_admins_email_uq on kb_admins (lower(email)) where email is not null;
create unique index if not exists kb_admins_auth_uq  on kb_admins (auth_user_id) where auth_user_id is not null;

-- ---------- secrets: service role only, never exposed to the browser ----------
create table if not exists kb_secrets (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);
alter table kb_secrets enable row level security;   -- no policies at all

-- ---------- payment state on orders ----------
alter table kb_orders add column if not exists payment_method text;         -- cash | card | eft | other
alter table kb_orders add column if not exists payment_status text not null default 'unpaid';
alter table kb_orders add column if not exists payment_ref text;
alter table kb_orders add column if not exists amount_paid int;
alter table kb_orders add column if not exists paid_at timestamptz;
alter table kb_orders add column if not exists captured_by int references kb_points(id);
create index if not exists kb_orders_payref on kb_orders(payment_ref) where payment_ref is not null;

-- ============================================================
-- SSO: bind an Ubuntu Town account to a console role
-- ============================================================
create or replace function kb_admin_sso(p_email text, p_auth_id uuid)
returns json language plpgsql security definer set search_path=public as $$
declare a kb_admins; t uuid;
begin
  if p_email is null or p_auth_id is null then
    return json_build_object('ok',false,'error','bad_request'); end if;

  select * into a from kb_admins where auth_user_id = p_auth_id and active;
  if a.id is null then
    select * into a from kb_admins where lower(email) = lower(p_email) and active;
    if a.id is not null then
      update kb_admins set auth_user_id = p_auth_id where id = a.id;
    end if;
  end if;

  if a.id is null then
    return json_build_object('ok',false,'error','not_invited');
  end if;

  delete from kb_sessions where expires_at < now();
  insert into kb_sessions(admin_id) values (a.id) returning token into t;
  return json_build_object('ok',true,'token',t,'admin',
    json_build_object('name',a.name,'role',a.role,'username',coalesce(a.username,a.email),
      'town',(select name from kb_towns where id=a.town_id),'town_id',a.town_id,'sso',true));
end $$;

-- ============================================================
-- HQ invites a coordinator by their Ubuntu Town email
-- ============================================================
create or replace function kb_admin_invite(p_token uuid, p_email text, p_name text, p_role text, p_town int)
returns json language plpgsql security definer set search_path=public as $$
declare me json; exists_id int;
begin
  me := kb_admin_whoami(p_token);
  if not (me->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;
  if (me->'admin'->>'role') <> 'super' then return json_build_object('ok',false,'error','super_only'); end if;
  if coalesce(p_email,'') = '' or position('@' in p_email) = 0 then
    return json_build_object('ok',false,'error','bad_email'); end if;
  if p_role not in ('super','coordinator') then return json_build_object('ok',false,'error','bad_role'); end if;

  select id into exists_id from kb_admins where lower(email)=lower(trim(p_email));
  if exists_id is not null then
    update kb_admins set name=coalesce(nullif(trim(p_name),''),name), role=p_role,
      town_id=p_town, active=true where id=exists_id;
    return json_build_object('ok',true,'updated',true,
      'has_account',(select count(*)>0 from auth.users where lower(email)=lower(trim(p_email))));
  end if;

  insert into kb_admins(username,email,name,role,town_id,pass_hash)
  values (lower(trim(p_email)), lower(trim(p_email)),
          coalesce(nullif(trim(p_name),''), split_part(p_email,'@',1)), p_role, p_town, null);

  return json_build_object('ok',true,'created',true,
    'has_account',(select count(*)>0 from auth.users where lower(email)=lower(trim(p_email))));
end $$;

create or replace function kb_admin_team(p_token uuid)
returns json language plpgsql security definer set search_path=public as $$
declare me json;
begin
  me := kb_admin_whoami(p_token);
  if not (me->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;
  return json_build_object('ok',true,'team',(
    select coalesce(json_agg(json_build_object(
      'id',a.id,'name',a.name,'email',a.email,'username',a.username,'role',a.role,
      'town',(select name from kb_towns where id=a.town_id),'active',a.active,
      'sso_linked',a.auth_user_id is not null,
      'has_ubuntu_account',(select count(*)>0 from auth.users u where lower(u.email)=lower(a.email))
    ) order by a.role, a.name),'[]'::json) from kb_admins a));
end $$;

create or replace function kb_admin_set_active(p_token uuid, p_id int, p_active boolean)
returns json language plpgsql security definer set search_path=public as $$
declare me json;
begin
  me := kb_admin_whoami(p_token);
  if not (me->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;
  if (me->'admin'->>'role') <> 'super' then return json_build_object('ok',false,'error','super_only'); end if;
  if (me->'admin'->>'id')::int = p_id then return json_build_object('ok',false,'error','cannot_disable_self'); end if;
  update kb_admins set active=p_active where id=p_id;
  if not p_active then delete from kb_sessions where admin_id=p_id; end if;
  return json_build_object('ok',true);
end $$;

-- ============================================================
-- POS: capture a sale at the counter
-- ============================================================
create or replace function kb_pos_create_order(p_point int, p_pin text, p_items jsonb, p_phone text default null)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points; t kb_towns; o kb_orders; v_no text; v_otp text; v_total int := 0;
        it jsonb; pr kb_products; v_price int; v_qty int;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  select * into t from kb_towns where id=pt.town_id;
  if p_items is null or jsonb_array_length(p_items)=0 then return json_build_object('ok',false,'error','empty'); end if;
  if jsonb_array_length(p_items) > 25 then return json_build_object('ok',false,'error','too_many'); end if;

  v_no  := 'KB-' || to_char(now(),'MMDD') || lpad((floor(random()*9000)+1000)::text,4,'0');
  v_otp := lpad((floor(random()*9000)+1000)::text,4,'0');

  insert into kb_orders(order_no,town_id,point_id,total,otp,phone,captured_by)
    values (v_no,t.id,pt.id,0,v_otp,nullif(p_phone,''),pt.id) returning * into o;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from kb_products where code=upper(it->>'code') and active;
    continue when pr.id is null;
    v_qty := greatest(1, least(20, coalesce((it->>'qty')::int,1)));
    v_price := kb_price_for(pr.id, t.id);
    insert into kb_order_items(order_id,product_id,qty,unit_price) values (o.id,pr.id,v_qty,v_price);
    v_total := v_total + (v_price*v_qty);
  end loop;

  if v_total = 0 then delete from kb_orders where id=o.id;
    return json_build_object('ok',false,'error','no_valid_items'); end if;
  update kb_orders set total=v_total where id=o.id;

  return json_build_object('ok',true,'order_no',v_no,'otp',v_otp,'total',v_total,
    'town',t.name,'point',pt.name);
end $$;

-- cash taken at the counter
create or replace function kb_pos_cash(p_point int, p_pin text, p_order text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points; o kb_orders;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  select * into o from kb_orders where upper(order_no)=upper(trim(p_order)) and point_id=pt.id;
  if o.id is null then return json_build_object('ok',false,'error','not_at_this_point'); end if;
  if o.payment_status = 'paid' then return json_build_object('ok',false,'error','already_paid'); end if;
  update kb_orders set payment_status='paid', payment_method='cash', amount_paid=o.total,
    paid_at=now(), status=case when status='placed' then 'ordered' else status end
    where id=o.id;
  return json_build_object('ok',true,'order_no',o.order_no,'total',o.total);
end $$;

-- read one order for the terminal
create or replace function kb_pos_order(p_point int, p_pin text, p_order text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points; o kb_orders;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  select * into o from kb_orders where upper(order_no)=upper(trim(p_order)) and point_id=pt.id;
  if o.id is null then return json_build_object('ok',false,'error','not_found'); end if;
  return json_build_object('ok',true,'order_no',o.order_no,'total',o.total,'otp',o.otp,
    'status',o.status,'payment_status',o.payment_status,'payment_method',o.payment_method,
    'items',(select coalesce(json_agg(pr.code||' — '||pr.name||' x'||i.qty),'[]'::json)
             from kb_order_items i join kb_products pr on pr.id=i.product_id where i.order_id=o.id));
end $$;

-- queue now shows whether the money is in
create or replace function kb_pos_queue(p_point int, p_pin text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  return json_build_object('ok',true,'orders',(
    select coalesce(json_agg(json_build_object('order_no',o.order_no,'total',o.total,'status',o.status,
      'payment_status',o.payment_status,'payment_method',o.payment_method,'placed',o.created_at,
      'items',(select coalesce(json_agg(pr.code||' — '||pr.name||' x'||i.qty),'[]'::json)
               from kb_order_items i join kb_products pr on pr.id=i.product_id where i.order_id=o.id))
      order by o.created_at desc),'[]'::json)
    from kb_orders o where o.point_id=pt.id and o.status <> 'collected'));
end $$;

-- ============================================================
-- Paystack: called only by the Edge Function (service role)
-- ============================================================
create or replace function kb_pay_prepare(p_point int, p_pin text, p_order text)
returns json language plpgsql security definer set search_path=public as $$
declare pt kb_points; o kb_orders; t kb_towns;
begin
  select * into pt from kb_points where point_no=p_point and active;
  if pt.id is null or pt.pin <> trim(p_pin) then return json_build_object('ok',false,'error','bad_pin'); end if;
  select * into o from kb_orders where upper(order_no)=upper(trim(p_order)) and point_id=pt.id;
  if o.id is null then return json_build_object('ok',false,'error','not_found'); end if;
  if o.payment_status='paid' then return json_build_object('ok',false,'error','already_paid'); end if;
  select * into t from kb_towns where id=o.town_id;
  return json_build_object('ok',true,'order_no',o.order_no,'total',o.total,'town',t.name,
    'point',pt.name,'phone',o.phone);
end $$;

create or replace function kb_pay_record(p_order text, p_ref text, p_status text, p_amount int, p_method text)
returns json language plpgsql security definer set search_path=public as $$
declare o kb_orders;
begin
  select * into o from kb_orders where upper(order_no)=upper(trim(p_order));
  if o.id is null then return json_build_object('ok',false,'error','not_found'); end if;
  if p_status='paid' then
    -- never mark paid for less than the order total
    if coalesce(p_amount,0) < o.total then
      return json_build_object('ok',false,'error','underpaid','expected',o.total,'received',p_amount);
    end if;
    update kb_orders set payment_status='paid', payment_method=coalesce(p_method,'card'),
      payment_ref=p_ref, amount_paid=p_amount, paid_at=now(),
      status=case when status='placed' then 'ordered' else status end
      where id=o.id;
  else
    update kb_orders set payment_ref=coalesce(p_ref,payment_ref),
      payment_status=case when payment_status='paid' then 'paid' else p_status end where id=o.id;
  end if;
  return json_build_object('ok',true,'order_no',o.order_no,'payment_status',
    (select payment_status from kb_orders where id=o.id));
end $$;

-- ============================================================
-- grants
-- ============================================================
grant execute on function kb_pos_create_order(int,text,jsonb,text) to anon, authenticated;
grant execute on function kb_pos_cash(int,text,text)              to anon, authenticated;
grant execute on function kb_pos_order(int,text,text)             to anon, authenticated;

revoke execute on function kb_admin_sso(text,uuid)                     from public;
revoke execute on function kb_admin_invite(uuid,text,text,text,int)    from public;
revoke execute on function kb_admin_team(uuid)                         from public;
revoke execute on function kb_admin_set_active(uuid,int,boolean)       from public;
revoke execute on function kb_pay_prepare(int,text,text)               from public;
revoke execute on function kb_pay_record(text,text,text,int,text)      from public;
grant execute on function kb_admin_sso(text,uuid)                      to service_role;
grant execute on function kb_admin_invite(uuid,text,text,text,int)     to service_role;
grant execute on function kb_admin_team(uuid)                          to service_role;
grant execute on function kb_admin_set_active(uuid,int,boolean)        to service_role;
grant execute on function kb_pay_prepare(int,text,text)                to service_role;
grant execute on function kb_pay_record(text,text,text,int,text)       to service_role;

-- dashboard: surface money-in
create or replace function kb_admin_paystats(p_token uuid)
returns json language plpgsql security definer set search_path=public as $$
declare me json;
begin
  me := kb_admin_whoami(p_token);
  if not (me->>'ok')::boolean then return json_build_object('ok',false,'error','session'); end if;
  return json_build_object('ok',true,
    'paid_total',(select coalesce(sum(amount_paid),0) from kb_orders where payment_status='paid'),
    'paid_count',(select count(*) from kb_orders where payment_status='paid'),
    'unpaid_count',(select count(*) from kb_orders where payment_status<>'paid'),
    'by_method',(select coalesce(json_agg(json_build_object('method',coalesce(payment_method,'unpaid'),
        'n',c,'value',v)),'[]'::json) from (
      select payment_method, count(*) c, coalesce(sum(amount_paid),0) v
      from kb_orders group by payment_method) s));
end $$;
revoke execute on function kb_admin_paystats(uuid) from public;
grant  execute on function kb_admin_paystats(uuid) to service_role;

notify pgrst, 'reload schema';
