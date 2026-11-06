import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getPromotionPricing } from "../utils/promotionPricing";
import { products } from "../data/products";
import { groupProducts } from "../utils/productGroups";
import { useStoreSettings } from "./StoreSettingsContext";
import { trackCartAddition } from "../utils/metaPixel";

const CartContext = createContext(null);

const STORAGE_KEY = "berna-cart";
const productGroupByName = new Map(
  groupProducts().map((group) => [group.name, group])
);

function catalogItemIsAvailable(item) {
  const sku = item.sku || item.id;
  const catalogVariant = products.find(
    (product) => product.sku === sku || product.id === sku
  );
  return catalogVariant?.available !== false;
}

function migrateLegacyBundleLines(items) {
  const regularItems = [];
  const legacyBundles = new Map();

  for (const item of items) {
    if (!item.bundleOfferId || item.bundleItems) {
      regularItems.push(item);
      continue;
    }

    const sku = item.sku || item.id;
    const product = products.find(
      (candidate) =>
        (candidate.sku === sku || candidate.id === sku) &&
        candidate.available !== false
    );
    if (!product) {
      continue;
    }

    const bundle =
      legacyBundles.get(item.bundleOfferId) || {
        id: `bundle:${item.bundleOfferId}`,
        cartLineId: `bundle:${item.bundleOfferId}`,
        bundleOfferId: item.bundleOfferId,
        bundleName: item.bundleName || item.name,
        name: item.bundleName || item.name,
        quantity: 1,
        price: 0,
        originalPrice: 0,
        discountPercent: Number(item.discountPercent) || 0,
        weightGrams: 0,
        image:
          productGroupByName.get(product.name)?.image ||
          product.image ||
          "",
        bundleItems: [],
      };
    const itemQuantity = Math.max(1, Number(item.quantity) || 1);
    bundle.price += Number(item.price || 0) * itemQuantity;
    bundle.originalPrice +=
      Number(item.originalPrice || item.price || 0) * itemQuantity;
    bundle.weightGrams +=
      Number(product.weightGrams || 0) * itemQuantity;
    bundle.bundleItems.push({
      sku: product.sku,
      name: product.name,
      weight: product.weight,
      quantity: itemQuantity,
      image:
        productGroupByName.get(product.name)?.image ||
        product.image ||
        "",
    });
    legacyBundles.set(item.bundleOfferId, bundle);
  }

  return [...regularItems, ...legacyBundles.values()];
}

function readCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? migrateLegacyBundleLines(
          parsed
            .filter((item) => item && typeof item === "object")
            .filter(
              (item) =>
                item.bundleItems ||
                item.bundleOfferId ||
                catalogItemIsAvailable(item)
            )
        ).map(normalizeItem)
      : [];
  } catch {
    return [];
  }
}

function normalizeItem(item) {
  const isBundleItem = Boolean(item.bundleOfferId);
  const storedPrice = Number(item.price) || 0;
  const productGroup = productGroupByName.get(item.name);
  const catalogVariant = products.find(
    (product) =>
      (item.sku && product.sku === item.sku) ||
      (item.id && product.id === item.id)
  );
  const currentVariant =
    catalogVariant?.available === false ? null : catalogVariant;
  const originalPrice = isBundleItem
    ? Number(item.originalPrice) || storedPrice
    : Number(currentVariant?.price) ||
      Number(item.originalPrice) ||
      storedPrice;
  const minOfferPrice =
    Number(currentVariant?.minOfferPrice) ||
    Number(item.minOfferPrice) ||
    undefined;
  const promotion = getPromotionPricing(
    item.name,
    originalPrice,
    minOfferPrice
  );

  return {
    ...item,

    quantity: Math.max(
      1,
      Number(item.quantity) || 1
    ),

    price: isBundleItem
      ? storedPrice
      : promotion?.price ?? originalPrice,
    originalPrice: promotion?.originalPrice ?? originalPrice,
    discountPercent:
      isBundleItem
        ? Number(item.discountPercent) || 0
        : promotion?.discountPercent ?? (Number(item.discountPercent) || 0),
    promotionId: isBundleItem
      ? item.bundleOfferId
      : promotion?.id || item.promotionId || "",
    promotionLabel: isBundleItem
      ? `عرض مجموعة: ${item.bundleName}`
      : promotion?.label || item.promotionLabel || "",
    minOfferPrice,

    weightGrams:
      Number(item.weightGrams) || 0,

    /*
      Keep the exact SKU and package information.
    */
    sku: isBundleItem ? "" : item.sku || item.id || "",

    packageType:
      item.packageType || "",

    weight: isBundleItem
      ? item.weight || `مجموعة من ${item.bundleItems?.length || 0} أصناف`
      : currentVariant?.weight || item.weight || "",
    image: isBundleItem
      ? item.image ||
        productGroupByName.get(item.bundleItems?.[0]?.name)?.image ||
        ""
      : productGroup?.image || currentVariant?.image || item.image || "",
    bundleItems: isBundleItem
      ? (item.bundleItems || []).map((component) => ({
          ...component,
          image:
            productGroupByName.get(component.name)?.image ||
            component.image ||
            "",
        }))
      : item.bundleItems,
  };
}

export function CartProvider({ children }) {
  const { settings } = useStoreSettings();
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    setCart((current) => current.map(normalizeItem));
  }, [settings]);

  /*
    Save cart
  */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  /*
    Add product / exact Variant
  */
  function addToCart(product) {
    const item = normalizeItem(product);

    /*
      SKU is the unique identifier of the Variant.

      Example:

      عسل الموالح 500 جم بلاستيك
      SKU A

      عسل الموالح 500 جم زجاج
      SKU B

      They must remain separate.
    */
    const key = item.cartLineId || item.sku || item.id;

    setCart((current) => {
      const existing = current.find(
        (entry) =>
          (entry.cartLineId || entry.sku || entry.id) === key
      );

      if (existing) {
        return current.map((entry) =>
          (entry.cartLineId || entry.sku || entry.id) === key
            ? {
                ...entry,
                ...item,
                quantity:
                  Number(entry.quantity || 0) +
                  Number(item.quantity || 1),
              }
            : entry
        );
      }

      return [...current, item];
    });

    trackCartAddition(item);
    return item;
  }

  function addBundleToCart(bundle) {
    const bundleProducts = bundle.items.map((bundleItem) => {
      const product = products.find(
        (candidate) =>
          candidate.sku === bundleItem.sku &&
          candidate.available !== false
      );
      if (!product) {
        throw new Error(`تعذر العثور على صنف في العرض "${bundle.name}".`);
      }

      return {
        product,
        quantity: Number(bundleItem.quantity),
      };
    });
    const regularTotal = bundleProducts.reduce(
      (total, item) => total + Number(item.product.price) * item.quantity,
      0
    );
    if (!Number.isFinite(regularTotal) || regularTotal <= 0) {
      throw new Error(`تعذر حساب سعر العرض "${bundle.name}".`);
    }

    const bundlePrice = Number(bundle.bundlePrice);
    if (!Number.isFinite(bundlePrice) || bundlePrice <= 0) {
      throw new Error(`سعر العرض "${bundle.name}" غير صالح.`);
    }
    const representative = bundleProducts[0].product;
    const bundleItem = normalizeItem({
      id: `bundle:${bundle.id}`,
      cartLineId: `bundle:${bundle.id}`,
      bundleOfferId: bundle.id,
      bundleName: bundle.name,
      name: bundle.name,
      description: bundle.description || "",
      image:
        productGroupByName.get(representative.name)?.image ||
        representative.image ||
        "",
      icon: representative.icon || "🍯",
      quantity: 1,
      price: bundlePrice,
      originalPrice: regularTotal,
      discountPercent: Number(bundle.discountPercent) || 0,
      promotionLabel: `عرض مجموعة: ${bundle.name}`,
      weight: `مجموعة من ${bundleProducts.length} أصناف`,
      weightGrams: bundleProducts.reduce(
        (total, item) =>
          total + Number(item.product.weightGrams || 0) * item.quantity,
        0
      ),
      bundleItems: bundleProducts.map(({ product, quantity }) => ({
        sku: product.sku,
        name: product.name,
        weight: product.weight,
        image:
          productGroupByName.get(product.name)?.image ||
          product.image ||
          "",
        quantity,
      })),
    });
    setCart((current) => {
      const existing = current.find(
        (item) => item.cartLineId === bundleItem.cartLineId
      );
      if (!existing) {
        return [...current, bundleItem];
      }

      return current.map((item) =>
        item.cartLineId === bundleItem.cartLineId
          ? { ...item, quantity: Number(item.quantity) + 1 }
          : item
      );
    });

    trackCartAddition(bundleItem);
    return bundleItem;
  }

  /*
    Increase quantity
  */
  function increaseQuantity(key) {
    setCart((current) =>
      current.map((item) =>
        item.cartLineId === key || item.id === key || item.sku === key
          ? {
              ...item,
              quantity:
                Number(item.quantity || 0) + 1,
            }
          : item
      )
    );
  }

  /*
    Decrease quantity
  */
  function decreaseQuantity(key) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartLineId === key || item.id === key || item.sku === key
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(item.quantity || 0) > 0
        )
    );
  }

  /*
    Remove item completely
  */
  function removeFromCart(key) {
    setCart((current) =>
      current.filter(
        (item) =>
          item.cartLineId !== key &&
          item.id !== key &&
          item.sku !== key
      )
    );
  }

  /*
    Clear cart
  */
  function clearCart() {
    setCart([]);
  }

  /*
    Total price
  */
  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  /*
    Total number of pieces
    Example:
      2 products × quantities 1 + 3
      = cartCount 4
  */
  const cartCount = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const value = {
    cart,

    cartTotal,

    cartCount,

    addToCart,

    addBundleToCart,

    increaseQuantity,

    decreaseQuantity,

    removeFromCart,

    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}