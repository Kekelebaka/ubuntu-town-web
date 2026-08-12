-- pin search_path on the pricing helpers (advisor: function_search_path_mutable)
create or replace function kb_joined_count(p_product int, p_town int)
returns int language sql stable set search_path=public as $$
  select coalesce((select n from kb_stokvel_baseline where product_id=p_product and town_id=p_town),0)
       + (select count(*)::int from kb_stokvel_joins where product_id=p_product and town_id=p_town);
$$;

create or replace function kb_price_for(p_product int, p_town int)
returns int language sql stable set search_path=public as $$
  with n as (select kb_joined_count(p_product,p_town) c)
  select coalesce(
    (select t.price from kb_stokvel_tiers t, n
      where t.product_id=p_product and t.qty <= n.c
      order by t.qty desc limit 1),
    (select price from kb_products where id=p_product)
  );
$$;