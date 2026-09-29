import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function buildWishlistItem(product) {
  const variants =
    product.customerVariants?.length
      ? product.customerVariants
      : product.variants || [];

  return {
    id: product.id,
    groupId: product.id,

    name: product.name,
    category: product.category,

    icon: product.icon || "🍯",

    description:
      product.description ||
      `اختيارات متعددة من ${product.name}`,

    minPrice: product.minPrice,
    maxPrice: product.maxPrice,

    // مهم جدًا:
    // نحفظ كل الـ variants وليس أول Variant فقط
    variants: variants,

    customerVariants: variants,

    available: product.available ?? true,
  };
}
export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const {
    wishlist,
    toggleWishlist,
  } = useWishlist();

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

  const [selectedSku, setSelectedSku] = useState(
    variants[0]?.sku || ""
  );

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
        selectedVariant.price
      ),

      weight: selectedVariant.weight,

      weightGrams: Number(
        selectedVariant.weightGrams
      ),

      // لا نرسل packageType نهائيًا
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
        >
          <div className="product-image">
            <span>
              {product.icon || "🍯"}
            </span>
          </div>
        </Link>

      </div>

      {/* ======================================================
          PRODUCT INFORMATION
          ====================================================== */}

      <div className="product-info">

        <small className="product-category">
          {product.category}
        </small>

        <h3>
          {product.name}
        </h3>

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
                      chooseVariant(
                        variant
                      )
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
            PRICE + DETAILS
            DETAILS IS LEFT OF PRICE
            ================================================== */}

        <div className="card-price-details-row">

          <Link
            to={`/products/${product.id}`}
            className="card-details-link"
          >
            تفاصيل المنتج
          </Link>

          <div className="card-price">
            {selectedVariant
              ? `${(
                  Number(
                    selectedVariant.price
                  ) * quantity
                ).toFixed(2)} ج.م`
              : "—"}
          </div>

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