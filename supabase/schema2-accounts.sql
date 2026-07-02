-- ============================================================
-- Luno — Migration 2: customer accounts.
-- Run ONCE in Supabase SQL Editor (after schema.sql).
-- Adds: profiles, saved carts, orders linked to accounts.
-- ============================================================

-- ---------- profiles: customer details ----------
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profile own" on profiles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- carts: saved bag + wishlist per account ----------
create table if not exists carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]',
  wishlist jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table carts enable row level security;
create policy "cart own" on carts
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- link orders to accounts ----------
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;

-- customers can read their own orders (admins already have full access)
create policy "orders read own" on orders
  for select to authenticated using (user_id = auth.uid());
create policy "items read own" on order_items
  for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- ---------- place_order v2: attaches the signed-in user ----------
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

  insert into orders (order_number, customer_name, email, phone, address, city, user_id)
  values (v_order_number, trim(p_name), lower(trim(p_email)),
          coalesce(left(p_phone, 40), ''), left(p_address, 500), coalesce(left(p_city, 100), ''),
          auth.uid())
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

-- ============================================================
-- GOOGLE LOGIN (optional): Dashboard -> Authentication ->
-- Sign In / Providers -> Google -> enable, paste the Client ID and
-- Secret from Google Cloud Console (OAuth consent + credentials).
-- Until enabled, the "Continue with Google" button shows an error.
-- ============================================================
