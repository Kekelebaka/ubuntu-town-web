-- ============================================================
-- KasiBuy — Township Commerce OS
-- All objects prefixed kb_ to coexist with Ubuntu Town OS tables
-- ============================================================

create table if not exists kb_towns (
  id          serial primary key,
  name        text not null unique,
  slug        text not null unique,
  province    text not null,
  shops       int  not null default 6,
  is_metro_node boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists kb_points (
  id         serial primary key,
  town_id    int not null references kb_towns(id) on delete cascade,
  name       text not null,
  distance_km numeric(4,1) not null default 1.0,
  point_no   int,
  has_pos    boolean not null default true,
  active     boolean not null default true
);
create index if not exists kb_points_town on kb_points(town_id);

create table if not exists kb_products (
  id         serial primary key,
  code       text not null unique,
  name       text not null,
  price      int  not null,                 -- rands, whole
  was_price  int,
  category   text not null,
  icon       text not null default 'box',
  image_url  text,
  maker      text,
  maker_town text,
  is_live    boolean not null default false,
  is_hero    boolean not null default false,
  week       int not null default 32,
  sort       int not null default 100,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists kb_products_cat on kb_products(category) where active;

create table if not exists kb_stokvel_tiers (
  id         serial primary key,
  product_id int not null references kb_products(id) on delete cascade,
  qty        int not null,
  price      int not null,
  unique (product_id, qty)
);

-- one join per device per product per town
create table if not exists kb_stokvel_joins (
  id         uuid primary key default gen_random_uuid(),
  product_id int  not null references kb_products(id) on delete cascade,
  town_id    int  not null references kb_towns(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz not null default now(),
  unique (product_id, town_id, device_id)
);
create index if not exists kb_joins_lookup on kb_stokvel_joins(product_id, town_id);

-- seeded baseline so a brand-new town does not read "0 joined"
create table if not exists kb_stokvel_baseline (
  product_id int not null references kb_products(id) on delete cascade,
  town_id    int not null references kb_towns(id) on delete cascade,
  n          int not null default 0,
  primary key (product_id, town_id)
);

create table if not exists kb_orders (
  id          uuid primary key default gen_random_uuid(),
  order_no    text not null unique,
  town_id     int  not null references kb_towns(id),
  point_id    int  references kb_points(id),
  total       int  not null,
  otp         text not null,
  status      text not null default 'placed',
  phone       text,
  created_at  timestamptz not null default now()
);

create table if not exists kb_order_items (
  id         serial primary key,
  order_id   uuid not null references kb_orders(id) on delete cascade,
  product_id int  not null references kb_products(id),
  qty        int  not null check (qty > 0),
  unit_price int  not null
);
create index if not exists kb_items_order on kb_order_items(order_id);

create table if not exists kb_applications (
  id         serial primary key,
  kind       text not null check (kind in ('merchant','partner','maker','live','group')),
  town       text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table kb_towns            enable row level security;
alter table kb_points           enable row level security;
alter table kb_products         enable row level security;
alter table kb_stokvel_tiers    enable row level security;
alter table kb_stokvel_joins    enable row level security;
alter table kb_stokvel_baseline enable row level security;
alter table kb_orders           enable row level security;
alter table kb_order_items      enable row level security;
alter table kb_applications     enable row level security;

-- public read of the catalogue
drop policy if exists kb_r_towns    on kb_towns;
create policy kb_r_towns    on kb_towns            for select using (active);
drop policy if exists kb_r_points   on kb_points;
create policy kb_r_points   on kb_points           for select using (active);
drop policy if exists kb_r_products on kb_products;
create policy kb_r_products on kb_products         for select using (active);
drop policy if exists kb_r_tiers    on kb_stokvel_tiers;
create policy kb_r_tiers    on kb_stokvel_tiers    for select using (true);
drop policy if exists kb_r_joins    on kb_stokvel_joins;
create policy kb_r_joins    on kb_stokvel_joins    for select using (true);
drop policy if exists kb_r_base     on kb_stokvel_baseline;
create policy kb_r_base     on kb_stokvel_baseline for select using (true);
-- anyone may apply to join the network; nobody may read applications
drop policy if exists kb_i_apps     on kb_applications;
create policy kb_i_apps     on kb_applications     for insert with check (true);
-- NOTE: kb_orders, kb_order_items and writes to kb_stokvel_joins are
-- deliberately left with no policy. They are reachable only through the
-- security-definer RPCs below, so a leaked publishable key cannot read
-- other people's orders or forge prices.

-- ============================================================
-- Pricing helper: current price for a product in a town
-- ============================================================
create or replace function kb_joined_count(p_product int, p_town int)
returns int language sql stable as $$
  select coalesce((select n from kb_stokvel_baseline where product_id=p_product and town_id=p_town),0)
       + (select count(*)::int from kb_stokvel_joins where product_id=p_product and town_id=p_town);
$$;

create or replace function kb_price_for(p_product int, p_town int)
returns int language sql stable as $$
  with n as (select kb_joined_count(p_product,p_town) c)
  select coalesce(
    (select t.price from kb_stokvel_tiers t, n
      where t.product_id=p_product and t.qty <= n.c
      order by t.qty desc limit 1),
    (select price from kb_products where id=p_product)
  );
$$;

-- ============================================================
-- RPC: the whole poster for one town, in one round trip
-- ============================================================
create or replace function kb_poster(p_town text)
returns json language plpgsql stable security definer set search_path=public as $$
declare t kb_towns; res json;
begin
  select * into t from kb_towns where slug=p_town or name=p_town limit 1;
  if t.id is null then select * into t from kb_towns order by id limit 1; end if;

  select json_build_object(
    'town', json_build_object('id',t.id,'name',t.name,'slug',t.slug,'province',t.province,'shops',t.shops),
    'points', (select coalesce(json_agg(json_build_object('id',id,'name',name,'km',distance_km) order by distance_km),'[]'::json)
               from kb_points where town_id=t.id and active),
    'products', (select coalesce(json_agg(s.p order by s.sort),'[]'::json) from (
        select json_build_object(
          'code',pr.code,'name',pr.name,'price',kb_price_for(pr.id,t.id),'list_price',pr.price,
          'was',pr.was_price,'category',pr.category,'icon',pr.icon,'image',pr.image_url,
          'maker',pr.maker,'maker_town',pr.maker_town,'live',pr.is_live,'hero',pr.is_hero,'sort',pr.sort,
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

-- ============================================================
-- RPC: join a stokvel (atomic, idempotent per device)
-- ============================================================
create or replace function kb_join_stokvel(p_code text, p_town text, p_device text)
returns json language plpgsql security definer set search_path=public as $$
declare v_p kb_products; v_t kb_towns; v_before int; v_after int; v_n int; v_next json;
begin
  if coalesce(length(p_device),0) < 8 then
    return json_build_object('ok',false,'error','bad_device');
  end if;
  select * into v_p from kb_products where code=upper(p_code) and active;
  select * into v_t from kb_towns where slug=p_town or name=p_town limit 1;
  if v_p.id is null or v_t.id is null then
    return json_build_object('ok',false,'error','not_found');
  end if;
  if not exists (select 1 from kb_stokvel_tiers where product_id=v_p.id) then
    return json_build_object('ok',false,'error','no_stokvel');
  end if;

  v_before := kb_price_for(v_p.id, v_t.id);
  insert into kb_stokvel_joins(product_id,town_id,device_id)
    values (v_p.id, v_t.id, p_device)
    on conflict (product_id,town_id,device_id) do nothing;
  v_after := kb_price_for(v_p.id, v_t.id);
  v_n     := kb_joined_count(v_p.id, v_t.id);

  select json_build_object('qty',qty,'price',price) into v_next
    from kb_stokvel_tiers where product_id=v_p.id and qty > v_n order by qty limit 1;

  return json_build_object('ok',true,'code',v_p.code,'joined',v_n,
    'price',v_after,'dropped',(v_after < v_before),'next',v_next,'town',v_t.name);
end $$;

-- ============================================================
-- RPC: place an order. Prices are recomputed server-side.
-- ============================================================
create or replace function kb_place_order(p_town text, p_point int, p_items jsonb, p_phone text default null)
returns json language plpgsql security definer set search_path=public as $$
declare v_t kb_towns; v_o kb_orders; v_no text; v_otp text; v_total int := 0;
        it jsonb; v_p kb_products; v_price int; v_qty int; v_point int;
begin
  select * into v_t from kb_towns where slug=p_town or name=p_town limit 1;
  if v_t.id is null then return json_build_object('ok',false,'error','bad_town'); end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return json_build_object('ok',false,'error','empty'); end if;
  if jsonb_array_length(p_items) > 25 then
    return json_build_object('ok',false,'error','too_many'); end if;

  select id into v_point from kb_points
    where town_id=v_t.id and (p_point is null or id=p_point) and active
    order by (id = coalesce(p_point,-1)) desc, distance_km limit 1;

  v_no  := 'KB-' || to_char(now(),'MMDD') || lpad((floor(random()*9000)+1000)::text,4,'0');
  v_otp := lpad((floor(random()*9000)+1000)::text,4,'0');

  insert into kb_orders(order_no,town_id,point_id,total,otp,phone)
    values (v_no, v_t.id, v_point, 0, v_otp, nullif(p_phone,''))
    returning * into v_o;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into v_p from kb_products where code=upper(it->>'code') and active;
    continue when v_p.id is null;
    v_qty := greatest(1, least(20, coalesce((it->>'qty')::int,1)));
    v_price := kb_price_for(v_p.id, v_t.id);
    insert into kb_order_items(order_id,product_id,qty,unit_price)
      values (v_o.id, v_p.id, v_qty, v_price);
    v_total := v_total + (v_price * v_qty);
  end loop;

  if v_total = 0 then
    delete from kb_orders where id=v_o.id;
    return json_build_object('ok',false,'error','no_valid_items');
  end if;
  update kb_orders set total=v_total where id=v_o.id;

  return json_build_object('ok',true,'order_no',v_no,'otp',v_otp,'total',v_total,
    'point',(select name from kb_points where id=v_point),'town',v_t.name);
end $$;

-- ============================================================
-- RPC: track an order (order number acts as the bearer token)
-- ============================================================
create or replace function kb_track_order(p_order_no text)
returns json language plpgsql stable security definer set search_path=public as $$
declare v json;
begin
  select json_build_object('ok',true,'order_no',o.order_no,'status',o.status,'total',o.total,
      'otp',o.otp,'placed',o.created_at,'town',t.name,'point',pt.name,
      'items',(select coalesce(json_agg(json_build_object('code',pr.code,'name',pr.name,'qty',i.qty,'price',i.unit_price)),'[]'::json)
               from kb_order_items i join kb_products pr on pr.id=i.product_id where i.order_id=o.id))
    into v
  from kb_orders o join kb_towns t on t.id=o.town_id
  left join kb_points pt on pt.id=o.point_id
  where upper(o.order_no)=upper(trim(p_order_no));
  return coalesce(v, json_build_object('ok',false,'error','not_found'));
end $$;

-- ============================================================
-- RPC: apply to join the network
-- ============================================================
create or replace function kb_apply(p_kind text, p_town text, p_payload jsonb)
returns json language plpgsql security definer set search_path=public as $$
begin
  if p_kind not in ('merchant','partner','maker','live','group') then
    return json_build_object('ok',false,'error','bad_kind'); end if;
  insert into kb_applications(kind,town,payload) values (p_kind,p_town,coalesce(p_payload,'{}'::jsonb));
  return json_build_object('ok',true);
end $$;

grant execute on function kb_poster(text)                       to anon, authenticated;
grant execute on function kb_join_stokvel(text,text,text)       to anon, authenticated;
grant execute on function kb_place_order(text,int,jsonb,text)   to anon, authenticated;
grant execute on function kb_track_order(text)                  to anon, authenticated;
grant execute on function kb_apply(text,text,jsonb)             to anon, authenticated;
