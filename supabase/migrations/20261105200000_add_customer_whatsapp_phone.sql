alter table public.orders
  add column if not exists customer_whatsapp_phone text not null default '';
