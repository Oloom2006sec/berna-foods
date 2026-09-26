import { useEffect, useMemo, useState } from "react";

import {
  getOrders,
  updateOrderStatus,
  updateDepositStatus,
} from "../services/orderService";

import { supabase } from "../lib/supabase";

const statusLabels = {
  new: "جديد",
  preparing: "جاري التجهيز",
  out_for_delivery: "خرج للتوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const paymentLabels = {
  deposit_required: "المقدم مطلوب",
  deposit_pending: "في انتظار مراجعة المقدم",
  deposit_paid: "المقدم مدفوع",
  fully_paid: "مدفوع بالكامل",
};

const receiptLabels = {
  not_uploaded: "لم يتم رفع الإيصال",
  uploaded: "في انتظار مراجعة الإيصال",
  approved: "تم اعتماد الإيصال",
  rejected: "تم رفض الإيصال",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingOrder, setProcessingOrder] = useState("");

  // ================= SEARCH & FILTERS =================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders();

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load orders error:", error);

      setError(
        error?.message ||
          "تعذر تحميل الطلبات."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // ================= FILTERED ORDERS =================

  const filteredOrders = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      // ---------------- SEARCH ----------------

      const searchableText = [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.governorate,
        order.area,
        order.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      // ---------------- STATUS ----------------

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      // ---------------- PAYMENT ----------------

      const matchesPayment =
        paymentFilter === "all" ||
        order.payment_status === paymentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    orders,
    searchTerm,
    statusFilter,
    paymentFilter,
  ]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentFilter("all");
  }

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all";

  // ================= STATUS =================

  async function handleStatusChange(
    orderNumber,
    status
  ) {
    try {
      setProcessingOrder(orderNumber);

      await updateOrderStatus(
        orderNumber,
        status
      );

      await loadOrders();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "تعذر تحديث حالة الطلب."
      );
    } finally {
      setProcessingOrder("");
    }
  }

  // ================= VIEW RECEIPT =================

  async function viewReceipt(order) {
    if (!order.receipt_url) {
      alert(
        "لا يوجد إيصال تحويل مرفوع لهذا الطلب."
      );
      return;
    }

    try {
      setProcessingOrder(
        order.order_number
      );

      const { data, error } =
        await supabase.storage
          .from("order-receipts")
          .createSignedUrl(
            order.receipt_url,
            60 * 10
          );

      if (error) {
        console.error(
          "Create receipt signed URL error:",
          error
        );

        throw new Error(
          "تعذر فتح إيصال التحويل."
        );
      }

      if (!data?.signedUrl) {
        throw new Error(
          "تعذر إنشاء رابط إيصال التحويل."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "حدث خطأ أثناء فتح إيصال التحويل."
      );
    } finally {
      setProcessingOrder("");
    }
  }

  // ================= APPROVE DEPOSIT =================

  async function handleDepositPaid(order) {
    const depositAmount = Number(
      order.deposit_amount || 0
    );

    const confirmed = window.confirm(
      `هل تؤكد استلام مبلغ المقدم ${formatPrice(
        depositAmount
      )} ج.م للطلب ${order.order_number}؟`
    );

    if (!confirmed) return;

    try {
      setProcessingOrder(
        order.order_number
      );

      await updateDepositStatus(
        order.order_number,
        depositAmount
      );

      const { error } = await supabase
        .from("orders")
        .update({
          receipt_status: "approved",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "order_number",
          order.order_number
        );

      if (error) {
        console.error(
          "Receipt approval update error:",
          error
        );

        throw new Error(
          "تم تحديث الدفع لكن تعذر تحديث حالة الإيصال."
        );
      }

      await loadOrders();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "تعذر تحديث حالة المقدم."
      );
    } finally {
      setProcessingOrder("");
    }
  }

  // ================= REJECT RECEIPT =================

  async function handleRejectReceipt(order) {
    const confirmed = window.confirm(
      `هل تريد رفض إيصال التحويل للطلب ${order.order_number}؟`
    );

    if (!confirmed) return;

    try {
      setProcessingOrder(
        order.order_number
      );

      const { error } = await supabase
        .from("orders")
        .update({
          receipt_status: "rejected",
          payment_status:
            "deposit_required",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "order_number",
          order.order_number
        );

      if (error) {
        console.error(
          "Reject receipt error:",
          error
        );

        throw new Error(
          "تعذر رفض إيصال التحويل."
        );
      }

      await loadOrders();
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "حدث خطأ أثناء رفض الإيصال."
      );
    } finally {
      setProcessingOrder("");
    }
  }

  // ================= HELPERS =================

  function formatPrice(value) {
    return Number(
      value || 0
    ).toLocaleString(
      "ar-EG",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString(
      "ar-EG"
    );
  }

  function getVariantText(item) {
    const parts = [];

    if (item.weight) {
      parts.push(item.weight);
    }

    if (item.packageType) {
      parts.push(item.packageType);
    }

    return parts.join(" — ");
  }

  function getReceiptStatus(order) {
    return (
      receiptLabels[
        order.receipt_status
      ] ||
      order.receipt_status ||
      "غير معروف"
    );
  }

  function getStatusClass(status) {
    return (
      {
        new: "new",
        preparing: "preparing",
        out_for_delivery:
          "out-for-delivery",
        delivered: "delivered",
        cancelled: "cancelled",
      }[status] || "new"
    );
  }

  // ================= LOADING =================

  if (loading) {
    return (
      <main
        className="admin-orders-page compact-admin-orders"
        dir="rtl"
      >
        <div className="container">
          <div className="admin-empty">
            <div>⏳</div>

            <h2>
              جاري تحميل الطلبات...
            </h2>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="admin-orders-page compact-admin-orders"
      dir="rtl"
    >
      <div className="container">

        {/* ================= PAGE HEADER ================= */}

        <div className="orders-page-header">

          <div>
            <span className="eyebrow">
              BERNA FOODS
            </span>

            <h1>
              إدارة الطلبات
            </h1>

            <p>
              متابعة الطلبات وحالة الدفع والإيصالات.
            </p>
          </div>

          <div className="orders-page-actions">

            <button
              type="button"
              className="orders-refresh-btn"
              onClick={loadOrders}
              disabled={loading}
            >
              🔄 تحديث
            </button>

            <div className="orders-count-box">
              <strong>
                {orders.length}
              </strong>

              <span>
                إجمالي الطلبات
              </span>
            </div>

          </div>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        {/* ================= SEARCH & FILTERS ================= */}

        <section className="orders-filters">

          <div className="orders-search-wrapper">

            <span className="orders-search-icon">
              🔎
            </span>

            <input
              type="text"
              className="orders-search-input"
              placeholder="ابحث برقم الطلب، اسم العميل، الموبايل، المحافظة أو المنطقة..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="orders-search-clear"
                onClick={() =>
                  setSearchTerm("")
                }
                aria-label="مسح البحث"
              >
                ×
              </button>
            )}

          </div>

          <div className="orders-filter-group">

            <label>
              حالة الطلب
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                كل الحالات
              </option>

              <option value="new">
                جديد
              </option>

              <option value="preparing">
                جاري التجهيز
              </option>

              <option value="out_for_delivery">
                خرج للتوصيل
              </option>

              <option value="delivered">
                تم التسليم
              </option>

              <option value="cancelled">
                ملغي
              </option>
            </select>

          </div>

          <div className="orders-filter-group">

            <label>
              حالة الدفع
            </label>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                كل حالات الدفع
              </option>

              <option value="deposit_required">
                المقدم مطلوب
              </option>

              <option value="deposit_pending">
                في انتظار مراجعة المقدم
              </option>

              <option value="deposit_paid">
                المقدم مدفوع
              </option>

              <option value="fully_paid">
                مدفوع بالكامل
              </option>
            </select>

          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="orders-clear-filters-btn"
              onClick={clearFilters}
            >
              ✕ مسح الفلاتر
            </button>
          )}

        </section>

        {/* ================= RESULTS INFO ================= */}

        <div className="orders-results-bar">

          <span>
            عرض{" "}
            <strong>
              {filteredOrders.length}
            </strong>{" "}
            من{" "}
            <strong>
              {orders.length}
            </strong>{" "}
            طلب
          </span>

          {hasActiveFilters && (
            <span className="orders-filter-active">
              🔎 يوجد فلتر/بحث مفعل
            </span>
          )}

        </div>

        {/* ================= EMPTY ================= */}

        {!orders.length ? (

          <div className="admin-empty">

            <div>📦</div>

            <h2>
              لا توجد طلبات حتى الآن
            </h2>

            <p>
              عندما يقوم أحد العملاء بإنشاء
              طلب سيظهر هنا.
            </p>

          </div>

        ) : !filteredOrders.length ? (

          <div className="admin-empty orders-no-results">

            <div>🔎</div>

            <h2>
              لا توجد نتائج
            </h2>

            <p>
              لم نجد طلبات مطابقة للبحث أو الفلاتر الحالية.
            </p>

            <button
              type="button"
              className="orders-clear-filters-btn"
              onClick={clearFilters}
            >
              مسح البحث والفلاتر
            </button>

          </div>

        ) : (

          <div className="admin-orders-compact">

            {filteredOrders.map((order) => {

              const items =
                Array.isArray(order.items)
                  ? order.items
                  : [];

              const isProcessing =
                processingOrder ===
                order.order_number;

              const hasReceipt =
                Boolean(
                  order.receipt_url
                );

              const receiptUploaded =
                order.receipt_status ===
                "uploaded";

              const receiptRejected =
                order.receipt_status ===
                "rejected";

              const depositRequired =
                order.payment_status ===
                "deposit_required";

              const depositPending =
                order.payment_status ===
                "deposit_pending";

              return (
                <article
                  className="admin-order-card-compact"
                  key={
                    order.order_number
                  }
                >

                  {/* ================= TOP BAR ================= */}

                  <div className="order-compact-top">

                    <div className="order-identity">

                      <span className="order-number">
                        {order.order_number}
                      </span>

                      <span className="order-date">
                        {formatDate(
                          order.created_at
                        )}
                      </span>

                    </div>

                    <div className="order-top-right">

                      <span
                        className={`order-status-badge ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {statusLabels[
                          order.status
                        ] ||
                          order.status ||
                          "غير معروف"}
                      </span>

                      <select
                        className="order-status-select"
                        value={
                          order.status ||
                          "new"
                        }
                        disabled={
                          isProcessing
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            order.order_number,
                            event.target.value
                          )
                        }
                      >
                        <option value="new">
                          جديد
                        </option>

                        <option value="preparing">
                          جاري التجهيز
                        </option>

                        <option value="out_for_delivery">
                          خرج للتوصيل
                        </option>

                        <option value="delivered">
                          تم التسليم
                        </option>

                        <option value="cancelled">
                          ملغي
                        </option>
                      </select>

                    </div>

                  </div>

                  {/* ================= MAIN GRID ================= */}

                  <div className="order-compact-grid">

                    {/* CUSTOMER */}

                    <section className="order-info-box">

                      <div className="order-box-title">
                        👤 بيانات العميل
                      </div>

                      <div className="customer-main-name">
                        {order.customer_name ||
                          "-"}
                      </div>

                      <div className="customer-info-line">
                        📱{" "}
                        {order.customer_phone ||
                          "-"}
                      </div>

                      <div className="customer-info-line">
                        📍{" "}
                        {order.governorate ||
                          "-"}
                        {" - "}
                        {order.area || "-"}
                      </div>

                      <div className="customer-info-line">
                        🏠{" "}
                        {order.address ||
                          "-"}
                      </div>

                      {order.notes && (
                        <div className="customer-notes">
                          📝 {order.notes}
                        </div>
                      )}

                    </section>

                    {/* PRODUCTS */}

                    <section className="order-info-box order-products-box">

                      <div className="order-box-title">
                        🍯 المنتجات
                      </div>

                      <div className="compact-products-list">

                        {items.map(
                          (item, index) => {

                            const key =
                              item.sku ||
                              item.id ||
                              `${order.order_number}-${index}`;

                            const variantText =
                              getVariantText(
                                item
                              );

                            return (
                              <div
                                className="compact-product-row"
                                key={key}
                              >

                                <div className="compact-product-main">

                                  <span className="compact-product-icon">
                                    {item.icon ||
                                      "🍯"}
                                  </span>

                                  <div>

                                    <strong>
                                      {item.name}
                                    </strong>

                                    <small>
                                      {variantText ||
                                        "مواصفة غير محددة"}

                                      {item.sku && (
                                        <>
                                          {" • SKU: "}
                                          {item.sku}
                                        </>
                                      )}
                                    </small>

                                  </div>

                                </div>

                                <div className="compact-product-price">

                                  <span>
                                    ×
                                    {
                                      item.quantity
                                    }
                                  </span>

                                  <strong>
                                    {formatPrice(
                                      item.price
                                    )}{" "}
                                    ج.م
                                  </strong>

                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>

                    </section>

                    {/* PAYMENT */}

                    <section className="order-info-box payment-box">

                      <div className="order-box-title">
                        💰 تفاصيل الدفع
                      </div>

                      <div className="payment-line">
                        <span>
                          الإجمالي
                        </span>

                        <strong>
                          {formatPrice(
                            order.total
                          )}{" "}
                          ج.م
                        </strong>
                      </div>

                      <div className="payment-line">
                        <span>
                          المقدم المطلوب
                        </span>

                        <strong>
                          {formatPrice(
                            order.deposit_amount
                          )}{" "}
                          ج.م
                        </strong>
                      </div>

                      <div className="payment-line">
                        <span>
                          المقدم المدفوع
                        </span>

                        <strong>
                          {formatPrice(
                            order.deposit_paid
                          )}{" "}
                          ج.م
                        </strong>
                      </div>

                      <div className="payment-line">
                        <span>
                          المتبقي
                        </span>

                        <strong>
                          {formatPrice(
                            order.remaining_amount
                          )}{" "}
                          ج.م
                        </strong>
                      </div>

                      <div className="payment-status-line">

                        <span>
                          حالة الدفع
                        </span>

                        <b>
                          {paymentLabels[
                            order.payment_status
                          ] ||
                            order.payment_status ||
                            "المقدم مطلوب"}
                        </b>

                      </div>

                    </section>

                  </div>

                  {/* ================= RECEIPT ================= */}

                  {hasReceipt && (
                    <section className="compact-receipt-section">

                      <div className="compact-receipt-info">

                        <div>

                          <strong>
                            🧾 إيصال التحويل
                          </strong>

                          <span>
                            {getReceiptStatus(
                              order
                            )}
                          </span>

                        </div>

                        <span
                          className={
                            `compact-receipt-badge ` +
                            (
                              order.receipt_status ===
                              "approved"
                                ? "approved"
                                : order.receipt_status ===
                                  "rejected"
                                ? "rejected"
                                : "pending"
                            )
                          }
                        >
                          {getReceiptStatus(
                            order
                          )}
                        </span>

                      </div>

                      <div className="compact-receipt-actions">

                        <button
                          type="button"
                          className="receipt-view-btn"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            viewReceipt(
                              order
                            )
                          }
                        >
                          👁️ عرض الإيصال
                        </button>

                        {(receiptUploaded ||
                          depositPending) && (
                          <>
                            <button
                              type="button"
                              className="receipt-approve-btn"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleDepositPaid(
                                  order
                                )
                              }
                            >
                              {isProcessing
                                ? "جاري المعالجة..."
                                : `✓ اعتماد المقدم ${formatPrice(
                                    order.deposit_amount
                                  )} ج.م`}
                            </button>

                            <button
                              type="button"
                              className="receipt-reject-btn"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleRejectReceipt(
                                  order
                                )
                              }
                            >
                              ✕ رفض الإيصال
                            </button>
                          </>
                        )}

                      </div>

                      {receiptUploaded && (
                        <div className="receipt-pending-message">
                          ⏳ تم رفع الإيصال وينتظر مراجعة الإدارة.
                        </div>
                      )}

                      {receiptRejected && (
                        <div className="receipt-rejected-message">
                          ⚠️ تم رفض الإيصال ويمكن للعميل رفع إيصال جديد.
                        </div>
                      )}

                    </section>
                  )}

                  {/* ================= NO RECEIPT ================= */}

                  {!hasReceipt &&
                    depositRequired && (
                      <section className="compact-no-receipt">

                        <div>

                          <strong>
                            📭 لم يتم رفع إيصال التحويل
                          </strong>

                          <span>
                            الطلب في انتظار تحويل المقدم من العميل.
                          </span>

                        </div>

                        <button
                          type="button"
                          className="confirm-order-btn"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleDepositPaid(
                              order
                            )
                          }
                        >
                          {isProcessing
                            ? "جاري المعالجة..."
                            : `✓ تأكيد استلام المقدم ${formatPrice(
                                order.deposit_amount
                              )} ج.م`}
                        </button>

                      </section>
                    )}

                  {/* ================= TOTAL ================= */}

                  <div className="compact-order-total">

                    <div>
                      <span>
                        المنتجات
                      </span>

                      <strong>
                        {formatPrice(
                          order.subtotal
                        )}{" "}
                        ج.م
                      </strong>
                    </div>

                    <div>
                      <span>
                        الشحن
                      </span>

                      <strong>
                        {Number(
                          order.shipping
                        ) === 0
                          ? "مجاني"
                          : `${formatPrice(
                              order.shipping
                            )} ج.م`}
                      </strong>
                    </div>

                    <div className="compact-grand-total">

                      <span>
                        إجمالي الطلب
                      </span>

                      <strong>
                        {formatPrice(
                          order.total
                        )}{" "}
                        ج.م
                      </strong>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}