-- ============================================================
-- Luno — Migration 3: security hardening.
-- Run ONCE in Supabase SQL Editor (after schema2-accounts.sql).
-- Adds order rate-limiting so bots can't flood you with fake orders.
-- ============================================================

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

  -- Rate limit: max 5 orders per email per hour.
  if (select count(*) from orders
       where email = lower(trim(p_email))
         and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many orders placed recently. Please try again in an hour.';
  end if;

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
-- ALSO DO THESE IN THE DASHBOARD (no SQL needed):
-- 1. Authentication -> Attack Protection:
--    - enable "Leaked password protection"
--    - keep default rate limits on
-- 2. Authentication -> URL Configuration:
--    - set Site URL to your real domain (and localhost for dev)
--      so OAuth redirects can't be pointed at attacker sites.
-- 3. Use strong unique passwords + MFA for every admin account.
-- ============================================================
