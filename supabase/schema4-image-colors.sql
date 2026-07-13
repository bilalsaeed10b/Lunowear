-- ============================================================
-- Luno — migration 4: per-color image variants.
-- Run ONCE in Supabase SQL Editor (after schema.sql).
--
-- products.image_colors is a jsonb array PARALLEL to products.images:
--   image_colors[i] = null                      -> main photo (shown by default)
--   image_colors[i] = {"color":"Black","main":0} -> Black variant of main photo #0,
--                       shown in place of it when Black is selected in the store.
--   (legacy form: a bare string "Black" pairs by upload order within its color)
--   Example: images       = [a.jpg, b.jpg, a-black.jpg]
--            image_colors = [null,  null,  {"color":"Black","main":0}]
-- ============================================================

alter table products
  add column if not exists image_colors jsonb not null default '[]';
