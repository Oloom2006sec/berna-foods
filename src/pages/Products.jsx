import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { groupProducts } from "../utils/productGroups";
import { useStoreSettings } from "../context/StoreSettingsContext";
import { getPublicProductSales } from "../services/productSalesService";
import "./products-styles.css";

export default function Products() {
  useStoreSettings();
  const [searchParams] = useSearchParams();

  const initialSearch =
    searchParams.get("search") || "";

  const [search, setSearch] =
    useState(initialSearch);

  const [category, setCategory] =
    useState("الكل");

  const [sortBy, setSortBy] =
    useState("featured");

  const [productSales, setProductSales] =
    useState([]);

  const [salesError, setSalesError] =
    useState(false);

  useEffect(() => {
    let active = true;

    getPublicProductSales()
      .then((sales) => {
        if (active) {
          setProductSales(sales);
        }
      })
      .catch((error) => {
        console.error("Load public product sales error:", error);
        if (active) {
          setSalesError(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  /*
    ============================================================
    GROUPED PRODUCTS
    ============================================================
  */

  const groupedProducts = groupProducts();

  /*
    ============================================================
    CATEGORIES
    ============================================================
  */

  const categories = useMemo(() => {
    return [
      "الكل",
      ...new Set(
        groupedProducts.map(
          (product) => product.category
        )
      ),
    ];
  }, [groupedProducts]);

  /*
    ============================================================
    FILTER PRODUCTS
    ============================================================
  */

  const visibleProducts = useMemo(() => {
    const normalizedSearch =
      search.trim();

    const salesByName = new Map(
      productSales.map((item) => [
        item.product_name,
        item,
      ])
    );

    const filteredProducts = groupedProducts.filter(
      (product) => {
        const matchesSearch =
          !normalizedSearch ||
          product.name.includes(
            normalizedSearch
          ) ||
          product.category.includes(
            normalizedSearch
          );

        const matchesCategory =
          category === "الكل" ||
          product.category ===
            category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );

    if (sortBy === "featured") {
      return filteredProducts;
    }

    return [...filteredProducts].sort((a, b) => {
      const salesA = salesByName.get(a.name);
      const salesB = salesByName.get(b.name);

      if (sortBy === "best-selling") {
        return (
          Number(salesB?.units_sold || 0) -
            Number(salesA?.units_sold || 0) ||
          a.name.localeCompare(b.name, "ar")
        );
      }

      if (sortBy === "most-ordered") {
        return (
          Number(salesB?.order_count || 0) -
            Number(salesA?.order_count || 0) ||
          a.name.localeCompare(b.name, "ar")
        );
      }

      if (sortBy === "price-ascending") {
        return a.minPrice - b.minPrice;
      }

      if (sortBy === "price-descending") {
        return b.maxPrice - a.maxPrice;
      }

      return a.name.localeCompare(b.name, "ar");
    });
  }, [
    groupedProducts,
    search,
    category,
    productSales,
    sortBy,
  ]);

  /*
    ============================================================
    RENDER
    ============================================================
  */

  return (
    <main
      className="products-page"
      dir="rtl"
    >
      <div className="container">

        {/* ====================================================
            PAGE HEADER
            ==================================================== */}

        <header className="products-page-header">

          <span className="eyebrow">
            BERNA FOODS
          </span>

          <h1>
            منتجاتنا
          </h1>

          <p>
            اختار المنتج، وبعدها اختار
            الوزن والكمية.
          </p>

        </header>

        {/* ====================================================
            PRODUCTS TOOLBAR
            ==================================================== */}

        <section className="products-toolbar">

          {/* SEARCH */}

          <div className="search-box">

            <span aria-hidden="true">
              🔎
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ابحث عن منتج..."
              aria-label="البحث عن منتج"
            />

          </div>

          {/* CATEGORY FILTERS */}

          <div
            className="category-filters"
            aria-label="تصنيفات المنتجات"
          >

            {categories.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCategory(item)
                  }
                  aria-pressed={
                    category === item
                  }
                >
                  {item}
                </button>
              )
            )}

          </div>

        </section>

        <div className="products-sort-row">
          <label htmlFor="products-sort">
            ترتيب حسب
          </label>
          <select
            id="products-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
          >
            <option value="featured">الترتيب الافتراضي</option>
            <option value="best-selling">الأكثر مبيعًا</option>
            <option value="most-ordered">الأكثر طلبًا</option>
            <option value="price-ascending">السعر: من الأقل للأعلى</option>
            <option value="price-descending">السعر: من الأعلى للأقل</option>
            <option value="name">الاسم: أبجديًا</option>
          </select>
        </div>

        {salesError && sortBy !== "featured" && (
          <p className="products-sales-note" role="status">
            تعذر تحميل ترتيب المبيعات حاليًا؛ يمكنك استخدام ترتيب السعر أو الاسم.
          </p>
        )}

        {!salesError &&
          productSales.length === 0 &&
          (sortBy === "best-selling" ||
            sortBy === "most-ordered") && (
            <p className="products-sales-note" role="status">
              لا توجد بيانات مبيعات كافية لترتيب المنتجات بعد.
            </p>
          )}

        {/* ====================================================
            RESULT INFO
            ==================================================== */}

        <div className="products-result-info">

          <span>
            {visibleProducts.length}
          </span>

          {" "}منتج

        </div>

        {/* ====================================================
            PRODUCTS
            ==================================================== */}

        {visibleProducts.length > 0 ? (

          <div className="products-grid all-products-grid">

            {visibleProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              )
            )}

          </div>

        ) : (

          <div className="no-products">

            <div>
              🔎
            </div>

            <h2>
              مفيش منتجات مطابقة
            </h2>

            <p>
              جرب كلمة بحث مختلفة.
            </p>

          </div>

        )}

      </div>
    </main>
  );
}