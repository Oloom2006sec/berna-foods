import { useEffect, useState } from "react";
import {
  getProductPopularity,
  subscribeToProductPopularity,
} from "../utils/productPopularity";

const orderCountFormatter = new Intl.NumberFormat("ar-EG");

export default function ProductPopularityBadge({
  productId,
  category = "",
  productName = "",
  label = "تم طلبه",
  compact = false,
  kind = "product",
  className = "",
}) {
  const [orderCount, setOrderCount] = useState(() =>
    getProductPopularity(productId, { category, productName, kind })
  );

  useEffect(() => {
    const popularityOptions = { category, productName, kind };
    const unsubscribe = subscribeToProductPopularity(
      productId,
      popularityOptions,
      (count) =>
        setOrderCount((currentCount) => Math.max(currentCount, count))
    );
    const handleStorageUpdate = (event) => {
      if (event.key === "berna-customer-product-popularity-v2") {
        const latestCount = getProductPopularity(productId, popularityOptions);
        setOrderCount((currentCount) => Math.max(currentCount, latestCount));
      }
    };

    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [productId, category, productName, kind]);

  return (
    <span
      className={`product-order-count${compact ? " product-order-count-compact" : ""}${className ? ` ${className}` : ""}`}
    >
      <span aria-hidden="true">🔥</span>
      <span>
        {label} {orderCountFormatter.format(orderCount)} مرة
      </span>
    </span>
  );
}
