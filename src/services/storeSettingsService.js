import { supabase } from "../lib/supabase";
import { products } from "../data/products";
import { productOffers } from "../data/homePromotions";

const SETTINGS_ROW_ID = "catalog";

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function isValidDate(value) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

const defaultStoreSettings = (() => {
  const availableProducts = products.filter(
    (product) => product.available !== false
  );
  const productNames = [
    ...new Set(availableProducts.map((product) => product.name)),
  ];

  return {
    prices: availableProducts.map((product) => ({
      sku: product.sku,
      price: Number(product.price),
      minOfferPrice: Number(product.minOfferPrice),
    })),
    productOffers: productNames.map((productName) => ({
      productName,
      discountPercent:
        productOffers.find((offer) => offer.productName === productName)
          ?.discountPercent || 0,
    })),
    bundleOffers: [],
  };
})();

export function getDefaultStoreSettings() {
  return structuredClone(defaultStoreSettings);
}

function validateSettings(settings) {
  if (
    !settings ||
    !Array.isArray(settings.prices) ||
    !Array.isArray(settings.productOffers) ||
    !Array.isArray(settings.bundleOffers)
  ) {
    throw new Error("إعدادات الأسعار والعروض غير مكتملة.");
  }

  const defaultSettings = getDefaultStoreSettings();
  const defaultPrices = new Map(
    defaultSettings.prices.map((price) => [price.sku, price])
  );
  const defaultOffers = new Map(
    defaultSettings.productOffers.map((offer) => [
      offer.productName,
      offer,
    ])
  );
  const savedPrices = Array.isArray(settings?.prices) ? settings.prices : [];
  const savedOffers = Array.isArray(settings?.productOffers)
    ? settings.productOffers
    : [];
  const retiredGlassSkus = new Set(
    products
      .filter(
        (product) =>
          product.available === false && product.packageType === "زجاج"
      )
      .map((product) => product.sku)
  );
  const prices = new Map(savedPrices.map((price) => [price.sku, price]));
  const offers = new Map(savedOffers.map((offer) => [offer.productName, offer]));

  if (
    prices.size !== savedPrices.length ||
    [...prices.keys()].some(
      (sku) => !defaultPrices.has(sku) && !retiredGlassSkus.has(sku)
    ) ||
    (savedOffers.length > 0 &&
      (savedOffers.length !== defaultOffers.size ||
        offers.size !== defaultOffers.size ||
        [...offers.keys()].some((name) => !defaultOffers.has(name))))
  ) {
    throw new Error("إعدادات الأسعار أو العروض لا تطابق قائمة منتجات المتجر.");
  }

  const normalizedPrices = [...defaultPrices].map(([sku, defaults]) => {
    const price = prices.get(sku) || defaults;
    const regularPrice = Number(price.price);
    const minOfferPrice = Number(price.minOfferPrice);

    if (
      !Number.isFinite(regularPrice) ||
      !Number.isFinite(minOfferPrice) ||
      regularPrice <= 0 ||
      minOfferPrice <= 0 ||
      minOfferPrice < defaults.minOfferPrice ||
      minOfferPrice > regularPrice
    ) {
      throw new Error(`سعر غير صالح للصنف ${sku}`);
    }

    return { sku, price: regularPrice, minOfferPrice };
  });
  const normalizedOffers = [...defaultOffers].map(
    ([productName, defaults]) => {
      const offer = offers.get(productName) || defaults;
      const discountPercent = Number(offer.discountPercent);

      if (
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 90
      ) {
        throw new Error(`نسبة خصم غير صالحة للصنف ${productName}`);
      }

      return { productName, discountPercent };
    }
  );
  const priceBySku = new Map(
    normalizedPrices.map((price) => [price.sku, price])
  );
  const knownSkus = new Set(defaultSettings.prices.map((price) => price.sku));
  const bundleOffers = settings.bundleOffers
    .map((bundle) => {
      const savedItems = Array.isArray(bundle.items)
        ? bundle.items.map((item) => ({
            sku: String(item.sku || ""),
            quantity: Number(item.quantity),
          }))
        : [];
      const containsRetiredGlass = savedItems.some((item) =>
        retiredGlassSkus.has(item.sku)
      );
      const items = savedItems.filter((item) => knownSkus.has(item.sku));

      if (
        savedItems.some(
          (item) =>
            !knownSkus.has(item.sku) && !retiredGlassSkus.has(item.sku)
        )
      ) {
        throw new Error("بيانات إحدى عروض المجموعات غير مكتملة.");
      }

      if (items.length === 0 && containsRetiredGlass) {
        return null;
      }

      if (
        !bundle.id ||
        !bundle.name?.trim() ||
        items.length === 0 ||
        items.some(
          (item) =>
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99
        )
      ) {
        throw new Error("بيانات إحدى عروض المجموعات غير مكتملة.");
      }

      const regularBundlePrice = roundMoney(
        items.reduce(
          (total, item) =>
            total + priceBySku.get(item.sku).price * item.quantity,
          0
        )
      );
      const minimumBundlePrice = roundMoney(items.reduce(
        (total, item) =>
          total + priceBySku.get(item.sku).minOfferPrice * item.quantity,
        0
      ));
      const savedBundlePrice = Number(bundle.bundlePrice);
      const discountPercent =
        bundle.discountPercent == null
          ? Number.isFinite(savedBundlePrice) && regularBundlePrice > 0
            ? Math.min(
                90,
                Math.max(
                  0,
                  Math.round(
                    ((regularBundlePrice - savedBundlePrice) /
                      regularBundlePrice) *
                      100
                  )
                )
              )
            : NaN
          : Number(bundle.discountPercent);
      const bundlePrice = roundMoney(
        regularBundlePrice * (1 - discountPercent / 100)
      );
      const channel = bundle.channel || "أفراد";
      const status =
        bundle.status || (bundle.enabled ? "active" : "draft");
      const startDate = String(bundle.startDate || "");
      const endDate = String(bundle.endDate || "");

      if (
        !Number.isInteger(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 90
      ) {
        throw new Error(
          `نسبة خصم غير صالحة للمجموعة "${bundle.name}".`
        );
      }

      if (bundlePrice < minimumBundlePrice) {
        throw new Error(
          `سعر المجموعة "${bundle.name}" أقل من مجموع الحدود الدنيا المعتمدة (${minimumBundlePrice.toFixed(2)} ج.م).`
        );
      }

      if (
        !["أفراد", "جملة"].includes(channel) ||
        !["draft", "active", "paused"].includes(status) ||
        !isValidDate(startDate) ||
        !isValidDate(endDate) ||
        (startDate && endDate && endDate < startDate)
      ) {
        throw new Error(
          `بيانات حالة أو قناة البيع أو تواريخ المجموعة "${bundle.name}" غير صالحة.`
        );
      }

      if (
        !Number.isFinite(regularBundlePrice) ||
        !Number.isFinite(minimumBundlePrice)
      ) {
        throw new Error(
          `تعذر حساب سعر المجموعة "${bundle.name}".`
        );
      }

      return {
        id: String(bundle.id),
        name: bundle.name.trim(),
        description: String(bundle.description || "").trim(),
        channel,
        status,
        startDate,
        endDate,
        items,
        discountPercent,
        bundlePrice,
        enabled: Boolean(status === "active" && !containsRetiredGlass),
      };
    })
    .filter(Boolean);

  return {
    prices: normalizedPrices,
    productOffers: normalizedOffers,
    bundleOffers,
  };
}

export async function loadStoreSettings() {
  const { data, error } = await supabase
    .from("store_settings")
    .select("settings")
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return validateSettings(data.settings);
}

export async function saveStoreSettings(settings) {
  const validatedSettings = validateSettings(settings);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const { error } = await supabase.from("store_settings").upsert(
    {
      id: SETTINGS_ROW_ID,
      settings: validatedSettings,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  return validatedSettings;
}

export function validateStoreSettings(settings) {
  return validateSettings(settings);
}
