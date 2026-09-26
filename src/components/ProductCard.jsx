import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "../variant-styles.css";

import { useWishlist } from "../context/WishlistContext";

function buildWishlistItem(product) {
  const firstVariant = product.variants?.[0] || {};

  return {
    id: product.id,
    groupId: product.id,
    name: product.name,
    category: product.category,
    icon: product.icon || "🍯",
    description:
      product.description || `اختيارات متعددة من ${product.name}`,
    minPrice: product.minPrice,
    maxPrice: product.maxPrice,
    price: firstVariant.price,
    weight: firstVariant.weight,
    weightGrams: firstVariant.weightGrams,
    packageType: firstVariant.packageType,
    sku: firstVariant.sku,
    available: firstVariant.available ?? true,
  };
}

export default function ProductCard({ product }) {
  const variants = Array.isArray(product?.variants)
    ? product.variants
    : [];

  const firstVariant = variants[0];
  const sameProductVariants = variants.length;

  const {
    wishlist,
    isFavorite,
    toggleWishlist,
  } = useWishlist();

  /*
    نخلي الـ WishlistContext هو المصدر الأساسي.
    لكن نستخدم groupId / id / name للتوافق مع
    البيانات القديمة الموجودة في localStorage.
  */
  const favorite = useMemo(() => {
    return wishlist.some(
      (item) =>
        item?.groupId === product.id ||
        item?.id === product.id ||
        item?.name === product.name
    );
  }, [wishlist, product.id, product.name]);

  /*
    هذا الـ useEffect مهم لو كان عندك بيانات Wishlist
    قديمة في localStorage ولم تكن متزامنة مع الـ Context.
  */
  useEffect(() => {
    const saved = localStorage.getItem("berna-wishlist");

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return;

      /*
        لو الـ Context بالفعل متزامن، لا نعمل أي شيء.
        الـ Context هو المسؤول عن التحديث الطبيعي.
      */
    } catch {
      // تجاهل أي بيانات Wishlist تالفة
    }
  }, []);

  function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();

    const wishlistItem = buildWishlistItem(product);

    /*
      نستخدم Context بدل localStorage مباشرة.
      كده Header يتحدث فوراً لأن wishlistCount
      بيتحسب من نفس الـ Context.
    */
    toggleWishlist(wishlistItem);

    /*
      Event إضافي للتوافق مع أي جزء قديم في الموقع
      ما زال يستمع لهذا الحدث.
    */
    window.dispatchEvent(new Event("wishlist-updated"));
  }

  return (
    <article className="product-card">
      <div className="product-image-wrapper">

        {/* Wishlist */}
        <button
          type="button"
          className={`favorite-button ${
            favorite ? "favorite-button-active" : ""
          }`}
          onClick={handleWishlist}
          aria-label={
            favorite
              ? `إزالة ${product.name} من المفضلة`
              : `إضافة ${product.name} للمفضلة`
          }
          title={
            favorite
              ? "إزالة من المفضلة"
              : "إضافة للمفضلة"
          }
        >
          {favorite ? "♥" : "♡"}
        </button>

        {/* Product image */}
        <Link
          to={`/products/${product.id}`}
          className="product-title-link"
        >
          <div className="product-image">
            <span>{product.icon || "🍯"}</span>
          </div>
        </Link>
      </div>

      {/* Product information */}
      <Link
        to={`/products/${product.id}`}
        className="product-title-link"
      >
        <div className="product-info">

          <small>{product.category}</small>

          <h3>{product.name}</h3>

          <p className="product-description">
            {product.description ||
              `اختيارات متعددة من ${product.name}`}
          </p>

          <div className="product-variant-summary">
            <span>
              {sameProductVariants} اختيارات متاحة
            </span>

            <span>
              {product.minPrice === product.maxPrice
                ? `${Number(product.minPrice).toFixed(2)} ج.م`
                : `من ${Number(product.minPrice).toFixed(2)} ج.م`}
            </span>
          </div>

          <div className="product-bottom">

            <strong>
              {firstVariant?.weight || "اختيارات متعددة"}
            </strong>

            <span className="variant-link">
              اختار المنتج ←
            </span>

          </div>

        </div>
      </Link>
    </article>
  );
}