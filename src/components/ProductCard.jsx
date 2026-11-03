import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { getProductDetails } from "../data/productDetails";
import { getPromotionPricing } from "../utils/promotionPricing";
import { useStoreSettings } from "../context/StoreSettingsContext";

function buildWishlistItem(product) {
  const variants =
    product.customerVariants?.length
      ? product.customerVariants
      : product.variants || [];

  const firstVariant = variants[0] || {};

  return {
    id: product.id,
    groupId: product.id,
    name: product.name,
    category: product.category,
    icon: product.icon || "🍯",
    image: product.image || "",

    description:
      product.description ||
      `اختيارات متعددة من ${product.name}`,

    minPrice: product.minPrice,
    maxPrice: product.maxPrice,

    price: firstVariant.price,
    weight: firstVariant.weight,
    weightGrams: firstVariant.weightGrams,

    sku: firstVariant.sku,
    available: firstVariant.available ?? true,
  };
}

export default function ProductCard({ product }) {
  useStoreSettings();
  const { addToCart } = useCart();

  const { wishlist, toggleWishlist } =
    useWishlist();

  /*
    ============================================================
    CUSTOMER VARIANTS
    ============================================================
  */

  const variants = useMemo(() => {
    if (product?.customerVariants?.length) {
      return [...product.customerVariants].sort(
        (a, b) =>
          Number(a.weightGrams) -
          Number(b.weightGrams)
      );
    }

    return Array.isArray(product?.variants)
      ? [...product.variants].sort(
          (a, b) =>
            Number(a.weightGrams) -
            Number(b.weightGrams)
        )
      : [];
  }, [product]);

  /*
    ============================================================
    SELECTED VARIANT
    ============================================================
  */

  const [selectedSku, setSelectedSku] =
    useState(variants[0]?.sku || "");

  /*
    ============================================================
    QUANTITY
    ============================================================
  */

  const [quantity, setQuantity] = useState(1);

  /*
    ============================================================
    ADDED STATE
    ============================================================
  */

  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  /*
    ============================================================
    CURRENT VARIANT
    ============================================================
  */

  const selectedVariant =
    variants.find(
      (variant) =>
        variant.sku === selectedSku
    ) || variants[0];
  const promotion = selectedVariant
    ? getPromotionPricing(
        product.name,
        selectedVariant.price,
        selectedVariant.minOfferPrice
      )
    : null;
  const reviews = getProductDetails(product.name)?.reviews || [];
  const averageRating = reviews.length
    ? (
        reviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / reviews.length
      ).toFixed(1)
    : null;

  /*
    ============================================================
    WISHLIST
    ============================================================
  */

  const favorite = useMemo(() => {
    return wishlist.some(
      (item) =>
        item?.groupId === product.id ||
        item?.id === product.id ||
        item?.name === product.name
    );
  }, [
    wishlist,
    product.id,
    product.name,
  ]);

  /*
    ============================================================
    WISHLIST HANDLER
    ============================================================
  */

  function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();

    const wishlistItem =
      buildWishlistItem(product);

    toggleWishlist(wishlistItem);

    window.dispatchEvent(
      new Event("wishlist-updated")
    );
  }

  /*
    ============================================================
    CHOOSE WEIGHT
    ============================================================
  */

  function chooseVariant(variant) {
    setSelectedSku(variant.sku);
    setQuantity(1);
    setAdded(false);
  }

  /*
    ============================================================
    QUANTITY
    ============================================================
  */

  function decreaseQuantity() {
    setQuantity((value) =>
      Math.max(1, value - 1)
    );

    setAdded(false);
  }

  function increaseQuantity() {
    setQuantity((value) => value + 1);
    setAdded(false);
  }

  /*
    ============================================================
    ADD TO CART
    ============================================================
  */

  function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedVariant) {
      return;
    }

    addToCart({
  ...selectedVariant,

  quantity,

  sku: selectedVariant.sku,

  price: Number(
    promotion?.price ?? selectedVariant.price
  ),
  originalPrice: promotion?.originalPrice ?? Number(selectedVariant.price),
  promotionId: promotion?.id || "",
  promotionLabel: promotion?.label || "",
  discountPercent: promotion?.discountPercent || 0,

  weight: selectedVariant.weight,

  weightGrams: Number(
    selectedVariant.weightGrams
  ),

  // IMPORTANT:
  // Keep the real product image in the cart
  image: product.image || "",

  // Keep fallback icon as well
  icon: product.icon || "🍯",
});
    setAdded(true);
  }

  return (
    <article className="product-card">

      {/* ======================================================
          PRODUCT IMAGE
          ====================================================== */}

      <div className="product-image-wrapper">

        <button
          type="button"
          className={`favorite-button ${
            favorite
              ? "favorite-button-active"
              : ""
          }`}
          onClick={handleWishlist}
          aria-pressed={favorite}
          aria-label={
            favorite
              ? `إزالة ${product.name} من المفضلة`
              : `إضافة ${product.name} للمفضلة`
          }
        >
          {favorite ? "♥" : "♡"}
        </button>

        <Link
          to={`/products/${product.id}`}
          className="product-title-link"
          aria-label={`عرض تفاصيل ${product.name}`}
        >
          <div className="product-image">
            {product.image && !imageFailed ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                onError={() => setImageFailed(true)}
                style={{
                  width: "82%",
                  height: "82%",
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                  margin: "auto",
                  mixBlendMode: "multiply",
                }}
              />
            ) : (
              <span className="product-image-fallback" role="img" aria-label={product.name}>
                {product.icon || "🍯"}
              </span>
            )}
          </div>
        </Link>
      {promotion && (
        <span className="product-card-promo-tag">
          خصم {promotion.discountPercent}%
        </span>
      )}
      </div>

      {/* ======================================================
          PRODUCT INFORMATION
          ====================================================== */}

      <div className="product-info">

        <small>
          {product.category}
        </small>

        <h3>
          {product.name}
        </h3>

        {averageRating && (
          <div className="product-card-rating">
            <span aria-hidden="true">★★★★★</span>
            <strong>{averageRating}</strong>
            <small>({reviews.length} آراء)</small>
          </div>
        )}

        <p className="product-description">
          {product.description ||
            `اختيارات متعددة من ${product.name}`}
        </p>

        {/* ==================================================
            WEIGHT
            ================================================== */}

        {variants.length > 0 && (
          <div className="card-variant-selector">

            <strong>
              الوزن
            </strong>

            <div className="card-weight-options">

              {variants.map((variant) => {
                const isSelected =
                  selectedVariant?.sku ===
                  variant.sku;

                return (
                  <button
                    key={variant.sku}
                    type="button"
                    className={
                      isSelected
                        ? "card-weight-option selected"
                        : "card-weight-option"
                    }
                    onClick={() =>
                      chooseVariant(variant)
                    }
                  >
                    {variant.weight}
                  </button>
                );
              })}

            </div>
          </div>
        )}

        {/* ==================================================
            PRICE + PRODUCT DETAILS
            ================================================== */}

        <div className="card-price-details-row">

          {/* PRICE */}

          <div className={`card-price${promotion ? " card-price-promo" : ""}`}>
            {selectedVariant ? (
              promotion ? (
                <>
                  <del>
                    {(promotion.originalPrice * quantity).toFixed(2)} ج.م
                  </del>
                  <strong>
                    {(promotion.price * quantity).toFixed(2)} ج.م
                  </strong>
                  <span className="product-promo-badge">
                    -{promotion.discountPercent}%
                  </span>
                </>
              ) : (
                `${(Number(selectedVariant.price) * quantity).toFixed(2)} ج.م`
              )
            ) : "—"}
          </div>

          {/* PRODUCT DETAILS */}

          <Link
            to={`/products/${product.id}`}
            className="card-details-link"
          >
            تفاصيل المنتج
            <span className="card-details-arrow">
              ←
            </span>
          </Link>

        </div>

        {/* ==================================================
            QUANTITY
            ================================================== */}

        <div className="card-quantity-row">

          <strong>
            الكمية
          </strong>

          <div className="card-quantity-controls">

            <button
              type="button"
              onClick={decreaseQuantity}
              aria-label="تقليل الكمية"
            >
              −
            </button>

            <span>
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              aria-label="زيادة الكمية"
            >
              +
            </button>

          </div>

        </div>

        {/* ==================================================
            ADD TO CART
            ================================================== */}

        <button
          type="button"
          className={`card-add-to-cart ${
            added
              ? "card-add-to-cart-added"
              : ""
          }`}
          onClick={handleAddToCart}
          disabled={!selectedVariant}
        >
          {added
            ? "✓ تمت الإضافة للسلة"
            : "أضف للسلة"}
        </button>

      </div>
    </article>
  );
}