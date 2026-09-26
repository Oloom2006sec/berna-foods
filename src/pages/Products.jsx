import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { groupProducts } from "../utils/productGroups";

export default function Products() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("الكل");

  const groupedProducts = useMemo(() => groupProducts(), []);
  const categories = [
    "الكل",
    ...new Set(groupedProducts.map((product) => product.category)),
  ];

  const visibleProducts = groupedProducts.filter((product) => {
    const matchesSearch =
      !search.trim() ||
      product.name.includes(search.trim()) ||
      product.category.includes(search.trim());

    const matchesCategory =
      category === "الكل" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="products-page" dir="rtl">
      <div className="container">
        <header className="products-page-header">
          <span className="eyebrow">BERNA FOODS</span>
          <h1>منتجاتنا</h1>
          <p>اختار المنتج الأول، وبعدها اختار الوزن ونوع العبوة والكمية.</p>
        </header>

        <section className="products-toolbar">
          <div className="search-box">
            <span>🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن منتج..."
              aria-label="البحث عن منتج"
            />
          </div>

          <div className="category-filters">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="products-result-info">
          {visibleProducts.length} منتج
        </div>

        {visibleProducts.length ? (
          <div className="products-grid all-products-grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <div>🔎</div>
            <h2>مفيش منتجات مطابقة</h2>
            <p>جرب كلمة بحث مختلفة.</p>
          </div>
        )}
      </div>
    </main>
  );
}
