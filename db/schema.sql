-- ============================================================
-- Ateliê — product record
-- Postgres / Supabase
-- ============================================================
--
-- Design notes that matter:
--
-- 1. Stock lives in its own table keyed by (product, part, size), NOT as
--    columns on products. A bikini has parts 'top' + 'bottom' with
--    independent sizes; a one-piece (maiô) has a single part 'onepiece'.
--    Same table handles both. This is what makes "top M, bottom G" work.
--
-- 2. products.print_description is not decoration — it is fed into the
--    image prompt. Describing the toucan grid explicitly is what kept the
--    motifs intact in testing. An empty print_description means worse photos.
--
-- 3. description is jsonb keyed by locale. Product NAMES stay plain
--    (they're proper nouns: "Tucano" reads fine in any language).
--
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- products ----------
create table products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  kind              text not null check (kind in ('bikini','onepiece','other')),
  -- fed verbatim into the generation prompt; be specific about motifs & colours
  print_description text not null default '',
  description       jsonb not null default '{}'::jsonb,   -- {"pt":"...","en":"...","ar":"..."}
  price_minor       integer not null,                     -- store money in minor units, never floats
  currency          char(3) not null default 'AED',
  flatlay_url       text,                                 -- the true product photo; always shown
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_active_idx on products (active) where active;

-- ---------- stock ----------
create type garment_part as enum ('top','bottom','onepiece');
create type garment_size as enum ('P','M','G');   -- PP/GG: extend the enum, don't add columns

create table stock (
  product_id  uuid not null references products(id) on delete cascade,
  part        garment_part not null,
  size        garment_size not null,
  qty         integer not null default 0 check (qty >= 0),
  updated_at  timestamptz not null default now(),
  primary key (product_id, part, size)
);

-- "in stock" is derived, never stored — one source of truth
create view stock_available as
  select product_id, part, size, qty, (qty > 0) as in_stock from stock;

-- ---------- generated images ----------
create type market_preset      as enum ('brasil','levante');
create type composition_preset as enum ('full_body','sarong','cropped','flatlay');

create table generated_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  url          text not null,
  market       market_preset not null,
  composition  composition_preset not null,
  has_logo     boolean not null default false,
  -- exact prompt + model, so a good image can be reproduced and a bad one diagnosed
  prompt       text not null,
  model        text not null,
  cost_usd     numeric(8,4),
  kept         boolean not null default false,  -- she culls; only kept images are published
  created_at   timestamptz not null default now()
);

create index generated_images_product_idx on generated_images (product_id, kept, created_at desc);

-- ---------- size finder ----------
-- Deliberately minimal. No photos, no measurements, no name, no phone.
-- Keep only what improves the recommendation, and expire it.
create table size_quiz (
  id            uuid primary key default gen_random_uuid(),
  height_cm     smallint,
  weight_kg     smallint,
  bra_band      smallint,          -- 36/38/40...
  usual_size    garment_size,      -- "what do you wear in <known brand>"
  result_top    garment_size not null,
  result_bottom garment_size not null,
  locale        text not null default 'pt',
  created_at    timestamptz not null default now()
);

-- Retention: nothing here is needed after a fortnight.
-- Schedule this (pg_cron) rather than letting it accumulate.
--   delete from size_quiz where created_at < now() - interval '14 days';

-- ---------- spend guard ----------
-- The generate endpoint checks this before every call. Without it, a stuck
-- retry loop on her phone can quietly drain the Replicate account.
create table generation_budget (
  day         date primary key default current_date,
  spent_usd   numeric(8,4) not null default 0,
  cap_usd     numeric(8,4) not null default 5.00
);
