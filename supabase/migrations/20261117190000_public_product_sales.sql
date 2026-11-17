create or replace function public.get_public_product_sales()
returns table (
  product_name text,
  units_sold bigint,
  order_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with order_items as (
    select
      orders.order_number,
      orders.status,
      line.item
    from public.orders as orders
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(orders.items) = 'array'
          then orders.items
        else '[]'::jsonb
      end
    ) as line(item)
    where coalesce(orders.status, '') <> 'cancelled'
  ),
  product_items as (
    select
      order_items.order_number,
      order_items.status,
      order_items.item ->> 'name' as product_name,
      case
        when order_items.item ->> 'quantity' ~ '^[0-9]+([.][0-9]+)?$'
          then (order_items.item ->> 'quantity')::numeric
        else 1
      end as quantity
    from order_items
    where jsonb_typeof(order_items.item -> 'bundleItems') is distinct from 'array'
      or jsonb_array_length(order_items.item -> 'bundleItems') = 0

    union all

    select
      order_items.order_number,
      order_items.status,
      component.item ->> 'name' as product_name,
      (
        case
          when order_items.item ->> 'quantity' ~ '^[0-9]+([.][0-9]+)?$'
            then (order_items.item ->> 'quantity')::numeric
          else 1
        end
      ) * (
        case
          when component.item ->> 'quantity' ~ '^[0-9]+([.][0-9]+)?$'
            then (component.item ->> 'quantity')::numeric
          else 1
        end
      ) as quantity
    from order_items
    cross join lateral jsonb_array_elements(
      case
        when jsonb_typeof(order_items.item -> 'bundleItems') = 'array'
          then order_items.item -> 'bundleItems'
        else '[]'::jsonb
      end
    ) as component(item)
  )
  select
    product_items.product_name,
    coalesce(
      sum(product_items.quantity) filter (
        where product_items.status = 'delivered'
      ),
      0
    )::bigint as units_sold,
    count(distinct product_items.order_number)::bigint as order_count
  from product_items
  where product_items.product_name is not null
    and product_items.product_name <> ''
  group by product_items.product_name
  order by units_sold desc, order_count desc, product_items.product_name;
$$;

revoke all on function public.get_public_product_sales() from public;
grant execute on function public.get_public_product_sales() to anon, authenticated;
