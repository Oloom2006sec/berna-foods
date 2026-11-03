import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";

export default function CartDrawer({ onClose }) {
  const {
    cart,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  function formatPrice(value) {
    return Number(value || 0).toFixed(2);
  }

  function getItemKey(item) {
    return item.cartLineId || item.sku || item.id;
  }

  return (
    <div
      className="cart-overlay"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="cart-drawer"
        onClick={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="cart-header">

          <h2 id="cart-drawer-title">
            🛒 السلة
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السلة"
          >
            ✕
          </button>

        </div>

        {/* ==================================================
            EMPTY
            ================================================== */}

        {!cart.length ? (

          <div className="empty-cart">

            <div>
              🛒
            </div>

            <h3>
              السلة فاضية
            </h3>

            <p>
              اختار المنتجات اللي تحبها
              ونبدأ طلبك.
            </p>

            <Link
              to="/products"
              className="empty-cart-link"
              onClick={onClose}
            >
              تصفّح المنتجات
            </Link>

          </div>

        ) : (

          <>

            {/* ==================================================
                CART ITEMS
                ================================================== */}

            <div className="cart-items">

              {cart.map((item) => {

                const itemKey =
                  getItemKey(item);

                const itemTotal =
                  Number(
                    item.price || 0
                  ) *
                  Number(
                    item.quantity || 0
                  );

                return (
                  <div
                    className="cart-item"
                    key={itemKey}
                  >

                    {/* PRODUCT IMAGE */}

                    <div className="cart-item-icon">
                      {item.bundleItems?.length ? (
                        <div className="cart-bundle-thumbnails">
                          {item.bundleItems.slice(0, 4).map((component) => (
                            <span key={component.sku}>
                              {component.image ? (
                                <img src={component.image} alt="" loading="lazy" />
                              ) : (
                                "🍯"
                              )}
                            </span>
                          ))}
                        </div>
                      ) : item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      ) : (
                        item.icon || "🍯"
                      )}
                    </div>

                    {/* PRODUCT INFORMATION */}

                    <div className="cart-item-info">

                      <strong>
                        {item.name}
                      </strong>

                      {/* VARIANT / BUNDLE COMPONENTS */}

                      {!item.bundleOfferId && item.weight && (
                        <small>
                          {item.weight}
                        </small>
                      )}
                      {item.bundleItems?.length > 0 && (
                        <ul className="cart-bundle-components">
                          {item.bundleItems.map((component) => (
                            <li key={component.sku}>
                              {component.name} · {component.weight} ×{" "}
                              {component.quantity}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* UNIT PRICE */}

                      <small>
                        {item.bundleOfferId ? "سعر العرض: " : "سعر الوحدة: "}
                        {item.originalPrice > item.price && (
                          <del>{formatPrice(item.originalPrice)} ج.م </del>
                        )}
                        {formatPrice(
                          item.price
                        )}{" "}
                        ج.م
                      </small>
                      {item.promotionLabel && (
                        <small className="cart-promotion-label">
                          {item.promotionLabel} ({item.discountPercent}%)
                        </small>
                      )}

                      {/* TOTAL */}

                      <strong>
                        {formatPrice(
                          itemTotal
                        )}{" "}
                        ج.م
                      </strong>

                      {/* QUANTITY */}

                      <div className="quantity">

                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              itemKey
                            )
                          }
                          aria-label="تقليل الكمية"
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              itemKey
                            )
                          }
                          aria-label="زيادة الكمية"
                        >
                          +
                        </button>

                      </div>

                    </div>

                    {/* REMOVE */}

                    <button
                      type="button"
                      className="remove-item"
                      onClick={() =>
                        removeFromCart(
                          itemKey
                        )
                      }
                      aria-label="حذف المنتج"
                    >
                      🗑
                    </button>

                  </div>
                );
              })}

            </div>

            {/* ==================================================
                FOOTER
                ================================================== */}

            <div className="cart-footer">

              <div className="cart-total">

                <span>
                  الإجمالي
                </span>

                <strong>
                  {formatPrice(
                    cartTotal
                  )}{" "}
                  ج.م
                </strong>

              </div>

              {/* CHECKOUT */}

              <Link
                to="/checkout"
                className="checkout-btn"
                onClick={onClose}
              >
                🛒 إتمام الطلب
              </Link>

              {/* CLEAR */}

              <button
                type="button"
                className="clear-cart"
                onClick={clearCart}
              >
                إفراغ السلة
              </button>

            </div>

          </>
        )}

      </aside>
    </div>
  );
}