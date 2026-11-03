create table if not exists public.store_settings (
  id text primary key check (id = 'catalog'),
  settings jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;

drop policy if exists "Public can read store settings"
  on public.store_settings;
create policy "Public can read store settings"
  on public.store_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated admins can manage store settings"
  on public.store_settings;
create policy "Authenticated admins can manage store settings"
  on public.store_settings
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.store_settings (id, settings)
values (
  'catalog',
  jsonb_build_object(
    'prices', '[]'::jsonb,
    'productOffers', '[]'::jsonb,
    'bundleOffers', '[]'::jsonb
  )
)
on conflict (id) do nothing;
