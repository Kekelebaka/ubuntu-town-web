create or replace function kb_reseed_baseline(p_product int)
returns json language plpgsql security definer set search_path=public as $$
begin
  insert into kb_stokvel_baseline(product_id,town_id,n)
  select p_product, t.id,
         3 + (abs(hashtext((select code from kb_products where id=p_product) || t.slug)) % greatest(2,(select coalesce(max(qty),10)-5 from kb_stokvel_tiers where product_id=p_product)))
  from kb_towns t
  on conflict (product_id,town_id) do nothing;
  return json_build_object('ok',true);
end $$;
revoke all on function kb_reseed_baseline(int) from anon, authenticated;

-- also fix the two search_path advisor warnings on the pricing helpers
create or replace function kb_joined_count(p_product int, p_town int)
returns int language sql stable security definer set search_path=public as $$
  select coalesce((select n from kb_stokvel_baseline where product_id=p_product and town_id=p_town),0)
       + (select count(*)::int from kb_stokvel_joins where product_id=p_product and town_id=p_town);
$$;
create or replace function kb_price_for(p_product int, p_town int)
returns int language sql stable security definer set search_path=public as $$
  with n as (select kb_joined_count(p_product,p_town) c)
  select coalesce(
    (select t.price from kb_stokvel_tiers t, n
      where t.product_id=p_product and t.qty <= n.c
      order by t.qty desc limit 1),
    (select price from kb_products where id=p_product)
  );
$$;