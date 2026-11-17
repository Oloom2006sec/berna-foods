import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { groupProducts } from "../utils/productGroups";
import { getProductPopularity } from "../utils/productPopularity";
import { useStoreSettings } from "../context/StoreSettingsContext";
import "./products-styles.css";

const POPULARITY_SORT_BAND_SIZE = 20;

function getRandomRankingScore(productId, sortBy, seed) {
  const value = `${sortBy}:${seed}:${productId}`;
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function isPriorityHoney(product) {
  return (
    product.category === "عسل النحل" ||
    product.name.includes("عسل")
  );
}

export default function Products() {
  useStoreSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [category, setCategory] =
    useState("الكل");

  const [sortBy, setSortBy] =
    useState("featured");

  const [rankingSeed, setRankingSeed] =
    useState(() => Math.random());

  useEffect(() => {
    if (sortBy !== "best-selling" && sortBy !== "most-ordered") {
      return undefined;
    }

    let timerId;
    const scheduleReshuffle = () => {
      timerId = window.setTimeout(() => {
        setRankingSeed(Math.random());
        scheduleReshuffle();
      }, 15000 + Math.floor(Math.random() * 15001));
    };

    scheduleReshuffle();
    return () => window.clearTimeout(timerId);
  }, [sortBy]);

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

    if (
      sortBy === "featured" ||
      sortBy === "best-selling" ||
      sortBy === "most-ordered"
    ) {
      if (sortBy === "featured") return filteredProducts;

      const popularityById = new Map(
        filteredProducts.map((product) => [
          product.id,
          getProductPopularity(product.id, {
            category: product.category,
            productName: product.name,
            kind: "product",
          }),
        ])
      );
      const prioritizeHoney =
        getRandomRankingScore("honey-priority", sortBy, rankingSeed) % 5 !== 0;

      return [...filteredProducts].sort(
        (a, b) => {
          const popularityBandDifference =
            Math.floor(popularityById.get(b.id) / POPULARITY_SORT_BAND_SIZE) -
            Math.floor(popularityById.get(a.id) / POPULARITY_SORT_BAND_SIZE);
          if (popularityBandDifference !== 0) {
            return popularityBandDifference;
          }

          if (prioritizeHoney && isPriorityHoney(a) !== isPriorityHoney(b)) {
            return isPriorityHoney(a) ? -1 : 1;
          }

          return (
            getRandomRankingScore(a.id, sortBy, rankingSeed) -
            getRandomRankingScore(b.id, sortBy, rankingSeed)
          );
        }
      );
    }

    return [...filteredProducts].sort((a, b) => {
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
    sortBy,
    rankingSeed,
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
              onChange={(event) => {
                const nextSearch = event.target.value;
                const nextParams = new URLSearchParams(searchParams);

                if (nextSearch) {
                  nextParams.set("search", nextSearch);
                } else {
                  nextParams.delete("search");
                }

                setSearchParams(nextParams, { replace: true });
              }}
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
            onChange={(event) => {
              const nextSort = event.target.value;
              setSortBy(nextSort);
              if (nextSort === "best-selling" || nextSort === "most-ordered") {
                setRankingSeed(Math.random());
              }
            }}
          >
            <option value="featured">الترتيب الافتراضي</option>
            <option value="best-selling">الأكثر مبيعًا</option>
            <option value="most-ordered">الأكثر طلبًا</option>
            <option value="price-ascending">السعر: من الأقل للأعلى</option>
            <option value="price-descending">السعر: من الأعلى للأقل</option>
            <option value="name">الاسم: أبجديًا</option>
          </select>
        </div>

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