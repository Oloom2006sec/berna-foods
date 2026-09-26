import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  getOrder,
  uploadOrderReceipt,
} from "../services/orderService";

const statusSteps = [
  {
    key: "new",
    label: "تم استلام الطلب",
  },
  {
    key: "preparing",
    label: "جاري التجهيز",
  },
  {
    key: "out_for_delivery",
    label: "خرج للتوصيل",
  },
  {
    key: "delivered",
    label: "تم التسليم",
  },
];

const statusOrder = [
  "new",
  "preparing",
  "out_for_delivery",
  "delivered",
];

const statusLabels = {
  new: "تم استلام الطلب",
  preparing: "جاري التجهيز",
  out_for_delivery: "خرج للتوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const paymentLabels = {
  deposit_required: "المقدم مطلوب",
  deposit_paid: "المقدم مدفوع",
  fully_paid: "مدفوع بالكامل",
};

export default function OrderTracking() {
  const [searchParams] =
    useSearchParams();

  const [orderNumber, setOrderNumber] =
    useState("");

  const [order, setOrder] =
    useState(null);

  const [searched, setSearched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [uploadingReceipt, setUploadingReceipt] =
    useState(false);

  const [receiptError, setReceiptError] =
    useState("");

  const fileInputRef =
    useRef(null);

  /*
    =========================
    البحث عن الطلب
    =========================
  */

  async function searchOrder(number) {
    const normalizedNumber =
      String(number || "")
        .trim()
        .toUpperCase();

    if (!normalizedNumber) {
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setReceiptError("");

    try {
      const foundOrder =
        await getOrder(
          normalizedNumber
        );

      setOrder(
        foundOrder || null
      );
    } catch (error) {
      console.error(
        "Tracking order error:",
        error
      );

      setOrder(null);

      setError(
        error?.message ||
          "حدث خطأ أثناء البحث عن الطلب."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    =========================
    البحث التلقائي من الرابط
    =========================

    /track-order?order=BR-400827
  */

  useEffect(() => {
    const orderFromUrl =
      searchParams.get("order");

    if (orderFromUrl) {
      const normalized =
        orderFromUrl
          .trim()
          .toUpperCase();

      setOrderNumber(
        normalized
      );

      searchOrder(normalized);
    }
  }, [searchParams]);

  /*
    =========================
    البحث اليدوي
    =========================
  */

  function handleSearch(event) {
    event.preventDefault();

    searchOrder(orderNumber);
  }

  /*
    =========================
    رفع إيصال التحويل
    =========================

    مهم:
    لا نستخدم receipt_token من order.

    uploadOrderReceipt()
    تحصل على الـ token بنفسها
    من get_receipt_upload_token RPC.
  */

  async function handleReceiptUpload(
    event
  ) {
    const file =
      event.target.files?.[0];

    /*
      نسمح باختيار نفس الملف مرة أخرى
    */
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!order) {
      setReceiptError(
        "بيانات الطلب غير موجودة."
      );
      return;
    }

    setUploadingReceipt(true);
    setReceiptError("");

    try {
      /*
        ==========================================
        مهم جداً

        لا نرسل:
        order.receipt_token

        لأن get_order_tracking
        لم يعد يرجع receipt_token.

        الـ service سيطلب الـ token
        من RPC الآمن بنفسه.
        ==========================================
      */

      await uploadOrderReceipt(
        order.order_number,
        file
      );

      /*
        ==========================================
        إعادة تحميل الطلب من Supabase
        ==========================================
      */

      const refreshedOrder =
        await getOrder(
          order.order_number
        );

      setOrder(
        refreshedOrder || null
      );

      setReceiptError("");
    } catch (error) {
      console.error(
        "Receipt upload error:",
        error
      );

      setReceiptError(
        error?.message ||
          "تعذر رفع إيصال التحويل."
      );
    } finally {
      setUploadingReceipt(false);
    }
  }

  /*
    =========================
    هل المرحلة الحالية وصلت للخطوة؟
    =========================
  */

  function isStepActive(
    stepKey
  ) {
    if (!order) {
      return false;
    }

    if (
      order.status ===
      "cancelled"
    ) {
      return false;
    }

    const currentIndex =
      statusOrder.indexOf(
        order.status
      );

    const stepIndex =
      statusOrder.indexOf(
        stepKey
      );

    if (
      currentIndex === -1
    ) {
      return false;
    }

    return (
      currentIndex >= stepIndex
    );
  }

  /*
    =========================
    تنسيق السعر
    =========================
  */

  function formatPrice(value) {
    return Number(
      value || 0
    ).toFixed(2);
  }

  /*
    =========================
    تفاصيل الـ Variant
    =========================
  */

  function getVariantText(item) {
    return [
      item.weight,
      item.packageType,
    ]
      .filter(Boolean)
      .join(" — ");
  }

  /*
    =========================
    Key للمنتجات
    =========================
  */

  function getItemKey(
    item,
    index
  ) {
    return (
      item.sku ||
      item.id ||
      `${item.name}-${index}`
    );
  }

  return (
    <main
      className="order-tracking-page"
      dir="rtl"
    >
      <div className="container">

        {/* ================= HEADER ================= */}

        <div className="tracking-header">

          <span className="eyebrow">
            BERNA FOODS
          </span>

          <h1>
            تتبع طلبك
          </h1>

          <p>
            أدخل رقم الطلب لمعرفة حالة طلبك.
          </p>

        </div>

        {/* ================= SEARCH CARD ================= */}

        <div className="tracking-card">

          <form
            onSubmit={handleSearch}
            className="tracking-form"
          >

            <div
              style={{
                flex: 1,
              }}
            >

              <label>
                رقم الطلب
              </label>

              <input
                type="text"
                value={orderNumber}
                onChange={(event) =>
                  setOrderNumber(
                    event.target.value
                  )
                }
                placeholder="مثال: BR-123456"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "جاري البحث..."
                : "🔎 تتبع الطلب"}
            </button>

          </form>

          {/* ================= ERROR ================= */}

          {error && (
            <div className="tracking-not-found">

              <div>
                ⚠️
              </div>

              <h2>
                حدث خطأ
              </h2>

              <p>
                {error}
              </p>

            </div>
          )}

          {/* ================= NOT FOUND ================= */}

          {searched &&
            !loading &&
            !error &&
            !order && (
              <div className="tracking-not-found">

                <div>
                  🔍
                </div>

                <h2>
                  لم نجد هذا الطلب
                </h2>

                <p>
                  تأكد من كتابة رقم الطلب بشكل صحيح.
                </p>

              </div>
            )}

          {/* ================= ORDER ================= */}

          {order && (
            <div className="tracking-result">

              {/* ================= ORDER NUMBER ================= */}

              <div className="tracking-success">

                <span>
                  ✓
                </span>

                <div>

                  <small>
                    رقم الطلب
                  </small>

                  <strong>
                    {order.order_number}
                  </strong>

                </div>

              </div>

              {/* ================= STATUS ================= */}

              {order.status ===
              "cancelled" ? (

                <div className="current-order-status">

                  الحالة الحالية:

                  <strong>
                    الطلب ملغي
                  </strong>

                </div>

              ) : (

                <div className="order-status">

                  {statusSteps.map(
                    (
                      step,
                      index
                    ) => (

                      <div
                        className={`status-step ${
                          isStepActive(
                            step.key
                          )
                            ? "active"
                            : ""
                        }`}
                        key={
                          step.key
                        }
                      >

                        <span>
                          {isStepActive(
                            step.key
                          )
                            ? "✓"
                            : index + 1}
                        </span>

                        <strong>
                          {step.label}
                        </strong>

                      </div>

                    )
                  )}

                </div>

              )}

              {/* ================= CURRENT STATUS ================= */}

              <div className="current-order-status">

                الحالة الحالية:

                <strong>
                  {statusLabels[
                    order.status
                  ] ||
                    "غير معروف"}
                </strong>

              </div>

              {/* ===================================================== */}
              {/* ================= RECEIPT STATUS ==================== */}
              {/* ===================================================== */}

              {/* ================= REJECTED ================= */}

              {order.receipt_status ===
                "rejected" && (

                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "18px",
                    borderRadius:
                      "14px",
                    background:
                      "#fff1f1",
                    border:
                      "1px solid #f3b5b5",
                    color:
                      "#a33a3a",
                    textAlign:
                      "center",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "28px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    ❌
                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      fontSize:
                        "17px",
                      marginBottom:
                        "7px",
                    }}
                  >
                    تم رفض إيصال التحويل
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      lineHeight:
                        1.8,
                      fontSize:
                        "13px",
                    }}
                  >
                    إيصال التحويل المرسل لم يتم اعتماده.
                    <br />
                    يمكنك رفع إيصال تحويل جديد للمراجعة.
                  </p>

                  {/* FILE INPUT */}

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/*"
                    onChange={
                      handleReceiptUpload
                    }
                    style={{
                      display:
                        "none",
                    }}
                  />

                  {/* UPLOAD BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      uploadingReceipt
                    }
                    style={{
                      width:
                        "100%",
                      marginTop:
                        "14px",
                      padding:
                        "12px 16px",
                      borderRadius:
                        "10px",
                      border:
                        "1px solid #d4a017",
                      background:
                        "#c99112",
                      color:
                        "#fff",
                      fontWeight:
                        "700",
                      cursor:
                        uploadingReceipt
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        uploadingReceipt
                          ? 0.7
                          : 1,
                    }}
                  >
                    {uploadingReceipt
                      ? "⏳ جاري رفع الإيصال..."
                      : "📤 رفع إيصال تحويل جديد"}
                  </button>

                  {receiptError && (
                    <div
                      style={{
                        marginTop:
                          "12px",
                        padding:
                          "10px",
                        borderRadius:
                          "10px",
                        background:
                          "#fff1f1",
                        border:
                          "1px solid #f3b5b5",
                        color:
                          "#a33a3a",
                        fontSize:
                          "13px",
                        lineHeight:
                          1.7,
                      }}
                    >
                      {
                        receiptError
                      }
                    </div>
                  )}

                </div>
              )}

              {/* ================= UPLOADED ================= */}

              {order.receipt_status ===
                "uploaded" && (

                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "18px",
                    borderRadius:
                      "14px",
                    background:
                      "#fff9e8",
                    border:
                      "1px solid #ead28a",
                    color:
                      "#856515",
                    textAlign:
                      "center",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "28px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    ⏳
                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      fontSize:
                        "17px",
                      marginBottom:
                        "7px",
                    }}
                  >
                    تم إرسال إيصال التحويل
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      lineHeight:
                        1.8,
                      fontSize:
                        "13px",
                    }}
                  >
                    الإيصال في انتظار مراجعة الإدارة.
                    <br />
                    سيتم تحديث حالة الطلب بعد المراجعة.
                  </p>

                </div>
              )}

              {/* ================= APPROVED ================= */}

              {order.receipt_status ===
                "approved" && (

                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "18px",
                    borderRadius:
                      "14px",
                    background:
                      "#eefaf1",
                    border:
                      "1px solid #b9dfc2",
                    color:
                      "#28733b",
                    textAlign:
                      "center",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "28px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    ✅
                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      fontSize:
                        "17px",
                      marginBottom:
                        "7px",
                    }}
                  >
                    تم تأكيد استلام المقدم
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      lineHeight:
                        1.8,
                      fontSize:
                        "13px",
                    }}
                  >
                    تم اعتماد إيصال التحويل بنجاح.
                    <br />
                    المتبقي يتم دفعه عند الاستلام.
                  </p>

                </div>
              )}

              {/* ================= NOT UPLOADED ================= */}

              {(!order.receipt_status ||
                order.receipt_status ===
                  "not_uploaded") && (

                <div
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "18px",
                    borderRadius:
                      "14px",
                    background:
                      "#faf7ef",
                    border:
                      "1px solid #eee2c7",
                    color:
                      "#71695c",
                    textAlign:
                      "center",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "28px",
                      marginBottom:
                        "8px",
                    }}
                  >
                    💳
                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      fontSize:
                        "17px",
                      marginBottom:
                        "7px",
                    }}
                  >
                    المقدم المطلوب 20%
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      lineHeight:
                        1.8,
                      fontSize:
                        "13px",
                    }}
                  >
                    برجاء تحويل قيمة المقدم وإرسال إيصال التحويل.
                  </p>

                  {/* FILE INPUT */}

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/*"
                    onChange={
                      handleReceiptUpload
                    }
                    style={{
                      display:
                        "none",
                    }}
                  />

                  {/* UPLOAD BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      uploadingReceipt
                    }
                    style={{
                      width:
                        "100%",
                      marginTop:
                        "14px",
                      padding:
                        "12px 16px",
                      borderRadius:
                        "10px",
                      border:
                        "1px solid #d4a017",
                      background:
                        "#c99112",
                      color:
                        "#fff",
                      fontWeight:
                        "700",
                      cursor:
                        uploadingReceipt
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        uploadingReceipt
                          ? 0.7
                          : 1,
                    }}
                  >
                    {uploadingReceipt
                      ? "⏳ جاري رفع الإيصال..."
                      : "📤 رفع إيصال التحويل"}
                  </button>

                  {receiptError && (
                    <div
                      style={{
                        marginTop:
                          "12px",
                        padding:
                          "10px",
                        borderRadius:
                          "10px",
                        background:
                          "#fff1f1",
                        border:
                          "1px solid #f3b5b5",
                        color:
                          "#a33a3a",
                        fontSize:
                          "13px",
                        lineHeight:
                          1.7,
                      }}
                    >
                      {
                        receiptError
                      }
                    </div>
                  )}

                </div>
              )}

              {/* ================= ORDER SUMMARY ================= */}

              <div className="tracking-summary">

                <h2>
                  ملخص الطلب
                </h2>

                {/* PRODUCTS */}

                <div className="tracking-items">

                  {Array.isArray(
                    order.items
                  ) &&
                    order.items.map(
                      (
                        item,
                        index
                      ) => {

                        const variantText =
                          getVariantText(
                            item
                          );

                        const itemTotal =
                          Number(
                            item.price ||
                              0
                          ) *
                          Number(
                            item.quantity ||
                              0
                          );

                        return (
                          <div
                            className="tracking-item"
                            key={getItemKey(
                              item,
                              index
                            )}
                          >

                            <div>

                              <strong>
                                {item.icon ||
                                  "🍯"}{" "}
                                {item.name}
                              </strong>

                              {variantText && (
                                <small
                                  style={{
                                    display:
                                      "block",
                                    marginTop:
                                      "5px",
                                  }}
                                >
                                  {
                                    variantText
                                  }
                                </small>
                              )}

                              {item.sku && (
                                <small
                                  style={{
                                    display:
                                      "block",
                                    marginTop:
                                      "3px",
                                  }}
                                >
                                  SKU:{" "}
                                  {
                                    item.sku
                                  }
                                </small>
                              )}

                            </div>

                            <div
                              style={{
                                textAlign:
                                  "left",
                              }}
                            >

                              <strong>
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </strong>

                              <small
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "4px",
                                }}
                              >
                                {formatPrice(
                                  itemTotal
                                )}{" "}
                                ج.م
                              </small>

                            </div>

                          </div>
                        );
                      }
                    )}

                </div>

                {/* ================= TOTALS ================= */}

                <div className="tracking-total">

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

                <div className="tracking-total">

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

                <div
                  className="tracking-total"
                  style={{
                    fontSize:
                      "18px",
                  }}
                >

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

              </div>

              {/* ================= PAYMENT ================= */}

              <div className="tracking-summary">

                <h2>
                  تفاصيل الدفع
                </h2>

                <div className="tracking-total">

                  <span>
                    المقدم المطلوب 20%
                  </span>

                  <strong>
                    {formatPrice(
                      order.deposit_amount
                    )}{" "}
                    ج.م
                  </strong>

                </div>

                <div className="tracking-total">

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

                <div className="tracking-total">

                  <span>
                    المتبقي عند الاستلام 80%
                  </span>

                  <strong>
                    {formatPrice(
                      order.remaining_amount
                    )}{" "}
                    ج.م
                  </strong>

                </div>

                <div className="current-order-status">

                  حالة الدفع:

                  <strong>
                    {
                      paymentLabels[
                        order.payment_status
                      ] ||
                      "المقدم مطلوب"
                    }
                  </strong>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* ================= BACK ================= */}

        <div className="tracking-back">

          <Link to="/products">
            ← العودة للمنتجات
          </Link>

        </div>

      </div>
    </main>
  );
}