-- ===== towns =====
insert into kb_towns(name,slug,province,shops) values
('Bethlehem','bethlehem','Free State',11),
('Bloemfontein','bloemfontein','Free State',4),
('Botshabelo','botshabelo','Free State',4),
('Ficksburg','ficksburg','Free State',11),
('Harrismith','harrismith','Free State',4),
('Ladybrand','ladybrand','Free State',11),
('Phuthaditjhaba','phuthaditjhaba','Free State',4),
('Senekal','senekal','Free State',11),
('Thaba Nchu','thaba-nchu','Free State',4),
('Welkom','welkom','Free State',4),
('Wepener','wepener','Free State',11),
('Carletonville','carletonville','Gauteng',11),
('Randfontein','randfontein','Gauteng',11),
('Soweto','soweto','Gauteng',4),
('Springs','springs','Gauteng',11),
('Tembisa','tembisa','Gauteng',11),
('Vanderbijlpark','vanderbijlpark','Gauteng',4),
('Dundee','dundee','KwaZulu-Natal',4),
('Greytown','greytown','KwaZulu-Natal',4),
('Harding','harding','KwaZulu-Natal',11),
('Kokstad','kokstad','KwaZulu-Natal',11),
('Newcastle','newcastle','KwaZulu-Natal',11),
('Nquthu','nquthu','KwaZulu-Natal',4),
('Richards Bay','richards-bay','KwaZulu-Natal',4),
('Acornhoek','acornhoek','Mpumalanga',11),
('Bushbuckridge','bushbuckridge','Mpumalanga',11),
('Emalahleni','emalahleni','Mpumalanga',4),
('Hazyview','hazyview','Mpumalanga',4),
('Mbombela','mbombela','Mpumalanga',4),
('Sabie','sabie','Mpumalanga',11),
('Burgersfort','burgersfort','Limpopo',11),
('Mokopane','mokopane','Limpopo',4),
('Polokwane','polokwane','Limpopo',11),
('Thohoyandou','thohoyandou','Limpopo',11),
('Tzaneen','tzaneen','Limpopo',11),
('KwaMaqoma','kwamaqoma','Eastern Cape',11),
('Matatiele','matatiele','Eastern Cape',11),
('Mthatha','mthatha','Eastern Cape',11),
('Sterkspruit','sterkspruit','Eastern Cape',11),
('Brits','brits','North West',11),
('Klerksdorp','klerksdorp','North West',4),
('Mahikeng','mahikeng','North West',4),
('Rustenburg','rustenburg','North West',4),
('De Aar','de-aar','Northern Cape',4),
('Kimberley','kimberley','Northern Cape',11),
('Kuruman','kuruman','Northern Cape',11),
('Upington','upington','Northern Cape',4),
('George','george','Western Cape',4),
('Paarl','paarl','Western Cape',11),
('Worcester','worcester','Western Cape',11)
on conflict (name) do update set province=excluded.province, slug=excluded.slug;

-- ===== products =====
insert into kb_products(code,name,price,was_price,category,icon,maker,maker_town,is_live,is_hero,sort) values
('KB4218','55\" Smart TV (4K, Netflix built in)',4999,6499,'Tech','screen',null,null,true,true,10),
('KB5104','Smartphone 128GB 5G, dual SIM',2499,2999,'Tech','phone',null,null,false,false,20),
('KB5133','Solar Home Kit — panel, battery, 2 lights',1499,null,'Tech','sun',null,null,true,false,30),
('KB5120','10\" Tablet + keyboard case',1899,null,'Tech','tablet',null,null,false,false,40),
('KB4110','4-Plate Stove with Oven',3299,3899,'Home','flame',null,null,false,false,50),
('KB4025','Double Door Fridge 314L',6499,null,'Home','box',null,null,false,false,60),
('KB3301','Washing Machine 7kg Front Loader',4899,null,'Home','drum',null,null,false,false,70),
('KB6081','3-Piece Lounge Suite',7999,9499,'Home','sofa',null,null,false,false,80),
('KB6070','5-Piece Sheet Set (Queen)',459,null,'Home','bed',null,null,false,false,90),
('KB6099','Heavy Winter Blanket 3kg',399,null,'Home','bed',null,null,false,false,100),
('KB4402','9kg Gas Cylinder + Regulator',749,null,'Home','flame',null,null,false,false,110),
('KB2207','School Shoes — genuine leather',329,429,'School','shoe',null,null,false,false,120),
('KB2210','Full School Uniform Set',649,null,'School','shirt',null,null,false,false,130),
('KB2255','School Backpack + Lunch Kit',289,null,'School','bag',null,null,false,false,140),
('KB7011','Cordless Drill 20V + 60pc bit set',899,null,'Tools','tool',null,null,false,false,150),
('KB7020','Angle Grinder 850W',649,null,'Tools','tool',null,null,false,false,160),
('KB7044','Heavy Duty Wheelbarrow',699,null,'Tools','cart',null,null,false,false,170),
('KB8005','Baby Travel System — pram + car seat',1899,2499,'Baby','pram',null,null,false,false,180),
('KB8012','Nappy Value Case (2 months)',549,null,'Baby','box',null,null,false,false,190),
('KB9001','Men's Leather Sneakers',899,null,'Fashion','shoe',null,null,true,false,200),
('KB9014','Women's Winter Puffer Jacket',649,null,'Fashion','shirt',null,null,false,false,210),
('KB9030','Soccer Kit — full team of 15',2199,null,'Fashion','ball',null,null,false,false,220),
('K2K118','Signature Print Dress',450,null,'K2K','shirt','Nomvula''s Sewing','Harrismith',true,false,230),
('K2K204','Solid Pine Kitchen Unit',2800,null,'K2K','cabinet','Bra Tsepo Woodworks','Botshabelo',false,false,240),
('K2K077','Farm Rusks 1kg Box',65,null,'K2K','cookie','Mama Dlamini Bakery','Sterkspruit',false,false,250),
('K2K311','Welded Security Gate',1950,null,'K2K','gate','Iron Sons','Ladybrand',false,false,260),
('K2K402','Hand-Knitted Blanket',520,null,'K2K','bed','QwaQwa Craft Collective','Phuthaditjhaba',false,false,270),
('K2K455','Beaded Necklace Set',180,null,'K2K','beads','Thandi Beads','Thaba Nchu',false,false,280)
on conflict (code) do update set name=excluded.name,price=excluded.price,was_price=excluded.was_price,category=excluded.category,icon=excluded.icon,maker=excluded.maker,maker_town=excluded.maker_town,is_live=excluded.is_live,sort=excluded.sort,active=true;

-- ===== stokvel tiers =====
insert into kb_stokvel_tiers(product_id,qty,price) values
((select id from kb_products where code='KB5104'),10,2399),
((select id from kb_products where code='KB5104'),25,2299),
((select id from kb_products where code='KB5104'),50,2149),
((select id from kb_products where code='KB6070'),10,429),
((select id from kb_products where code='KB6070'),25,399),
((select id from kb_products where code='KB6070'),50,369),
((select id from kb_products where code='KB6099'),10,369),
((select id from kb_products where code='KB6099'),25,339),
((select id from kb_products where code='KB6099'),50,299),
((select id from kb_products where code='KB2207'),10,309),
((select id from kb_products where code='KB2207'),25,289),
((select id from kb_products where code='KB2207'),50,259),
((select id from kb_products where code='KB2210'),10,615),
((select id from kb_products where code='KB2210'),25,579),
((select id from kb_products where code='KB2210'),50,529),
((select id from kb_products where code='KB8012'),10,519),
((select id from kb_products where code='KB8012'),25,489),
((select id from kb_products where code='KB8012'),50,449),
((select id from kb_products where code='K2K077'),10,60),
((select id from kb_products where code='K2K077'),25,55),
((select id from kb_products where code='K2K077'),50,49)
on conflict (product_id,qty) do update set price=excluded.price;

-- ===== collection points: 3 per town, deterministic from a name pool =====
delete from kb_points;
insert into kb_points(town_id,name,distance_km,point_no)
select t.id,
       (array['Mahlatsi Cash Store','Ngwenya Superette','Bra Vusi General Dealer','Dipuo Mini Market',
              'Sizwe Trading Store','Mofokeng Spaza and Airtime','Khumalo Corner Store','Tshepo Value Mart'])[((t.id + i) % 8) + 1],
       (array[0.4,1.1,2.3])[i],
       t.id*10 + i
from kb_towns t cross join generate_series(1,3) i;

-- ===== stokvel baselines so no town opens on zero =====
delete from kb_stokvel_baseline;
insert into kb_stokvel_baseline(product_id,town_id,n)
select p.id, t.id,
       3 + (abs(hashtext(p.code || t.slug)) % greatest(2,(select max(qty)-5 from kb_stokvel_tiers where product_id=p.id)))
from kb_products p cross join kb_towns t
where exists (select 1 from kb_stokvel_tiers z where z.product_id=p.id);