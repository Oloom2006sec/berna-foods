import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { groupProducts } from "../utils/productGroups";
import BundleCompositionImage from "./BundleCompositionImage";
import "./bundle-offers.css";

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

export default function BundleOffersSection({ bundles = [] }) {
  const { addBundleToCart, addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [addedBundleId, setAddedBundleId] = useState("");
  const [addedProductSku, setAddedProductSku] = useState("");
  const [error, setError] = useState("");
  const productsBySku = useMemo(
    () =>
      new Map(
        groupProducts().flatMap((group) =>
          group.customerVariants.map((variant) => [
            variant.sku,
            { ...variant, image: group.image, productGroup: group },
          ])
        )
      ),
    []
  );
  const today = getLocalDate();
  const visibleBundles = bundles.filter(
    (bundle) =>
      bundle.enabled &&
      (bundle.status || "active") === "active" &&
      (bundle.channel || "أفراد") === "أفراد" &&
      (!bundle.startDate || bundle.startDate <= today) &&
      (!bundle.endDate || bundle.endDate >= today) &&
      bundle.items.length > 0 &&
      bundle.items.every((item) => productsBySku.has(item.sku))
  );

  if (!visibleBundles.length) {
    return null;
  }

  function handleAddBundle(bundle) {
    try {
      addBundleToCart(bundle);
      setAddedBundleId(bundle.id);
      setError("");
      window.setTimeout(() => setAddedBundleId(""), 1800);
    } catch (addError) {
      console.error("Add bundle to cart error:", addError);
      setError(addError.message || "تعذر إضافة العرض إلى السلة.");
    }
  }

  function handleAddProduct(product, group) {
    addToCart({
      ...product,
      quantity: 1,
      image: group.image,
    });
    setAddedProductSku(product.sku);
    window.setTimeout(() => setAddedProductSku(""), 1400);
  }

  return (
    <section
      className="bundle-offers-section"
      aria-labelledby="bundle-offers-title"
    >
      <div className="container">
        <div className="bundle-offers-heading">
          <div>
            <span className="eyebrow">اختيارات بتوفر أكتر</span>
            <h2 id="bundle-offers-title">عروض المجموعات</h2>
            <p>تشكيلات اختارناها لك، بسعر خاص لفترة محدودة.</p>
          </div>
          <Link to="/products" className="bundle-offers-more">
            اكتشف كل المنتجات
          </Link>
        </div>

        {error && (
          <p className="bundle-offers-error" role="alert">
            {error}
          </p>
        )}

        <div className="bundle-offers-grid">
          {visibleBundles.map((bundle) => {
            const regularTotal = bundle.items.reduce((total, item) => {
              const product = productsBySku.get(item.sku);
              return total + Number(product.price) * Number(item.quantity);
            }, 0);
            const bundleProducts = bundle.items
              .map((item) => productsBySku.get(item.sku))
              .filter((product) => product?.image);

            return (
              <article
                className="bundle-offer-card"
                key={bundle.id}
              >
                <div className="bundle-offer-visual">
                  <span className="bundle-offer-badge">
                    وفر {Number(bundle.discountPercent) || 0}%
                  </span>
                  <BundleCompositionImage
                    className="bundle-offer-composition"
                    products={bundleProducts.map((product) => ({
                      sku: product.sku,
                      image: product.image,
                    }))}
                    alt={`منتجات ${bundle.name}: ${bundleProducts
                      .map((product) => product.name)
                      .join("، ")}`}
                  />
                </div>

                <div className="bundle-offer-copy">
                  <div className="bundle-offer-title-row">
                    <h3>{bundle.name}</h3>
                    <span className="bundle-offer-tag">
                      باقة مميزة
                    </span>
                  </div>
                  {bundle.description && <p>{bundle.description}</p>}
                  <ul className="bundle-offer-items">
                    {bundle.items.map((item) => {
                      const product = productsBySku.get(item.sku);
                      const group = product.productGroup;
                      const favorite = wishlist.some(
                        (entry) =>
                          entry.groupId === group.id ||
                          entry.id === group.id
                      );
                      return (
                        <li className="bundle-offer-item" key={item.sku}>
                          <span>
                            {product.name} — {product.weight}
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </span>
                          <span className="bundle-offer-item-actions">
                            <button
                              type="button"
                              aria-label={
                                favorite
                                  ? `إزالة ${product.name} من المفضلة`
                                  : `إضافة ${product.name} للمفضلة`
                              }
                              aria-pressed={favorite}
                              onClick={() =>
                                toggleWishlist({
                                  id: group.id,
                                  groupId: group.id,
                                  name: group.name,
                                  category: group.category,
                                  image: group.image,
                                  icon: group.icon || "🍯",
                                  description: group.description,
                                  minPrice: group.minPrice,
                                  maxPrice: group.maxPrice,
                                  sku: product.sku,
                                  price: product.price,
                                  weight: product.weight,
                                  weightGrams: product.weightGrams,
                                  available: true,
                                })
                              }
                            >
                              {favorite ? "♥" : "♡"}
                            </button>
                            <button
                              type="button"
                              aria-label={`إضافة ${product.name} ${product.weight} للسلة`}
                              onClick={() => handleAddProduct(product, group)}
                            >
                              {addedProductSku === product.sku ? "✓" : "+"}
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="bundle-offer-prices">
                    <del>{formatMoney(regularTotal)} ج.م</del>
                    <strong>{formatMoney(bundle.bundlePrice)} ج.م</strong>
                  </div>
                  <button
                    type="button"
                    className="bundle-offer-add"
                    onClick={() => handleAddBundle(bundle)}
                  >
                    {addedBundleId === bundle.id
                      ? "تمت الإضافة للسلة"
                      : "أضف العرض للسلة"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
