import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { groupProducts } from "../utils/productGroups";
import "./products-styles.css";

export default function Products() {
  const [searchParams] = useSearchParams();

  const initialSearch =
    searchParams.get("search") || "";

  const [search, setSearch] =
    useState(initialSearch);

  const [category, setCategory] =
    useState("الكل");

  /*
    ============================================================
    GROUPED PRODUCTS
    ============================================================
  */

  const groupedProducts = useMemo(
    () => groupProducts(),
    []
  );

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

    return groupedProducts.filter(
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
  }, [
    groupedProducts,
    search,
    category,
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