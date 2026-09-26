import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import {
  findVariant,
  getProductGroupByParam,
} from "../utils/productGroups";

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

  /*
    ============================
    Available weights
    ============================
  */

  const weights = useMemo(() => {
    if (!group?.variants) return [];

    return [
      ...new Map(
        group.variants.map((variant) => [
          Number(variant.weightGrams),
          variant.weight,
        ])
      ).entries(),
    ];
  }, [group]);

  /*
    ============================
    Available packages
    ============================
  */

  const packages = useMemo(() => {
    if (!group?.variants) return [];

    return [
      ...new Set(
        group.variants
          .map((variant) => variant.packageType)
          .filter(Boolean)
      ),
    ];
  }, [group]);

  /*
    ============================
    Initial selection
    ============================
  */

  const [selectedWeight, setSelectedWeight] = useState(
    () => group?.variants?.[0]?.weightGrams ?? ""
  );

  const [selectedPackage, setSelectedPackage] = useState(
    () => group?.variants?.[0]?.packageType ?? ""
  );

  /*
    ============================
    Selected Variant
    ============================
  */

  const selectedVariant = group
    ? findVariant(
        group.variants,
        selectedWeight,
        selectedPackage
      )
    : null;

  /*
    ============================
    Weight selection
    ============================
  */

  function chooseWeight(weightGrams) {
    const numericWeight = Number(weightGrams);

    setSelectedWeight(numericWeight);

    /*
      Check whether current package exists
      with the selected weight.
    */

    const compatible = group?.variants?.find(
      (variant) =>
        Number(variant.weightGrams) === numericWeight &&
        variant.packageType === selectedPackage
    );

    /*
      If current package doesn't exist for this weight,
      automatically select the first available package.
    */

    if (!compatible) {
      const firstForWeight = group?.variants?.find(
        (variant) =>
          Number(variant.weightGrams) === numericWeight
      );

      if (firstForWeight) {
        setSelectedPackage(firstForWeight.packageType || "");
      }
    }

    setAdded(false);
  }

  /*
    ============================
    Package selection
    ============================
  */

  function choosePackage(packageType) {
    setSelectedPackage(packageType);

    /*
      Check whether current weight exists
      with the selected package.
    */

    const compatible = group?.variants?.find(
      (variant) =>
        Number(variant.weightGrams) ===
          Number(selectedWeight) &&
        variant.packageType === packageType
    );

    /*
      If current weight doesn't exist,
      select the first available weight for this package.
    */

    if (!compatible) {
      const firstForPackage = group?.variants?.find(
        (variant) =>
          variant.packageType === packageType
      );

      if (firstForPackage) {
        setSelectedWeight(
          Number(firstForPackage.weightGrams)
        );
      }
    }

    setAdded(false);
  }

  /*
    ============================
    Add to Cart
    ============================
  */

  function handleAddToCart() {
    /*
      Never add a fallback variant.
      Only add the exact selected SKU.
    */

    if (!selectedVariant) {
      return;
    }

    addToCart({
      ...selectedVariant,

      /*
        Explicitly keep the selected variant data.
      */

      quantity,

      sku: selectedVariant.sku,
      price: Number(selectedVariant.price),
      weight: selectedVariant.weight,
      weightGrams: Number(selectedVariant.weightGrams),
      packageType: selectedVariant.packageType,
    });

    setAdded(true);
  }

  /*
    ============================
    Product not found
    ============================
  */

  if (!group) {
    return (
      <main
        className="product-details-page"
        dir="rtl"
      >
        <div className="container no-products">
          <div>🍯</div>

          <h2>المنتج غير موجود</h2>

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
    ============================
    Render
    ============================
  */

  return (
    <main
      className="product-details-page"
      dir="rtl"
    >
      <div className="container">

        {/* Breadcrumb */}

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

        <div className="product-details">

          {/* Product Image */}

          <div className="product-details-image">
            <span>
              {group.icon || "🍯"}
            </span>

            <small>
              الصورة هنضيفها بعدين
            </small>
          </div>

          {/* Product Information */}

          <div className="product-details-info">

            <span className="product-category">
              {group.category}
            </span>

            <h1>
              {group.name}
            </h1>

            <p className="product-long-description">
              اختار المواصفة المناسبة لك،
              والسعر بيتغير تلقائيًا حسب الوزن
              ونوع العبوة.
            </p>

            {/* ================= WEIGHT ================= */}

            {weights.length > 0 && (
              <div className="variant-selector">

                <div className="variant-selector-header">
                  <strong>
                    الوزن
                  </strong>

                  <span>
                    {selectedVariant?.weight || "-"}
                  </span>
                </div>

                <div className="variant-options">

                  {weights.map(
                    ([grams, label]) => {

                      const available =
                        group.variants.some(
                          (variant) =>
                            Number(
                              variant.weightGrams
                            ) === Number(grams)
                        );

                      return (
                        <button
                          key={grams}
                          type="button"
                          disabled={!available}
                          className={
                            Number(
                              selectedWeight
                            ) === Number(grams)
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            chooseWeight(grams)
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

            {/* ================= PACKAGE ================= */}

            {packages.length > 1 && (
              <div className="variant-selector">

                <div className="variant-selector-header">
                  <strong>
                    نوع العبوة
                  </strong>

                  <span>
                    {selectedVariant?.packageType ||
                      "-"}
                  </span>
                </div>

                <div className="variant-options">

                  {packages.map(
                    (packageType) => {

                      const available =
                        group.variants.some(
                          (variant) =>
                            variant.packageType ===
                              packageType &&
                            Number(
                              variant.weightGrams
                            ) ===
                              Number(
                                selectedWeight
                              )
                        );

                      return (
                        <button
                          key={packageType}
                          type="button"
                          disabled={!available}
                          className={
                            selectedPackage ===
                            packageType
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            choosePackage(
                              packageType
                            )
                          }
                        >
                          {packageType}
                        </button>
                      );
                    }
                  )}

                </div>
              </div>
            )}

            {/* ================= SELECTED VARIANT ================= */}

            <div className="selected-variant-box">

              <span>
                الاختيار الحالي
              </span>

              <strong>
                {selectedVariant
                  ? `${selectedVariant.weight} — ${
                      selectedVariant.packageType ||
                      "عبوة"
                    }`
                  : "اختر المواصفة"}
              </strong>

              {selectedVariant?.sku && (
                <small>
                  SKU: {selectedVariant.sku}
                </small>
              )}

            </div>

            {/* ================= PRICE ================= */}

            <div className="product-price">
              {selectedVariant
                ? `${Number(
                    selectedVariant.price
                  ).toFixed(2)} ج.م`
                : "—"}
            </div>

            {/* ================= QUANTITY ================= */}

            <div className="quantity-box">

              <strong>
                الكمية
              </strong>

              <div className="quantity-controls">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                    )
                  }
                >
                  −
                </button>

                <strong>
                  {quantity}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        value + 1
                    )
                  }
                >
                  +
                </button>

              </div>
            </div>

            {/* ================= ADD TO CART ================= */}

            <button
              type="button"
              className="add-product-btn"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
            >
              {added
                ? "✓ تمت الإضافة للسلة"
                : "أضف للسلة"}
            </button>

            {added && (
              <Link
                to="/checkout"
                className="product-whatsapp"
              >
                الانتقال للسلة ←
              </Link>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}