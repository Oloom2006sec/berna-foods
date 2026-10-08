import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";

import { useCart } from "../context/CartContext";

import {
  findVariant,
  getProductGroupByParam,
  groupProducts,
} from "../utils/productGroups";

import { getProductDetails } from "../data/productDetails";

import "../variant-styles.css";

export default function ProductDetails() {
  const { id } = useParams();

  const group = useMemo(
    () => getProductGroupByParam(id),
    [id]
  );

  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  /*
    ============================================================
    PRODUCT DETAILS
    ============================================================
  */

  const details = useMemo(() => {
    if (!group) return null;

    return getProductDetails(group.name);
  }, [group]);

  /*
    ============================================================
    RELATED PRODUCTS
    ============================================================
  */

  const relatedProducts = useMemo(() => {
    if (!group) {
      return [];
    }

    const allProducts = groupProducts();

    return allProducts
      .filter(
        (product) =>
          product.id !== group.id
      )
      .filter(
        (product) =>
          product.category === group.category
      )
      .slice(0, 4);
  }, [group]);

  /*
    ============================================================
    CUSTOMER VARIANTS
    ============================================================
  */

  const customerVariants = useMemo(() => {
  if (!group) {
    return [];
  }

  const variants =
    group.customerVariants?.length
      ? group.customerVariants
      : group.variants || [];

  return [...variants].sort(
    (a, b) =>
      Number(a.weightGrams) -
      Number(b.weightGrams)
  );
}, [group]);

  /*
    ============================================================
    AVAILABLE WEIGHTS
    ============================================================
  */

  const weights = useMemo(() => {
    if (!customerVariants.length) {
      return [];
    }

    return [
      ...new Map(
        customerVariants.map((variant) => [
          Number(variant.weightGrams),
          variant.weight,
        ])
      ).entries(),
    ];
  }, [customerVariants]);

  /*
    ============================================================
    SELECTED WEIGHT
    ============================================================
  */

  const [selectedWeight, setSelectedWeight] =
    useState("");

  /*
    ============================================================
    INITIALIZE PRODUCT
    ============================================================
  */

  useEffect(() => {
    if (!customerVariants.length) {
      setSelectedWeight("");
      return;
    }

    setSelectedWeight(
      Number(customerVariants[0].weightGrams)
    );

    setQuantity(1);
    setAdded(false);
  }, [customerVariants]);

  /*
    ============================================================
    SELECTED VARIANT
    ============================================================
  */

 const selectedVariant = useMemo(() => {
  if (!group || !customerVariants.length) {
    return null;
  }

  const targetWeight = Number(selectedWeight);

  const matchedVariant = customerVariants.find(
    (variant) =>
      Number(variant.weightGrams) === targetWeight
  );

  return matchedVariant || customerVariants[0] || null;
}, [group, customerVariants, selectedWeight]);
  /*
    ============================================================
    CHOOSE WEIGHT
    ============================================================
  */

  function chooseWeight(weightGrams) {
    setSelectedWeight(Number(weightGrams));
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

  function handleAddToCart() {
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
    });

    setAdded(true);
  }

  /*
    ============================================================
    PRODUCT NOT FOUND
    ============================================================
  */

  if (!group) {
    return (
      <main
        className="product-details-page"
        dir="rtl"
      >
        <div className="container no-products">

          <div>🍯</div>

          <h2>
            المنتج غير موجود
          </h2>

          <Link
            to="/products"
            className="primary-btn"
          >
            العودة للمنتجات
          </Link>

        </div>
      </main>
    );
  }

  /*
    ============================================================
    REVIEWS
    ============================================================
  */

  const reviews =
    details?.reviews || [];

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum +
              Number(
                review.rating || 0
              ),
            0
          ) / reviews.length
        ).toFixed(1)
      : "5.0";

  /*
    ============================================================
    FAQ
    ============================================================
  */

  const faqItems = [
    {
      question:
        "ما هي الأوزان المتاحة؟",

      answer:
        "الأوزان المتاحة تختلف حسب المنتج، ويمكنك اختيار الوزن المناسب لك من الخيارات الموجودة في صفحة المنتج."
    },

    {
      question:
        "هل يمكنني تغيير الكمية بعد اختيار الوزن؟",

      answer:
        "نعم، يمكنك زيادة أو تقليل الكمية من خلال أزرار الكمية قبل إضافة المنتج إلى السلة."
    },

    {
      question:
        "متى يتم تجهيز الطلب؟",

      answer:
        "يتم تجهيز الطلب بعد تأكيده، ثم يتم التنسيق معك بشأن عملية التوصيل."
    },

    {
      question:
        "هل يوجد توصيل؟",

      answer:
        "نعم، تتوفر خدمة التوصيل، ويتم احتساب تكلفة التوصيل حسب عنوان الطلب ومنطقة التوصيل."
    },

    {
      question:
        "هل يمكن استبدال أو إرجاع المنتج؟",

      answer:
        "يمكن طلب الاستبدال أو الإرجاع وفقًا لسياسة الاستبدال والاسترجاع الخاصة ببيرنا فودز وحالة المنتج عند استلامه."
    },

    {
      question:
        "كيف يمكنني متابعة طلبي؟",

      answer:
        "يمكنك متابعة حالة طلبك من خلال صفحة تتبع الطلب باستخدام بيانات الطلب الخاصة بك."
    },
  ];

  /*
    ============================================================
    TOGGLE FAQ
    ============================================================
  */

  function toggleFaq(index) {
    setOpenFaq((current) =>
      current === index
        ? null
        : index
    );
  }

  /*
    ============================================================
    RENDER
    ============================================================
  */

  return (
    <main
      className="product-details-page"
      dir="rtl"
    >
      <div className="container">

        {/* ====================================================
            BREADCRUMB
            ==================================================== */}

        <div className="breadcrumb">

          <Link to="/">
            الرئيسية
          </Link>

          <span>←</span>

          <Link to="/products">
            المنتجات
          </Link>

          <span>←</span>

          <strong>
            {group.name}
          </strong>

        </div>

        {/* ====================================================
            PRODUCT HERO
            ==================================================== */}

        <section className="product-details">

          {/* ==================================================
              PRODUCT IMAGE
              ================================================== */}

          <div className="product-details-image">

            <div className="product-details-image-icon">

              {group.image ? (
                <img
                  src={group.image}
                  alt={group.name}
                  loading="lazy"
                  style={{
                    width: "86%",
                    height: "86%",
                    objectFit: "contain",
                    objectPosition: "center",
                    display: "block",
                    margin: "auto",
                    mixBlendMode: "multiply",
                  }}
                />
              ) : (
                <span>
                  {group.icon || "🍯"}
                </span>
              )}

            </div>

            <small>
              صورة المنتج
            </small>

          </div>

          {/* ==================================================
              PRODUCT INFORMATION
              ================================================== */}

          <div className="product-details-info">

            <span className="product-category">
              {group.category}
            </span>

            <h1>
              {group.name}
            </h1>

            {details?.tagline && (
              <p className="product-tagline">
                {details.tagline}
              </p>
            )}

            {/* ==================================================
                RATING
                ================================================== */}

            <div className="product-rating-summary">

              <div className="product-rating-stars">

                {"★".repeat(
                  Math.round(
                    Number(
                      averageRating
                    )
                  )
                )}

                <span className="rating-number">
                  {averageRating}
                </span>

              </div>

              <span className="rating-count">
                ({reviews.length} آراء)
              </span>

            </div>

            {/* ==================================================
                DESCRIPTION
                ================================================== */}

            <p className="product-long-description">

              استمتع بمذاق{" "}
              {group.name}

              <br />

              واختر الوزن المناسب لك.

              <br />

              منتجات مختارة بعناية لتقدم لك
              تجربة مميزة في كل مرة.

            </p>

            {/* ==================================================
                HIGHLIGHTS
                ================================================== */}

            {details?.highlights?.length > 0 && (
              <div className="product-highlights">

                {details.highlights.map(
                  (item, index) => (
                    <div
                      className="product-highlight"
                      key={`${item}-${index}`}
                    >

                      <span>
                        ✓
                      </span>

                      <p>
                        {item}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}

            {/* ==================================================
                WEIGHT
                ================================================== */}

            {weights.length > 0 && (
              <div className="variant-selector">

                <div className="variant-selector-header">

                  <strong>
                    الوزن
                  </strong>

                  <span>
                    {selectedVariant?.weight ||
                      "-"}
                  </span>

                </div>

                <div className="variant-options">

                  {weights.map(
                    ([grams, label]) => {

                      const isSelected =
                        Number(
                          selectedWeight
                        ) ===
                        Number(grams);

                      return (
                        <button
                          key={grams}
                          type="button"
                          className={
                            isSelected
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            chooseWeight(
                              grams
                            )
                          }
                        >
                          {label}
                        </button>
                      );
                    }
                  )}

                </div>

              </div>
            )}

            {/* ==================================================
                PRICE
                ================================================== */}

            <div className="product-price">

              {selectedVariant
                ? `${(
                    Number(
                      selectedVariant.price
                    ) * quantity
                  ).toFixed(2)} ج.م`
                : "—"}

            </div>

            {/* ==================================================
                QUANTITY
                ================================================== */}

            <div className="quantity-box">

              <strong>
                الكمية
              </strong>

              <div className="quantity-controls">

                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  aria-label="تقليل الكمية"
                >
                  −
                </button>

                <strong>
                  {quantity}
                </strong>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  aria-label="زيادة الكمية"
                >
                  +
                </button>

              </div>

            </div>

            {/* ==================================================
                ADD TO CART
                ==================================================

                مهم:
                الزر أصبح مباشرة بعد الكمية.
                ================================================== */}

            <button
              type="button"
              className="add-product-btn"
              onClick={
                handleAddToCart
              }
              disabled={
                !selectedVariant
              }
            >
              {added
                ? "✓ تمت الإضافة للسلة"
                : "أضف للسلة"}
            </button>

            {/* ==================================================
                ORDER INFORMATION
                ==================================================

                التوصيل وتجهيز الطلب والاستبدال
                أصبحوا بعد زر أضف للسلة.
                ================================================== */}

            <div className="product-order-info">

              <div className="product-order-info-item">

                <span>
                  🚚
                </span>

                <div>

                  <strong>
                    التوصيل
                  </strong>

                  <p>
                    تكلفة التوصيل تحسب حسب
                    منطقة التوصيل.
                  </p>

                </div>

              </div>

              <div className="product-order-info-item">

                <span>
                  📦
                </span>

                <div>

                  <strong>
                    تجهيز الطلب
                  </strong>

                  <p>
                    يتم تجهيز طلبك بعناية
                    قبل التوصيل.
                  </p>

                </div>

              </div>

              <div className="product-order-info-item">

                <span>
                  ↩️
                </span>

                <div>

                  <strong>
                    الاستبدال والاسترجاع
                  </strong>

                  <p>
                    وفقًا لسياسة الاستبدال
                    والاسترجاع.
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                GO TO CART
                ================================================== */}

            {added && (
              <Link
                to="/checkout"
                className="product-whatsapp"
              >
                الانتقال للسلة ←
              </Link>
            )}

          </div>

        </section>

        {/* ======================================================
            HEALTH BENEFITS
            ====================================================== */}

        {details?.healthBenefits?.length >
          0 && (
          <section className="product-content-section health-benefits-section">

            <div className="section-heading">

              <span className="section-eyebrow">
                BERNA FOODS
              </span>

              <h2>
                فوائد وخصائص المنتج
              </h2>

              <p>
                تعرف على أبرز الخصائص الغذائية
                المرتبطة بهذا النوع من المنتجات.
              </p>

            </div>

            <div className="health-benefits-grid">

              {details.healthBenefits.map(
                (benefit, index) => (
                  <article
                    className="health-benefit-card"
                    key={`${benefit.title}-${index}`}
                  >

                    <div className="health-benefit-icon">
                      {benefit.icon}
                    </div>

                    <div>

                      <h3>
                        {benefit.title}
                      </h3>

                      <p>
                        {benefit.text}
                      </p>

                    </div>

                  </article>
                )
              )}

            </div>

            <div className="health-disclaimer">

              <span>
                ℹ️
              </span>

              <p>
                المعلومات المذكورة هنا معلومات
                غذائية عامة وليست بديلاً عن
                الاستشارة الطبية أو علاجًا لحالة
                مرضية محددة.
              </p>

            </div>

          </section>
        )}

        {/* ======================================================
            CUSTOMER REVIEWS
            ====================================================== */}

        {reviews.length > 0 && (
          <section className="product-content-section reviews-section">

            <div className="section-heading">

              <span className="section-eyebrow">
                CUSTOMER REVIEWS
              </span>

              <h2>
                آراء العملاء
              </h2>

              <p>
                تجارب وآراء عملاء بيرنا.
              </p>

            </div>

            <div className="reviews-summary">

              <div className="reviews-score">

                <strong>
                  {averageRating}
                </strong>

                <div className="reviews-score-stars">
                  ★★★★★
                </div>

                <span>
                  متوسط التقييم
                </span>

              </div>

              <div className="reviews-count-box">

                <strong>
                  {reviews.length}
                </strong>

                <span>
                  مراجعة
                </span>

              </div>

            </div>

            <div className="reviews-grid">

              {reviews.map(
                (review, index) => (
                  <article
                    className="review-card"
                    key={`${review.name}-${index}`}
                  >

                    <div className="review-header">

                      <div className="review-avatar">
                        {review.name
                          ?.charAt(0) ||
                          "ع"}
                      </div>

                      <div>

                        <strong>
                          {review.name}
                        </strong>

                        <div className="review-stars">

                          {"★".repeat(
                            Number(
                              review.rating ||
                                5
                            )
                          )}

                          {"☆".repeat(
                            5 -
                              Number(
                                review.rating ||
                                  5
                              )
                          )}

                        </div>

                      </div>

                    </div>

                    <p>
                      "{review.text}"
                    </p>

                    <span className="verified-review">
                      ✓ تجربة عميل
                    </span>

                  </article>
                )
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            FAQ
            ====================================================== */}

        <section className="product-content-section faq-section">

          <div className="section-heading">

            <span className="section-eyebrow">
              BERNA FOODS
            </span>

            <h2>
              الأسئلة الشائعة
            </h2>

            <p>
              كل ما تحتاج معرفته قبل إتمام طلبك.
            </p>

          </div>

          <div className="faq-list">

            {faqItems.map(
              (item, index) => {

                const isOpen =
                  openFaq === index;

                return (
                  <article
                    className={`faq-item ${
                      isOpen
                        ? "faq-item-open"
                        : ""
                    }`}
                    key={item.question}
                  >

                    <button
                      type="button"
                      className="faq-question"
                      onClick={() =>
                        toggleFaq(index)
                      }
                      aria-expanded={
                        isOpen
                      }
                    >

                      <span>
                        {item.question}
                      </span>

                      <span className="faq-icon">
                        {isOpen
                          ? "−"
                          : "+"}
                      </span>

                    </button>

                    {isOpen && (
                      <div className="faq-answer">

                        <p>
                          {item.answer}
                        </p>

                      </div>
                    )}

                  </article>
                );
              }
            )}

          </div>

        </section>

        {/* ======================================================
            ORDER TRUST
            ====================================================== */}

        <section className="product-trust-section">

          <div className="product-trust-grid">

            <div className="product-trust-item">

              <span>
                🔒
              </span>

              <div>

                <strong>
                  طلب آمن
                </strong>

                <p>
                  بيانات طلبك يتم التعامل
                  معها بأمان.
                </p>

              </div>

            </div>

            <div className="product-trust-item">

              <span>
                ❤️
              </span>

              <div>

                <strong>
                  اختيار بعناية
                </strong>

                <p>
                  منتجات مختارة بعناية
                  لتجربة أفضل.
                </p>

              </div>

            </div>

            <div className="product-trust-item">

              <span>
                🚚
              </span>

              <div>

                <strong>
                  توصيل للباب
                </strong>

                <p>
                  نوصل طلبك إلى العنوان
                  المحدد في الطلب.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            RELATED PRODUCTS
            ====================================================== */}

        {relatedProducts.length > 0 && (
          <section className="related-products-section">

            <div className="related-products-heading">

              <div>

                <span className="section-eyebrow">
                  BERNA FOODS
                </span>

                <h2>
                  منتجات قد تعجبك
                </h2>

                <p>
                  منتجات أخرى قد تناسب اختيارك.
                </p>

              </div>

            </div>

            <div className="related-products-grid">

              {relatedProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}

            </div>

          </section>
        )}

        {/* ======================================================
            BACK TO PRODUCTS
            ====================================================== */}

        <div className="product-details-back">

          <Link
            to="/products"
            className="back-to-products"
          >
            ← العودة إلى المنتجات
          </Link>

        </div>

      </div>
    </main>
  );
}