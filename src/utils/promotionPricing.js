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

export function getPromotionPricing(productName, basePrice, minOfferPrice) {
  const originalPrice = Number(basePrice);
  const offer = activeProductOffers.find(
    (item) => item.productName === productName
  );
  const requestedDiscountPercent = Math.min(
    100,
    Math.max(0, Number(offer?.discountPercent) || 0)
  );

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

  return {
    id: campaign.name,
    label: campaign.badgeLabel,
    discountPercent,
    originalPrice: roundMoney(originalPrice),
    price,
    savings: roundMoney(originalPrice - price),
  };
}
