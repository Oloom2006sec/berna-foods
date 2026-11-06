const PURCHASE_STORAGE_PREFIX = "berna-meta-purchase:";
const trackedPurchases = new Set();

export function trackMetaEvent(eventName, parameters) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  try {
    if (parameters === undefined) {
      window.fbq("track", eventName);
    } else {
      window.fbq("track", eventName, parameters);
    }
    return true;
  } catch (error) {
    console.error(`Meta Pixel ${eventName} tracking error:`, error);
    return false;
  }
}

function purchaseWasTracked(orderNumber) {
  if (trackedPurchases.has(orderNumber)) {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(
      `${PURCHASE_STORAGE_PREFIX}${encodeURIComponent(orderNumber)}`
    );
    if (stored === "1") {
      trackedPurchases.add(orderNumber);
      return true;
    }
  } catch (error) {
    console.warn("Read Meta Pixel purchase history error:", error);
  }

  return false;
}

export function trackPurchase(order) {
  const orderNumber = String(order?.orderNumber || "");
  const value = Number(order?.total);
  const contents = (Array.isArray(order?.items) ? order.items : [])
    .map((item) => {
      const id = item?.bundleOfferId || item?.sku || item?.id;
      const quantity = Number(item?.quantity);
      const itemPrice = Number(item?.price);

      if (
        !id ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(itemPrice) ||
        itemPrice < 0
      ) {
        return null;
      }

      return {
        id: String(id),
        quantity,
        item_price: itemPrice,
      };
    })
    .filter(Boolean);

  if (
    !orderNumber ||
    !Number.isFinite(value) ||
    value < 0 ||
    contents.length === 0 ||
    typeof window === "undefined" ||
    typeof window.fbq !== "function"
  ) {
    return false;
  }

  if (purchaseWasTracked(orderNumber)) {
    return false;
  }

  const tracked = trackMetaEvent("Purchase", {
    value,
    currency: "EGP",
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: "product",
    order_id: orderNumber,
  });

  if (!tracked) {
    return false;
  }

  trackedPurchases.add(orderNumber);
  try {
    window.localStorage.setItem(
      `${PURCHASE_STORAGE_PREFIX}${encodeURIComponent(orderNumber)}`,
      "1"
    );
  } catch (error) {
    console.warn("Save Meta Pixel purchase history error:", error);
  }

  return true;
}

export function trackCartAddition(item) {
  const id = item?.bundleOfferId || item?.sku || item?.id;
  const name = item?.name;
  const quantity = Number(item?.quantity);
  const itemPrice = Number(item?.price);

  if (
    !id ||
    !name ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(itemPrice) ||
    itemPrice < 0
  ) {
    return false;
  }

  return trackMetaEvent("AddToCart", {
    content_ids: [String(id)],
    content_name: name,
    content_type: "product",
    value: itemPrice * quantity,
    currency: "EGP",
    contents: [
      {
        id: String(id),
        quantity,
        item_price: itemPrice,
      },
    ],
  });
}
