import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { groupProducts } from "../utils/productGroups";
import {
  getBestPromotionVariant,
  getPromotionPricing,
} from "../utils/promotionPricing";
import { getGiftOfferForSku, openCartDrawer } from "../utils/giftOffers";
import { products as catalogProducts } from "../data/products";
import BundleCompositionImage from "./BundleCompositionImage";
import CartAddedActions from "./CartAddedActions";
import ProductPopularityBadge from "./ProductPopularityBadge";

function getLocalDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 10);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PromoFlashShowcase({ offers = [], bundles = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedBundleId, setAddedBundleId] = useState("");
  const [addedProductId, setAddedProductId] = useState("");
  const { addBundleToCart, addToCart } = useCart();
  const productsBySku = useMemo(
    () =>
      new Map(
        groupProducts().flatMap((group) =>
        group.customerVariants.map((variant) => [
          variant.sku,
          {
            ...variant,
            image: group.image,
          },
        ])
        )
      ),
    []
  );
  const today = getLocalDate();
  const activeBundles = bundles
    .filter(
      (bundle) =>
        bundle.enabled &&
        (bundle.status || "active") === "active" &&
        (bundle.channel || "أفراد") === "أفراد" &&
        (!bundle.startDate || bundle.startDate <= today) &&
        (!bundle.endDate || bundle.endDate >= today) &&
        bundle.items.length > 0 &&
        bundle.items.every((item) => productsBySku.has(item.sku))
    )
    .map((bundle) => ({
      type: "bundle",
      bundle,
      products: bundle.items.map((item) => ({
        ...item,
        product: productsBySku.get(item.sku),
      })),
    }));
  const slides = [
    ...offers.map((offer) => ({ type: "product", ...offer })),
    ...activeBundles,
  ];
  const activeOffer = slides.length
    ? slides[activeIndex % slides.length]
    : null;

  useEffect(() => {
    if (isPaused || slides.length < 2) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  if (!activeOffer) {
    return null;
  }

  const showOffer = (index) => {
    setActiveIndex((index + slides.length) % slides.length);
    setAddedBundleId("");
    setAddedProductId("");
    setIsPaused(false);
  };

  function handleAddBundle(bundle) {
    try {
      addBundleToCart(bundle);
      setAddedBundleId(bundle.id);
      setIsPaused(true);
      openCartDrawer();
    } catch (error) {
      console.error("Add hero bundle to cart error:", error);
    }
  }

  function handleAddProduct(product, discountPercent) {
    const { variant } = getBestPromotionVariant(product);
    if (!variant) {
      return;
    }

    const promotion = getPromotionPricing(
      product.name,
      variant.price,
      variant.minOfferPrice,
      variant.sku
    );

    try {
      addToCart({
        ...variant,
        name: product.name,
        image: product.image || "",
        quantity: 1,
        price: promotion?.price ?? Number(variant.price),
        originalPrice: promotion?.originalPrice ?? Number(variant.price),
        discountPercent: promotion?.discountPercent ?? 0,
      });
      setAddedProductId(product.id);
      setIsPaused(true);
    } catch (error) {
      console.error("Add hero product to cart error:", error);
    }
  }

  // Gift badge click on a product slide: add the gift variant (buy qty) + open cart.
  function handleGiftProduct(product, giftVariant, giftOffer) {
    try {
      addToCart({
        ...giftVariant,
        name: product.name,
        image: product.image || "",
        quantity: Math.max(1, Number(giftOffer.buyQty) || 1),
        sku: giftVariant.sku,
        price: Number(giftVariant.price),
        originalPrice: Number(giftVariant.price),
        promotionId: "",
        promotionLabel: "",
        discountPercent: 0,
        weight: giftVariant.weight,
        weightGrams: Number(giftVariant.weightGrams),
      });
      openCartDrawer();
    } catch (error) {
      console.error("Add hero gift product to cart error:", error);
    }
  }

  const bundle = activeOffer.type === "bundle" ? activeOffer.bundle : null;
  const bundleGiftProduct =
    bundle && bundle.giftSku
      ? catalogProducts.find((item) => item.sku === bundle.giftSku)
      : null;
  const bundleProducts = bundle ? activeOffer.products : [];
  const regularBundleTotal = bundle
    ? bundleProducts.reduce(
        (total, item) =>
          total + Number(item.product.price) * Number(item.quantity),
        0
      )
    : 0;

  return (
    <div
      className="promo-flash-showcase"
      role="region"
      aria-label="عروض فلاش سيل بيرنا"
      aria-roledescription="عارض عروض"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) {
          setIsPaused(false);
        }
      }}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          !event.currentTarget.matches(":hover")
        ) {
          setIsPaused(false);
        }
      }}
    >
      <div className="promo-flash-heading">
        <span className="promo-flash-bolt" aria-hidden="true">⚡</span>
        <span>
          <strong>فلاش سيل بيرنا</strong>
          <small>عروض المنتجات والباقات</small>
        </span>
      </div>

      <div className="promo-flash-stage">
        {activeOffer.type === "product" ? (
          <ProductSlide
            {...activeOffer}
            added={addedProductId === activeOffer.product.id}
            onAdd={() =>
              handleAddProduct(
                activeOffer.product,
                activeOffer.discountPercent
              )
            }
            onGift={handleGiftProduct}
            onContinue={() => {
              setAddedProductId("");
              setIsPaused(false);
            }}
          />
        ) : (
          <div className="promo-flash-bundle">
            <Link
              className="promo-flash-bundle-link"
              to="#bundle-offers"
              aria-label={`عرض ${bundle.name} بخصم ${bundle.discountPercent}%`}
            >
              <span className="promo-flash-discount">
                وفر {Number(bundle.discountPercent) || 0}%
              </span>
              <div className="promo-flash-bundle-visual">
                <BundleCompositionImage
                  className="promo-flash-bundle-images"
                  products={bundleProducts.map(({ product, sku }) => ({
                    sku,
                    image: product.image,
                  }))}
                  alt={`منتجات ${bundle.name}: ${bundleProducts
                    .map(({ product }) => product.name)
                    .join("، ")}`}
                />
                <ProductPopularityBadge
                  productId={`bundle:${bundle.id}`}
                  kind="bundle"
                  label="تم طلب هذه الباقة"
                  compact
                  className="product-popularity-overlay"
                />
              </div>
              <span className="promo-flash-product-info">
                <strong>{bundle.name}</strong>
                <del>{formatMoney(regularBundleTotal)} ج.م</del>
                <b>{formatMoney(bundle.bundlePrice)} ج.م</b>
                <small>
                  {bundleProducts
                    .map(
                      ({ product, quantity }) =>
                        `${product.name} ${product.weight} × ${quantity}`
                    )
                    .join(" · ")}
                </small>
              </span>
            </Link>
            {bundleGiftProduct && (
              <button
                type="button"
                className="bundle-offer-gift-badge promo-flash-gift-badge"
                onClick={() => handleAddBundle(bundle)}
              >
                🎁 هدية مجانًا: {bundleGiftProduct.name} {bundleGiftProduct.weight}
                {Number(bundle.giftQuantity) > 1
                  ? ` × ${bundle.giftQuantity}`
                  : ""}
              </button>
            )}
            {addedBundleId === bundle.id ? (
              <CartAddedActions
                className="cart-added-actions-promo-bundle"
                onContinue={() => {
                  setAddedBundleId("");
                  setIsPaused(false);
                }}
              />
            ) : (
              <button
                type="button"
                className="promo-flash-bundle-add"
                onClick={() => handleAddBundle(bundle)}
              >
                أضف الباقة للسلة
              </button>
            )}
          </div>
        )}

        <button
          className="promo-flash-nav promo-flash-previous"
          type="button"
          aria-label="العرض السابق"
          onClick={() => showOffer(activeIndex - 1)}
        >
          ‹
        </button>
        <button
          className="promo-flash-nav promo-flash-next"
          type="button"
          aria-label="العرض التالي"
          onClick={() => showOffer(activeIndex + 1)}
        >
          ›
        </button>
      </div>

      <div className="promo-flash-pagination" role="group" aria-label="اختيار العرض">
        {slides.map((slide, index) => {
          const label =
            slide.type === "bundle" ? slide.bundle.name : slide.product.name;
          return (
            <button
              key={`${slide.type}-${label}`}
              type="button"
              aria-label={`عرض ${label}`}
              aria-pressed={activeIndex % slides.length === index}
              className={activeIndex % slides.length === index ? "selected" : ""}
              onClick={() => showOffer(index)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProductSlide({
  product,
  discountPercent,
  added,
  onAdd,
  onGift,
  onContinue,
}) {
  const { promotion } = getBestPromotionVariant(product);
  const actualDiscountPercent = promotion?.discountPercent ?? discountPercent;
  const allVariants = product.customerVariants?.length
    ? product.customerVariants
    : product.variants || [];
  const giftVariant = allVariants.find((item) => getGiftOfferForSku(item.sku));
  const giftOffer = giftVariant ? getGiftOfferForSku(giftVariant.sku) : null;

  return (
    <div className="promo-flash-product-wrap">
      <Link
        className="promo-flash-product"
        key={product.id}
        to={`/products/${product.id}`}
        aria-label={`عرض ${product.name} بخصم ${actualDiscountPercent}%`}
      >
        <span className="promo-flash-discount">
          ⚡ خصم {actualDiscountPercent}%
        </span>
        <span className="promo-flash-product-visual">
          <img
            className="promo-flash-product-image"
            src={product.image}
            alt={product.name}
          />
          <ProductPopularityBadge
            productId={product.id}
            category={product.category}
            productName={product.name}
            compact
            className="product-popularity-overlay"
          />
        </span>
        <span className="promo-flash-product-info">
          <strong>{product.name}</strong>
          {promotion && (
            <>
              <del>{promotion.originalPrice.toFixed(2)} ج.م</del>
              <b>{promotion.price.toFixed(2)} ج.م</b>
            </>
          )}
        </span>
      </Link>
      {giftOffer && (
        <button
          type="button"
          className="product-details-gift-badge promo-flash-gift-badge"
          onClick={() => onGift(product, giftVariant, giftOffer)}
        >
          🎁 اشترِ {giftOffer.buyQty} واحصل على {giftOffer.freeQty} مجانًا
          {giftVariant.weight ? ` (عبوة ${giftVariant.weight})` : ""}
        </button>
      )}
      {added ? (
        <CartAddedActions
          className="cart-added-actions-promo"
          onContinue={onContinue}
        />
      ) : (
        <button
          type="button"
          className="promo-flash-product-add"
          onClick={onAdd}
        >
          أضف للسلة
        </button>
      )}
    </div>
  );
}
