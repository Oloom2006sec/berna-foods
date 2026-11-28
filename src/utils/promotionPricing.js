import { campaign, productOffers } from "../data/homePromotions";

let activeProductOffers = productOffers;

export function getProductOffers() {
  return activeProductOffers;
}

export function setProductOffers(offers) {
  activeProductOffers = Array.isArray(offers) ? offers : productOffers;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Discount % for one size (sku). A per-size value (offer.sizeDiscounts[sku],
// even 0) wins; otherwise the product-level discountPercent applies.
export function getOfferPercent(offer, sku) {
  const sizeValue = sku ? offer?.sizeDiscounts?.[sku] : undefined;
  if (sizeValue !== undefined && sizeValue !== null && sizeValue !== "") {
    return Math.min(100, Math.max(0, Number(sizeValue) || 0));
  }
  return Math.min(100, Math.max(0, Number(offer?.discountPercent) || 0));
}

// True when the product has a discount on at least one size.
export function isOfferActive(offer) {
  return (
    Number(offer?.discountPercent) > 0 ||
    Object.values(offer?.sizeDiscounts || {}).some((value) => Number(value) > 0)
  );
}

// Highest discount % across the product's sizes (for headline badges).
export function getOfferMaxPercent(offer) {
  return Math.max(
    Number(offer?.discountPercent) || 0,
    ...Object.values(offer?.sizeDiscounts || {}).map((value) => Number(value) || 0)
  );
}

// For banners that show ONE size of a product: pick the size with the biggest
// real discount. Falls back to the first size when no size is discounted.
export function getBestPromotionVariant(product) {
  const variants = [
    ...(product?.customerVariants?.length
      ? product.customerVariants
      : product?.variants || []),
  ].sort((x, y) => Number(x.weightGrams) - Number(y.weightGrams));
  let best = null;
  for (const variant of variants) {
    const promotion = getPromotionPricing(
      product.name,
      variant.price,
      variant.minOfferPrice,
      variant.sku
    );
    // ">=": on equal discounts the larger size wins (sizes are sorted ascending).
    if (promotion && (!best || promotion.discountPercent >= best.promotion.discountPercent)) {
      best = { variant, promotion };
    }
  }
  return best || { variant: variants[variants.length - 1], promotion: null };
}

export function getPromotionPricing(
  productName,
  basePrice,
  minOfferPrice,
  sku
) {
  const originalPrice = Number(basePrice);
  const offer = activeProductOffers.find(
    (item) => item.productName === productName
  );
  const requestedDiscountPercent = getOfferPercent(offer, sku);

  if (
    !campaign.enabled ||
    !offer ||
    !Number.isFinite(originalPrice) ||
    originalPrice <= 0 ||
    requestedDiscountPercent <= 0
  ) {
    return null;
  }

  const discountedPrice = originalPrice * (1 - requestedDiscountPercent / 100);
  const minimumPrice = Number(minOfferPrice);
  const price = roundMoney(
    Number.isFinite(minimumPrice) && minimumPrice > 0
      ? Math.min(originalPrice, Math.max(minimumPrice, discountedPrice))
      : discountedPrice
  );
  const discountPercent = Math.round(
    ((originalPrice - price) / originalPrice) * 100
  );

  // The floor can cancel the discount completely: show no promotion then.
  if (price >= roundMoney(originalPrice) || discountPercent <= 0) {
    return null;
  }

  return {
    id: campaign.name,
    label: campaign.badgeLabel,
    discountPercent,
    originalPrice: roundMoney(originalPrice),
    price,
    savings: roundMoney(originalPrice - price),
  };
}
