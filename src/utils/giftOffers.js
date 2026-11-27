// "Buy N get M free" offers. Stored inside the existing store settings JSON
// (settings.giftOffers), so no database change is needed.
let activeGiftOffers = [];

export function getGiftOffers() {
  return activeGiftOffers;
}

export function setGiftOffers(offers) {
  activeGiftOffers = Array.isArray(offers) ? offers : [];
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Rule: the customer pays for buyQty units at the regular price and gets
// freeQty units free. The money charged for a group must stay at or above the
// approved minimum of ALL units in the group (paid + free).
export function checkGiftFloor(offer, price, minOfferPrice) {
  const buyQty = Number(offer.buyQty);
  const freeQty = Number(offer.freeQty);
  const charged = roundMoney(buyQty * Number(price));
  const minimumTotal = roundMoney((buyQty + freeQty) * Number(minOfferPrice));
  return {
    charged,
    minimumTotal,
    ok: charged >= minimumTotal,
    // highest whole free quantity that keeps the offer above the minimum
    maxFreeQty: Math.max(
      0,
      Math.floor(charged / Number(minOfferPrice)) - buyQty
    ),
    perUnit: roundMoney(charged / (buyQty + freeQty)),
  };
}

export function isGiftActive(offer, today = new Date()) {
  if (!offer || offer.status !== "active") {
    return false;
  }
  const day = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
  if (offer.startDate && day < offer.startDate) return false;
  if (offer.endDate && day > offer.endDate) return false;
  return true;
}

export function getGiftOfferForSku(sku) {
  return activeGiftOffers.find(
    (offer) => offer.sku === sku && isGiftActive(offer)
  );
}

// Returns null when no gift applies for this quantity.
export function getGiftForLine(sku, paidQuantity, price, minOfferPrice) {
  const offer = getGiftOfferForSku(sku);
  const quantity = Math.floor(Number(paidQuantity) || 0);
  if (!offer || quantity < offer.buyQty) {
    return null;
  }
  // Safety net: never give a gift that would break the minimum price.
  if (!checkGiftFloor(offer, price, minOfferPrice).ok) {
    return null;
  }
  const groups = Math.floor(quantity / offer.buyQty);
  return {
    giftQuantity: groups * offer.freeQty,
    label: `اشترِ ${offer.buyQty} واحصل على ${offer.freeQty} مجانًا`,
    offer,
  };
}

// Lets any component open the cart drawer (Header listens for this event).
export function openCartDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("berna:open-cart"));
  }
}
