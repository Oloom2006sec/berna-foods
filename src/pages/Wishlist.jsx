import { Link } from "react-router-dom";
import { useMemo } from "react";

import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";

import { groupProducts } from "../utils/productGroups";

export default function Wishlist() {
  const {
    wishlist,
    wishlistCount,
    clearWishlist,
  } = useWishlist();

  /*
    ============================================================
    RESTORE FULL PRODUCT DATA
    ============================================================
    عناصر المفضلة المخزنة تحتوي على بيانات مختصرة فقط.
    هنا نرجع للـ Product Groups الأصلية حتى يحصل ProductCard
    على customerVariants + prices + weights + image.
  */

  const wishlistProducts = useMemo(() => {
    const allProducts = groupProducts();

    return wishlist
      .map((item) => {
        const originalProduct = allProducts.find(
          (product) =>
            product.id === item.groupId ||
            product.id === item.id ||
            product.name === item.name
        );

        if (!originalProduct) {
          return item;
        }

        return {
          ...originalProduct,

          /*
            نحافظ على بيانات المفضلة الحالية
            ونضمن وجود الصورة.
          */
          image:
            originalProduct.image ||
            item.image ||
            "",

          icon:
            originalProduct.icon ||
            item.icon ||
            "🍯",
        };
      })
      .filter(Boolean);
  }, [wishlist]);

  if (!wishlist.length) {
    return (
      <main
        className="wishlist-page"
        dir="rtl"
      >
        <div className="container empty-wishlist">

          <div className="empty-wishlist-icon">
            ♡
          </div>

          <h1>
            المفضلة فاضية
          </h1>

          <p>
            احفظ المنتجات اللي عجبتك هنا
            علشان ترجع لها بسهولة.
          </p>

          <Link
            to="/products"
            className="primary-btn"
          >
            اكتشف المنتجات
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main
      className="wishlist-page"
      dir="rtl"
    >
      <div className="container">

        {/* ================= HEADER ================= */}

        <header className="wishlist-header">

          <div>

            <span className="eyebrow">
              BERNA FOODS
            </span>

            <h1>
              منتجاتك المفضلة
            </h1>

            <p>
              عندك {wishlistCount} منتج
              في المفضلة.
            </p>

          </div>

          <button
            type="button"
            className="clear-wishlist"
            onClick={clearWishlist}
          >
            مسح المفضلة
          </button>

        </header>

        {/* ================= PRODUCTS ================= */}

        <div className="products-grid all-products-grid wishlist-products-grid">

          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}

        </div>

      </div>
    </main>
  );
}