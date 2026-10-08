import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { STORE_CONFIG } from "../config/store";

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
    return item.sku || item.id;
  }

  /*
  ============================================================
  WHATSAPP
  ============================================================
  */

  function sendToWhatsApp() {
    if (!cart.length) return;

    const phone = STORE_CONFIG.whatsapp;

    const items = cart
      .map((item) => {
        const variantText = [
          item.weight,
        ]
          .filter(Boolean)
          .join(" — ");

        return `• ${item.name}${
          variantText
            ? ` - ${variantText}`
            : ""
        } × ${item.quantity} = ${formatPrice(
          Number(item.price) *
          Number(item.quantity)
        )} ج.م`;
      })
      .join("\n");

    const message = `أهلاً بيرنا فوودز ❤️

أريد عمل طلب:

${items}

الإجمالي: ${formatPrice(
      cartTotal
    )} ج.م

برجاء التواصل معي لتأكيد الطلب.`;

    const url =
      `https://wa.me/${phone}?text=` +
      encodeURIComponent(message);

    window.open(
      url,
      "_blank"
    );
  }

  return (
    <div
      className="cart-overlay"
      onClick={onClose}
    >
      <aside
        className="cart-drawer"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="cart-header">

          <h2>
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
                      {item.image ? (
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

                      {/* WEIGHT */}

                      {item.weight && (
                        <small>
                          {item.weight}
                        </small>
                      )}

                      {/* UNIT PRICE */}

                      <small>
                        سعر الوحدة:{" "}
                        {formatPrice(
                          item.price
                        )}{" "}
                        ج.م
                      </small>

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

              {/* WHATSAPP */}

              <button
                type="button"
                className="whatsapp-order"
                onClick={sendToWhatsApp}
              >
                💬 طلب سريع عبر WhatsApp
              </button>

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