do $$
begin
  if exists (
    select 1
    from public.orders
    where order_number is null
      or btrim(order_number) = ''
  ) then
    raise exception
      'Cannot enforce unique order numbers: orders contain a null or blank order_number.';
  end if;

  if exists (
    select order_number
    from public.orders
    group by order_number
    having count(*) > 1
  ) then
    raise exception
      'Cannot enforce unique order numbers: duplicate order_number values exist. Resolve the duplicates without deleting orders, then rerun this migration.';
  end if;
end
$$;

alter table public.orders
  alter column order_number set not null;

create unique index if not exists orders_order_number_uidx
  on public.orders (order_number);
