import "./index.css";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Header from "./components/Header";
import ProductCard from "./components/ProductCard";

import ProductDetails from "./pages/ProductDetails";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import OrderTracking from "./pages/OrderTracking";

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/AdminRoute";
import AdminHeader from "./components/AdminHeader";

import { CartProvider } from "./context/CartContext";
import { groupProducts } from "./utils/productGroups";

/* =========================================================
   HOME
========================================================= */

function Home() {
  const groupedProducts = groupProducts();

  return (
    <main dir="rtl">

      {/* ================= HERO ================= */}

      <section className="hero">
        <div className="container hero-inner">

          <div className="hero-content">

            <span className="eyebrow">
              أهلاً بيك في بيرنا فوودز 🍯
            </span>

            <h1>
              طعم تحبه...
              <br />
              وتجربة تستحق
              <br />
              <span>الثقة</span>
            </h1>

            <p>
              اكتشف مجموعة مختارة من عسل النحل
              ومنتجات النحل، بالإضافة إلى العسل
              الأسود والطحينة.
            </p>

            <div className="hero-actions">

              <a
                href="/products"
                className="primary-btn"
              >
                تسوق الآن
              </a>

              <a
                href="#categories"
                className="secondary-btn"
              >
                اكتشف منتجاتنا
              </a>

            </div>

          </div>

          <div className="hero-visual">

            <div className="hero-product-card">

              <div className="hero-product-image">
  <img
    src="/images/products/berna_honey_mountain_herbs_FINAL.webp"
    alt="عسل بيرنا"
  />
</div>

              <span>
                BERNA
              </span>

              <strong>
                Natural Honey
              </strong>

              <small>
                طعم من الطبيعة
              </small>

            </div>

            <div className="hero-floating-card hero-card-top">
  <img
    src="/images/products/berna_honey_almawleh_jar.webp"
    alt="عسل الموالح"
  />

  <div>
    <strong>عسل الموالح</strong>
    <small>الأكثر طلباً</small>
  </div>
</div>

            <div className="hero-floating-card hero-card-bottom">
  <img
    src="/images/products/berna_honey_nuts_jar.webp"
    alt="عسل بالمكسرات"
  />

  <div>
    <strong>بالمكسرات</strong>
    <small>اختيار مميز</small>
  </div>
</div>

          </div>

        </div>
      </section>

      {/* ================= CATEGORIES ================= */}

      <section
        className="categories-section"
        id="categories"
      >
        <div className="container">

          <div className="section-title">

            <span className="eyebrow">
              اكتشف بيرنا
            </span>

            <h2>
              اختار اللي يناسبك
            </h2>

            <p>
              مجموعة متنوعة لكل ذوق ولكل سفرة.
            </p>

          </div>

          <div className="categories-grid">

            <a
              href="/products?search=عسل"
              className="category-card"
            >
              <span>🍯</span>

              <strong>
                عسل النحل
              </strong>

              <small>
                موالح، برسيم، حبة البركة والمزيد
              </small>
            </a>

            <a
              href="/products?search=منتجات النحل"
              className="category-card"
            >
              <span>🐝</span>

              <strong>
                منتجات النحل
              </strong>

              <small>
                شمع العسل وحبوب اللقاح
              </small>
            </a>

            <a
              href="/products?search=منتجات مصرية"
              className="category-card"
            >
              <span>🖤</span>

              <strong>
                منتجات مصرية
              </strong>

              <small>
                العسل الأسود والطحينة
              </small>
            </a>

            <a
              href="/products"
              className="category-card"
            >
              <span>🎁</span>

              <strong>
                الباقات والهدايا
              </strong>

              <small>
                اختيارات مناسبة لكل مناسبة
              </small>
            </a>

          </div>

        </div>
      </section>

      {/* ================= PRODUCTS ================= */}

      <section
        className="products-section"
        id="products"
      >
        <div className="container">

          <div className="section-title">

            <span className="eyebrow">
              منتجاتنا
            </span>

            <h2>
              الأكثر طلباً
            </h2>

            <p>
              اختيارات مميزة من منتجات بيرنا.
            </p>

          </div>

          <div className="products-grid">

            {groupedProducts
              .slice(0, 4)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

          </div>

          <div className="products-more">

            <a
              href="/products"
              className="outline-btn"
            >
              عرض كل المنتجات
            </a>

          </div>

        </div>
      </section>

      {/* ================= WHY BERNA ================= */}

      <section
        className="why-berna"
        id="about"
      >
        <div className="container why-berna-inner">

          <div className="why-content">

            <span className="eyebrow">
              WHY BERNA
            </span>

            <h2>
              مش مجرد منتج...
              <br />
              <span>
                دي تجربة.
              </span>
            </h2>

            <p>
              هدفنا إن تجربتك تبدأ من أول مرة تشوف
              فيها المنتج وتستمر بعد ما يوصل لباب بيتك.
            </p>

          </div>

          <div className="why-grid">

            <div className="why-card">

              <span>
                ✓
              </span>

              <h3>
                معلومات واضحة
              </h3>

              <p>
                تعرف كل تفاصيل المنتج قبل ما تشتري.
              </p>

            </div>

            <div className="why-card">

              <span>
                ✓
              </span>

              <h3>
                اختيارات متنوعة
              </h3>

              <p>
                أنواع ومنتجات تناسب أذواق مختلفة.
              </p>

            </div>

            <div className="why-card">

              <span>
                ✓
              </span>

              <h3>
                تجربة سهلة
              </h3>

              <p>
                اختار منتجاتك واطلبها بسهولة.
              </p>

            </div>

            <div className="why-card">

              <span>
                ✓
              </span>

              <h3>
                خدمة عملاء
              </h3>

              <p>
                لو محتاج مساعدة إحنا موجودين.
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* ================= BERNA BOXES ================= */}

      <section
        className="cta-section"
        id="offers"
      >
        <div className="container">

          <div className="cta-box">

            <div>

              <span className="eyebrow">
                BERNA BOXES 🎁
              </span>

              <h2>
                محتار تختار؟
              </h2>

              <p>
                جرب باقة تجمع لك أكتر من نوع
                في باقة واحدة واختيارات مناسبة ليك.
              </p>

            </div>

            <a
              href="/products"
              className="primary-btn"
            >
              اكتشف الباقات
            </a>

          </div>

        </div>
      </section>

      {/* ================= CONTACT ================= */}

      <section
        className="contact-section"
        id="contact"
      >
        <div className="container">

          <div className="contact-content">

            <span className="eyebrow">
              تواصل معنا
            </span>

            <h2>
              إحنا موجودين لخدمتك
            </h2>

            <p>
              عندك سؤال عن منتج أو طلب؟
              تواصل معانا ونساعدك.
            </p>

          </div>

        </div>
      </section>

      {/* ================= WHATSAPP ================= */}

      <a
        href="https://wa.me/201029222477"
        className="whatsapp"
        target="_blank"
        rel="noreferrer"
        aria-label="تواصل معنا على WhatsApp"
        title="تواصل معنا على WhatsApp"
      >

        <svg
          viewBox="0 0 32 32"
          className="whatsapp-icon-svg"
          aria-hidden="true"
        >

          <path
            d="M16 3.2C8.94 3.2 3.2 8.94 3.2 16c0 2.26.59 4.38 1.63 6.22L3.2 28.8l6.76-1.58A12.73 12.73 0 0 0 16 28.8c7.06 0 12.8-5.74 12.8-12.8S23.06 3.2 16 3.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />

          <path
            d="M12.2 10.4c-.25-.55-.52-.56-.76-.57h-.65c-.23 0-.6.09-.92.43-.32.34-1.2 1.17-1.2 2.85s1.23 3.31 1.4 3.54c.17.23 2.39 3.83 5.9 5.21 2.92 1.15 3.51.92 4.14.86.63-.06 2.04-.83 2.33-1.63.29-.8.29-1.49.2-1.63-.09-.14-.32-.23-.66-.4-.34-.17-2.04-1.01-2.35-1.13-.32-.11-.55-.17-.78.17-.23.34-.89 1.13-1.09 1.36-.2.23-.4.26-.74.09-.34-.17-1.43-.53-2.72-1.68-1.01-.9-1.69-2-1.89-2.34-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.78-1.87-1.08-2.56Z"
            fill="currentColor"
          />

        </svg>

      </a>

      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div className="container footer-grid">

          <div className="footer-brand">

            <strong>
              🍯 بيرنا
            </strong>

            <small>
              BERNA FOODS
            </small>

            <p>
              منتجات طبيعية وتجربة تستحق الثقة.
            </p>

          </div>

          <div className="footer-links">

            <h3>
              روابط سريعة
            </h3>

            <a href="/products">
              المنتجات
            </a>

            <a href="#offers">
              الباقات
            </a>

            <a href="#about">
              عن بيرنا
            </a>

          </div>

          <div className="footer-links">

            <h3>
              تواصل معنا
            </h3>

            <a
              href="https://wa.me/201029222477"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>

            <a href="#">
              Facebook
            </a>

            <a href="#">
              Instagram
            </a>

            <a href="#">
              TikTok
            </a>

          </div>

        </div>

        <div className="footer-bottom">

          © {new Date().getFullYear()} BERNA FOODS —
          جميع الحقوق محفوظة

        </div>

      </footer>

    </main>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <CartProvider>

      <BrowserRouter>

        <Routes>

          {/* =================================================
              STORE
          ================================================= */}

          <Route
            path="/"
            element={
              <>
                <Header />
                <Home />
              </>
            }
          />

          <Route
            path="/products"
            element={
              <>
                <Header />
                <Products />
              </>
            }
          />

          <Route
            path="/products/:id"
            element={
              <>
                <Header />
                <ProductDetails />
              </>
            }
          />

          <Route
            path="/wishlist"
            element={
              <>
                <Header />
                <Wishlist />
              </>
            }
          />

          <Route
            path="/checkout"
            element={
              <>
                <Header />
                <Checkout />
              </>
            }
          />

          <Route
            path="/track-order"
            element={
              <>
                <Header />
                <OrderTracking />
              </>
            }
          />

          {/* =================================================
              ADMIN LOGIN
          ================================================= */}

          <Route
            path="/admin/login"
            element={
              <AdminLogin />
            }
          />

          {/* =================================================
              PROTECTED ADMIN
          ================================================= */}

          <Route element={<AdminRoute />}>

            {/* ADMIN DASHBOARD */}

            <Route
              path="/admin"
              element={
                <>
                  <AdminHeader />
                  <AdminDashboard />
                </>
              }
            />

            {/* ADMIN ORDERS */}

            <Route
              path="/admin/orders"
              element={
                <>
                  <AdminHeader />
                  <AdminOrders />
                </>
              }
            />

          </Route>

        </Routes>

      </BrowserRouter>

    </CartProvider>
  );
}