import { supabase } from "../lib/supabase";

export async function getPublicProductSales() {
  const { data, error } = await supabase.rpc(
    "get_public_product_sales"
  );

  if (error) {
    throw new Error(
      error.message || "تعذر تحميل ترتيب المنتجات."
    );
  }

  return Array.isArray(data) ? data : [];
}
