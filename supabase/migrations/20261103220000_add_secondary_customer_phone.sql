alter table public.orders
  add column if not exists customer_phone_secondary text not null default '';
