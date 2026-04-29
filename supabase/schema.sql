-- =============================================
-- مقبض ستوديو — Supabase Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Products ───────────────────────────────
create table public.products (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null default '',
  material      text not null default '',
  style         text not null default '',
  finish        text not null default '',
  gemini_analysis jsonb,
  original_image_path text,
  status        text not null default 'analyzing'
                check (status in ('analyzing','generating','complete','error')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Product Images ──────────────────────────
create table public.product_images (
  id            uuid default gen_random_uuid() primary key,
  product_id    uuid references public.products(id) on delete cascade,
  type          text not null
                check (type in ('white_bg','lifestyle','ad_campaign','catalog')),
  platform      text,
  environment   text,
  storage_path  text not null,
  dimensions    text not null default '',
  file_size_kb  integer default 0,
  quality_score integer default 0 check (quality_score between 0 and 10),
  quality_issues jsonb default '[]',
  created_at    timestamptz default now()
);

-- ─── Product Content ─────────────────────────
create table public.product_content (
  id            uuid default gen_random_uuid() primary key,
  product_id    uuid references public.products(id) on delete cascade,
  language      text not null check (language in ('ar','en')),
  content_type  text not null,
  content       text not null default '',
  char_count    integer generated always as (length(content)) stored,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (product_id, language, content_type)
);

-- ─── Storage bucket ──────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict do nothing;

-- ─── RLS Policies ────────────────────────────
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_content  enable row level security;

-- Products: users manage own data
create policy "users_own_products"
  on public.products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Product images: via product ownership
create policy "users_own_product_images"
  on public.product_images for all
  using (
    product_id in (
      select id from public.products where user_id = auth.uid()
    )
  );

-- Product content: via product ownership
create policy "users_own_product_content"
  on public.product_content for all
  using (
    product_id in (
      select id from public.products where user_id = auth.uid()
    )
  );

-- Storage: public read, authenticated write
create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "auth_write_product_images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ─── Indexes ─────────────────────────────────
create index on public.products (user_id, created_at desc);
create index on public.product_images (product_id, type);
create index on public.product_content (product_id, language, content_type);

-- ─── Updated_at trigger ──────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function update_updated_at();

create trigger content_updated_at
  before update on public.product_content
  for each row execute function update_updated_at();
