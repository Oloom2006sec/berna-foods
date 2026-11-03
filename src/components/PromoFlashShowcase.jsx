import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { groupProducts } from "../utils/productGroups";
import { getPromotionPricing } from "../utils/promotionPricing";
import BundleCompositionImage from "./BundleCompositionImage";

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
            { ...variant, image: group.image },
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
  };

  function handleAddBundle(bundle) {
    try {
      addBundleToCart(bundle);
      setAddedBundleId(bundle.id);
      window.setTimeout(() => setAddedBundleId(""), 1800);
    } catch (error) {
      console.error("Add hero bundle to cart error:", error);
    }
  }

  function handleAddProduct(product, discountPercent) {
    const variant = product.customerVariants?.[0] || product.variants?.[0];
    if (!variant) {
      return;
    }

    const promotion = getPromotionPricing(
      product.name,
      variant.price,
      variant.minOfferPrice
    );

    try {
      addToCart({
        ...variant,
        name: product.name,
        image: product.image || "",
        quantity: 1,
        price:
          promotion?.price ??
          Number(variant.price) * (1 - Number(discountPercent || 0) / 100),
        originalPrice: promotion?.originalPrice ?? Number(variant.price),
        discountPercent:
          promotion?.discountPercent ?? Number(discountPercent || 0),
      });
      setAddedProductId(product.id);
      window.setTimeout(() => setAddedProductId(""), 1800);
    } catch (error) {
      console.error("Add hero product to cart error:", error);
    }
  }

  const bundle = activeOffer.type === "bundle" ? activeOffer.bundle : null;
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
            <button
              type="button"
              className="promo-flash-bundle-add"
              onClick={() => handleAddBundle(bundle)}
            >
              {addedBundleId === bundle.id
                ? "تمت الإضافة للسلة"
                : "أضف الباقة للسلة"}
            </button>
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

function ProductSlide({ product, discountPercent, added, onAdd }) {
  const variant = product.customerVariants?.[0] || product.variants?.[0];
  const promotion = variant
    ? getPromotionPricing(product.name, variant.price, variant.minOfferPrice)
    : null;
  const actualDiscountPercent = promotion?.discountPercent ?? discountPercent;

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
        <img
          className="promo-flash-product-image"
          src={product.image}
          alt={product.name}
        />
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
      <button
        type="button"
        className="promo-flash-product-add"
        onClick={onAdd}
      >
        {added ? "تمت الإضافة للسلة" : "أضف للسلة"}
      </button>
    </div>
  );
}
