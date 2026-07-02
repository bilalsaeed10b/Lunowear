-- ============================================================
-- Luno — Supabase schema. Run ONCE in Supabase SQL Editor.
-- Creates: categories, products, orders, order_items, admins,
-- RLS policies, storage bucket, place_order / track_order RPCs,
-- and seeds the current demo catalog.
-- ============================================================

-- ---------- Tables ----------

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_slug text not null references categories(slug) on update cascade,
  fit text default '',
  dept text not null default 'MEN',
  price integer not null check (price >= 0),
  compare_at integer check (compare_at is null or compare_at > 0),
  badge text check (badge in ('sale','new') or badge is null),
  description text default '',
  colors jsonb not null default '[]',   -- [{"name":"Black","hex":"#1a1a1a"}]
  sizes jsonb not null default '[]',    -- ["S","M","L"]
  images jsonb not null default '[]',   -- ["https://..."]
  sold_out boolean not null default false,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  email text not null,
  phone text default '',
  address text not null,
  city text default '',
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  total integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,          -- snapshot at purchase time
  price integer not null,
  color text default '',
  size text default '',
  qty int not null check (qty between 1 and 20),
  image text default ''
);

-- Who is allowed to use the admin panel. Add rows via SQL editor only.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ---------- is_admin helper ----------

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from admins where user_id = auth.uid()) $$;

-- ---------- Row Level Security ----------

alter table categories  enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table admins      enable row level security;

-- categories: everyone reads, only admins write
create policy "cat read"   on categories for select using (true);
create policy "cat insert" on categories for insert to authenticated with check (is_admin());
create policy "cat update" on categories for update to authenticated using (is_admin()) with check (is_admin());
create policy "cat delete" on categories for delete to authenticated using (is_admin());

-- products: public sees active only, admins see + write everything
create policy "prod read"   on products for select using (active or is_admin());
create policy "prod insert" on products for insert to authenticated with check (is_admin());
create policy "prod update" on products for update to authenticated using (is_admin()) with check (is_admin());
create policy "prod delete" on products for delete to authenticated using (is_admin());

-- orders: admins only. Customers create via place_order() and read via track_order().
create policy "orders read"   on orders for select to authenticated using (is_admin());
create policy "orders update" on orders for update to authenticated using (is_admin()) with check (is_admin());

create policy "items read" on order_items for select to authenticated using (is_admin());

-- admins: only admins can see the list; nobody writes via the API
create policy "admins read" on admins for select to authenticated using (is_admin());

-- ---------- Storage: product images ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "img read"   on storage.objects for select using (bucket_id = 'product-images');
create policy "img insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and is_admin());
create policy "img update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and is_admin());
create policy "img delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and is_admin());

-- ---------- place_order: creates an order safely ----------
-- Prices come from the DB, never from the client, so they can't be faked.

create or replace function place_order(
  p_name text, p_email text, p_phone text, p_address text, p_city text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_total integer := 0;
  v_item jsonb;
  v_product products%rowtype;
  v_qty int;
begin
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'Please enter your name.'; end if;
  if p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Please enter a valid email.'; end if;
  if p_address is null or length(trim(p_address)) < 5 then raise exception 'Please enter a delivery address.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your bag is empty.'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'Too many items in one order.'; end if;

  v_order_number := 'LW-' || upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into orders (order_number, customer_name, email, phone, address, city)
  values (v_order_number, trim(p_name), lower(trim(p_email)),
          coalesce(left(p_phone, 40), ''), left(p_address, 500), coalesce(left(p_city, 100), ''))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = (v_item->>'id')::uuid and active;
    if not found then raise exception 'A product in your bag is no longer available.'; end if;
    v_qty := coalesce((v_item->>'qty')::int, 1);
    if v_qty < 1 or v_qty > 20 then raise exception 'Invalid quantity.'; end if;
    v_total := v_total + v_product.price * v_qty;
    insert into order_items (order_id, product_id, name, price, color, size, qty, image)
    values (v_order_id, v_product.id, v_product.name, v_product.price,
            coalesce(left(v_item->>'color', 40), ''), coalesce(left(v_item->>'size', 20), ''),
            v_qty, coalesce(v_product.images->>0, ''));
  end loop;

  update orders set total = v_total where id = v_order_id;
  return jsonb_build_object('order_number', v_order_number, 'total', v_total);
end $$;

-- ---------- track_order: customer looks up own order ----------
-- Requires BOTH order number and email, so orders can't be enumerated.

create or replace function track_order(p_order_number text, p_email text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from orders
   where order_number = upper(trim(p_order_number))
     and email = lower(trim(p_email));
  if not found then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'price', price, 'color', color,
           'size', size, 'qty', qty, 'image', image)), '[]'::jsonb)
    into v_items from order_items where order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'total', v_order.total,
    'customer_name', v_order.customer_name,
    'city', v_order.city,
    'placed_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'items', v_items);
end $$;

-- ============================================================
-- SEED — current demo catalog (delete this section to start empty)
-- ============================================================

insert into categories (slug, name, position) values
  ('tshirts','T-Shirts',0), ('shirts','Shirts',1), ('polos','Polos',2),
  ('shorts','Shorts',3), ('jeans','Jeans',4), ('trousers','Trousers',5),
  ('activewear','Activewear',6), ('footwear','Footwear',7), ('accessories','Accessories',8)
on conflict (slug) do nothing;

with raw(name, cat, fit, price, compare_at, badge, sold_out, colors, seed, pos) as (values
  ('Color Block Raglan T-Shirt','tshirts','Regular Fit',1490,2490,'sale',false,'[{"name":"White","hex":"#f2f2f2"},{"name":"Black","hex":"#1a1a1a"},{"name":"Sky","hex":"#a9c3d6"}]'::jsonb,'f2000',0),
  ('Essential Crew Neck Tee','tshirts','Regular Fit',1290,null,null,false,'[{"name":"White","hex":"#f2f2f2"},{"name":"Black","hex":"#1a1a1a"},{"name":"Stone","hex":"#cdc3b4"}]'::jsonb,'f2001',1),
  ('Oversized Boxy Tee','tshirts','Oversized',1690,2290,'sale',false,'[{"name":"Stone","hex":"#cdc3b4"},{"name":"Olive","hex":"#6f7457"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2002',2),
  ('Heavyweight Pocket Tee','tshirts','Relaxed Fit',1590,null,'new',false,'[{"name":"Navy","hex":"#26314d"},{"name":"Grey","hex":"#9aa0a6"}]'::jsonb,'f2003',3),
  ('Textured Cuban Collar Shirt','shirts','Relaxed Fit',2990,null,'new',true,'[{"name":"Black","hex":"#1a1a1a"},{"name":"Stone","hex":"#cdc3b4"}]'::jsonb,'f2004',4),
  ('Striped Resort Shirt','shirts','Regular Fit',2490,3490,'sale',false,'[{"name":"Sky","hex":"#a9c3d6"},{"name":"White","hex":"#f2f2f2"}]'::jsonb,'f2005',5),
  ('Linen Blend Overshirt','shirts','Boxy Fit',3490,null,null,false,'[{"name":"Olive","hex":"#6f7457"},{"name":"Sand","hex":"#d9cbb0"}]'::jsonb,'f2006',6),
  ('Corduroy Utility Shirt','shirts','Regular Fit',3290,null,null,false,'[{"name":"Brown","hex":"#7a5a44"},{"name":"Navy","hex":"#26314d"}]'::jsonb,'f2007',7),
  ('Piqué Polo Shirt','polos','Regular Fit',1990,null,null,false,'[{"name":"Navy","hex":"#26314d"},{"name":"White","hex":"#f2f2f2"},{"name":"Olive","hex":"#6f7457"}]'::jsonb,'f2008',8),
  ('Zip Placket Knit Polo','polos','Slim Fit',2290,2990,'sale',true,'[{"name":"Stone","hex":"#cdc3b4"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2009',9),
  ('Ribbed Collar Polo','polos','Regular Fit',1890,null,null,false,'[{"name":"Grey","hex":"#9aa0a6"},{"name":"Navy","hex":"#26314d"}]'::jsonb,'f2010',10),
  ('Cargo Utility Shorts','shorts','Relaxed Fit',2190,null,'new',true,'[{"name":"Black","hex":"#1a1a1a"},{"name":"Olive","hex":"#6f7457"},{"name":"Sand","hex":"#d9cbb0"}]'::jsonb,'f2011',11),
  ('Denim Carpenter Shorts','shorts','Loose Fit',2490,3290,'sale',false,'[{"name":"Sky","hex":"#a9c3d6"}]'::jsonb,'f2012',12),
  ('Jersey Sweat Shorts','shorts','Regular Fit',1690,null,null,false,'[{"name":"Grey","hex":"#9aa0a6"},{"name":"Black","hex":"#1a1a1a"},{"name":"Navy","hex":"#26314d"}]'::jsonb,'f2013',13),
  ('Wide Leg Baggy Jeans','jeans','Baggy Fit',3990,null,'new',false,'[{"name":"Sky","hex":"#a9c3d6"}]'::jsonb,'f2014',14),
  ('Straight Fit Rigid Jeans','jeans','Straight Fit',3490,4490,'sale',false,'[{"name":"Navy","hex":"#26314d"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2015',15),
  ('Tapered Stretch Jeans','jeans','Tapered Fit',3290,null,null,false,'[{"name":"Sky","hex":"#a9c3d6"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2016',16),
  ('Pleated Wide Trousers','trousers','Relaxed Fit',3290,null,null,false,'[{"name":"Stone","hex":"#cdc3b4"},{"name":"Black","hex":"#1a1a1a"},{"name":"Olive","hex":"#6f7457"}]'::jsonb,'f2017',17),
  ('Drawcord Tapered Pants','trousers','Tapered Fit',2790,3590,'sale',true,'[{"name":"Navy","hex":"#26314d"},{"name":"Grey","hex":"#9aa0a6"}]'::jsonb,'f2018',18),
  ('Utility Cargo Trousers','trousers','Loose Fit',3490,null,'new',false,'[{"name":"Olive","hex":"#6f7457"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2019',19),
  ('Performance Training Tee','activewear','Athletic Fit',1790,null,null,false,'[{"name":"Black","hex":"#1a1a1a"},{"name":"Grey","hex":"#9aa0a6"}]'::jsonb,'f2020',20),
  ('Tech Fleece Zip Hoodie','activewear','Regular Fit',4290,5490,'sale',false,'[{"name":"Grey","hex":"#9aa0a6"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2021',21),
  ('Running Joggers','activewear','Slim Fit',2990,null,null,false,'[{"name":"Navy","hex":"#26314d"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2022',22),
  ('Low Top Court Sneakers','footwear','Regular',4990,null,'new',false,'[{"name":"White","hex":"#f2f2f2"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2023',23),
  ('Suede Chunky Trainers','footwear','Regular',5490,6990,'sale',false,'[{"name":"Stone","hex":"#cdc3b4"},{"name":"Grey","hex":"#9aa0a6"}]'::jsonb,'f2024',24),
  ('Slip-On Canvas Shoes','footwear','Regular',3290,null,null,false,'[{"name":"Black","hex":"#1a1a1a"},{"name":"White","hex":"#f2f2f2"}]'::jsonb,'f2025',25),
  ('Woven Leather Belt','accessories','One Size',1490,null,null,false,'[{"name":"Brown","hex":"#7a5a44"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2026',26),
  ('Ribbed Beanie','accessories','One Size',990,1490,'sale',false,'[{"name":"Black","hex":"#1a1a1a"},{"name":"Grey","hex":"#9aa0a6"},{"name":"Olive","hex":"#6f7457"}]'::jsonb,'f2027',27),
  ('Canvas Crossbody Bag','accessories','One Size',2290,null,'new',false,'[{"name":"Black","hex":"#1a1a1a"},{"name":"Sand","hex":"#d9cbb0"}]'::jsonb,'f2028',28),
  ('Structured Baseball Cap','accessories','One Size',1290,null,null,false,'[{"name":"Navy","hex":"#26314d"},{"name":"Stone","hex":"#cdc3b4"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,'f2029',29)
)
insert into products (name, category_slug, fit, dept, price, compare_at, badge, sold_out, colors, sizes, images, position)
select name, cat, fit, 'MEN', price, compare_at, badge, sold_out, colors,
  '["S","M","L","XL","XXL"]'::jsonb,
  jsonb_build_array(
    'https://picsum.photos/seed/luna-' || seed || 'a/640/854',
    'https://picsum.photos/seed/luna-' || seed || 'b/640/854',
    'https://picsum.photos/seed/luna-' || seed || 'c/640/854',
    'https://picsum.photos/seed/luna-' || seed || 'd/640/854'),
  pos
from raw;

-- ============================================================
-- AFTER RUNNING THIS FILE:
-- 1. Supabase Dashboard -> Authentication -> Users -> Add user
--    (email + strong password, check "Auto confirm user").
-- 2. Make that user an admin:
--    insert into admins (user_id, email)
--    select id, email from auth.users where email = 'you@example.com';
-- ============================================================
