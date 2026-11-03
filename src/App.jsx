import { useEffect, useState } from "react";
import "./index.css";

import {
  BrowserRouter,
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Header from "./components/Header";
import CampaignPopup from "./components/CampaignPopup";
import HomeOfferCard from "./components/HomeOfferCard";
import PromoFlashShowcase from "./components/PromoFlashShowcase";
import BundleOffersSection from "./components/BundleOffersSection";
import ProductCard from "./components/ProductCard";

import ProductDetails from "./pages/ProductDetails";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import OrderTracking from "./pages/OrderTracking";

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminCatalog from "./pages/AdminCatalog";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/AdminRoute";
import AdminHeader from "./components/AdminHeader";

import { useStoreSettings } from "./context/StoreSettingsContext";
import { groupProducts } from "./utils/productGroups";
import { getProductDetails } from "./data/productDetails";
import { homePromotions } from "./data/homePromotions";
import "./berna-redesign.css";

/* =========================================================
   HOME
========================================================= */

function HomePage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const groupedProducts = groupProducts();
  const productByName = (name) =>
    groupedProducts.find((product) => product.name === name);
  const campaignProductNames = new Set(
    settings.productOffers
      .filter((offer) => Number(offer.discountPercent) > 0)
      .map((offer) => offer.productName)
  );
  const productOutsideCampaign = (product) =>
    product && !campaignProductNames.has(product.name);
  const featuredProducts = [
    "عسل الموالح",
    "عسل حبة البركة",
    "زيت الزيتون",
    "دبس الرمان",
  ]
    .map(productByName)
    .filter(productOutsideCampaign);
  const promotionProducts = settings.productOffers
    .filter((offer) => Number(offer.discountPercent) > 0)
    .map((offer) => ({
      ...offer,
      product: productByName(offer.productName),
    }))
    .filter((offer) => offer.product);
  const honeyProducts = [
    "عسل الموالح",
    "عسل حبة البركة",
    "عسل البرسيم",
    "عسل سدر مصري",
    "عسل أعشاب جبلية",
    "عسل بردقوش",
    "عسل أعشاب برية",
    "عسل بالمكسرات",
  ]
    .map(productByName)
    .filter(Boolean);
  const honeyCategories = [
    { id: "all", label: "كل الأنواع", products: honeyProducts },
    {
    id: "classic",
    label: "العسل السادة",
    products: [
      "عسل الموالح",
      "عسل حبة البركة",
      "عسل البرسيم",
      "عسل سدر مصري",
    ].map(productByName).filter(Boolean),
    },
    {
    id: "herbs",
    label: "بالأعشاب",
    products: [
    "عسل أعشاب جبلية",
    "عسل بردقوش",
    "عسل أعشاب برية",
    ].map(productByName).filter(Boolean),
    },
    {
    id: "blends",
    label: "بالمكسرات",
    products: ["عسل بالمكسرات"].map(productByName).filter(Boolean),
    },
  ];
  const pantryProducts = [
    "زيت الزيتون",
    "دبس الرمان",
    "خل التفاح",
    "صويا صوص",
    "طحينة",
    "عسل أسود",
    "مختوم فلسطيني",
    "شمع عسل",
  ]
    .map(productByName)
    .filter(Boolean);
  const benefitLinks = [
    {
      title: "أنواع العسل",
      description: "العسل السادة، وبالأعشاب، وبالمكسرات.",
      productName: "عسل البرسيم",
      href: "#honey",
    },
    {
      title: "منتجات المائدة",
      description: "اختيارات متنوعة لمطبخك.",
      productName: "طحينة",
      href: "#pantry",
    },
  ];
  const [selectedHoneyCategory, setSelectedHoneyCategory] = useState("all");
  const activeHoneyCategory =
    hash === "#herbs"
      ? "herbs"
      : hash === "#blends"
        ? "blends"
        : hash === "#honey"
          ? "all"
          : selectedHoneyCategory;
  const activeHoneyProducts =
    honeyCategories.find((category) => category.id === activeHoneyCategory)
      ?.products || honeyProducts;
  const [activePromoSlide, setActivePromoSlide] = useState(0);
  const promoSlide = homePromotions[activePromoSlide];
  const featuredReviewProductNames = [
    "عسل أعشاب جبلية",
    "زيت الزيتون",
    "دبس الرمان",
  ];
  const productReviews = groupedProducts.flatMap((product) =>
    (getProductDetails(product.name)?.reviews || []).map((review) => ({
      ...review,
      productName: product.name,
    }))
  );
  const customerReviews = featuredReviewProductNames
    .map((productName) =>
      productReviews.find((review) => review.productName === productName)
    )
    .filter(Boolean);
  const averageReviewRating = productReviews.length
    ? (
        productReviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / productReviews.length
      ).toFixed(1)
    : null;

  return (
    <main className="home-page" dir="rtl">
      <CampaignPopup />

      {/* ================= CAMPAIGN HERO ================= */}
      <section className="home-promotion-carousel home-promotion-hero" aria-label="عروض ومختارات بيرنا">
        <div className="container">
          <div className={`home-promotion-banner tone-${promoSlide.tone}`}>
            <div className="home-promotion-copy">
              <span className="eyebrow">{promoSlide.eyebrow}</span>
              {promoSlide.offerBadge && (
                <span className="promo-offer-badge">{promoSlide.offerBadge}</span>
              )}
              <h1>{promoSlide.title}</h1>
              <p>{promoSlide.description}</p>
              <a href={promoSlide.href} className="primary-btn">
                {promoSlide.cta}
              </a>
            </div>
            {promoSlide.campaign ? (
              <PromoFlashShowcase
                offers={promotionProducts}
                bundles={settings.bundleOffers}
              />
            ) : (
              <img src={promoSlide.image} alt={promoSlide.alt} />
            )}
            <button
              type="button"
              className="promo-slide-arrow promo-slide-previous"
              aria-label="البانر السابق"
              onClick={() =>
                setActivePromoSlide(
                  (activePromoSlide - 1 + homePromotions.length) % homePromotions.length
                )
              }
            >
              ‹
            </button>
            <button
              type="button"
              className="promo-slide-arrow promo-slide-next"
              aria-label="البانر التالي"
              onClick={() =>
                setActivePromoSlide(
                  (activePromoSlide + 1) % homePromotions.length
                )
              }
            >
              ›
            </button>
            <div className="promo-slide-dots" role="group" aria-label="بانرات بيرنا">
              {homePromotions.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`عرض ${slide.title}`}
                  aria-pressed={activePromoSlide === index}
                  className={activePromoSlide === index ? "selected" : ""}
                  onClick={() => setActivePromoSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <BundleOffersSection bundles={settings.bundleOffers} />

      <section
        className="home-benefits-section home-shop-shortcuts"
        aria-labelledby="home-benefits-title"
      >
        <div className="container">
          <div className="home-shop-heading">
            <span className="eyebrow">اختيارات بيرنا</span>
            <h2 id="home-benefits-title">تسوّق حسب ما تحب</h2>
            <p>اختار القسم المناسب، وشوف المنتجات والأوزان المتاحة.</p>
          </div>

          <nav className="home-shop-grid" aria-label="تسوّق حسب نوع المنتج">
            {benefitLinks.map((benefit) => {
              const product = productByName(benefit.productName);

              return (
                <a className="home-shop-card" key={benefit.title} href={benefit.href}>
                  <span className="home-shop-card-image">
                    {product?.image ? (
                      <img src={product.image} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">🍯</span>
                    )}
                  </span>
                  <span className="home-shop-card-copy">
                    <strong>{benefit.title}</strong>
                    <small>{benefit.description}</small>
                  </span>
                  <b aria-hidden="true">←</b>
                </a>
              );
            })}
          </nav>
        </div>
      </section>

      <section
        className="home-deals-section"
        id="offers"
        aria-labelledby="home-deals-title"
      >
        <div className="container">
          <div className="home-deals-heading">
            <span className="eyebrow">عروض بيرنا</span>
            <h2 id="home-deals-title">عروض الجمعة البيضاء</h2>
            <p>اختيارات بيرنا بأسعار العروض المميزة.</p>
            <span className="home-deals-divider" aria-hidden="true"><i /></span>
          </div>
          <div className="home-deals-grid">
            {promotionProducts.map(({ product, discountPercent }) => (
              <HomeOfferCard
                key={product.id}
                product={product}
                discountPercent={discountPercent}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= OFFERS / FEATURED PRODUCTS ================= */}

      {featuredProducts.length > 0 && <section
        className="products-section home-offers-section"
        id="featured-products"
      >
        <div className="container">
          <div className="section-title">
            <span className="eyebrow">مختارات بيرنا</span>
            <h2>منتجات تستحق التجربة</h2>
            <p>تصفّح منتجات بيرنا واختر الحجم المناسب لك.</p>
          </div>

          <div className="products-grid home-featured-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
      </section>}

      {/* ================= CUSTOMER REVIEWS ================= */}

      {customerReviews.length > 0 && (
        <section
          className="home-reviews-section"
          id="customer-reviews"
          aria-labelledby="home-reviews-title"
        >
          <div className="container">
            <div className="section-title">
              <span className="eyebrow">من بيانات بيرنا</span>
              <h2 id="home-reviews-title">آراء عن منتجاتنا</h2>
              <p>نماذج من آراء العملاء عن منتجات متنوعة من بيرنا.</p>
            </div>

            <div className="home-reviews-grid">
              {customerReviews.map((review, index) => (
                <article className="home-review-card" key={`${review.name}-${review.productName}-${index}`}>
                  <div className="home-review-stars" aria-label={`تقييم ${review.rating} من 5`}>
                    {"★".repeat(Number(review.rating) || 5)}
                    {"☆".repeat(5 - (Number(review.rating) || 5))}
                  </div>
                  <blockquote>“{review.text}”</blockquote>
                  <div className="home-review-author">
                    <strong>{review.name}</strong>
                    <span>{review.productName}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-guarantee-strip" aria-label="مميزات تجربة بيرنا">
        <div className="container">
          <span>اختيارات بيرنا لمائدتك</span>
          <span>تفاصيل وأوزان واضحة</span>
          <span>خدمة عملاء عبر WhatsApp</span>
        </div>
      </section>

      {/* ================= PRODUCT CATEGORIES ================= */}

      <div className="home-collections" id="categories">
        <section className="home-collection-section home-honey-collection" id="honey">
          <div className="container">
            <div className="section-title">
              <span className="eyebrow">من مناحل بيرنا</span>
              <h2>أنواع العسل</h2>
              <p>اختار القسم المناسب من العسل السادة أو المنكّه.</p>
            </div>
            <div className="home-benefit-tabs" role="group" aria-label="تقسيمات أنواع العسل">
              {honeyCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`home-benefit-tab${activeHoneyCategory === category.id ? " selected" : ""}`}
                  aria-pressed={activeHoneyCategory === category.id}
                  onClick={() => {
                    if (hash) {
                      navigate("/", { replace: true });
                    }
                    setSelectedHoneyCategory(category.id);
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="products-grid" id="honey-products">
              {activeHoneyProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="home-collection-section home-pantry-collection" id="pantry">
          <div className="container">
            <div className="section-title">
              <span className="eyebrow">اختيارات للمائدة</span>
              <h2>منتجات بيرنا الغذائية</h2>
              <p>تصفّح المنتجات الغذائية المتوفرة من بيرنا.</p>
            </div>
            <div className="products-grid">
              {pantryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {averageReviewRating && (
        <section className="home-review-summary" aria-label="ملخص تقييمات بيرنا">
          <div className="container">
            <span className="home-review-summary-stars" aria-hidden="true">★★★★★</span>
            <strong>{averageReviewRating} / 5</strong>
            <span>من {productReviews.length} تقييماً مسجلاً لمنتجات بيرنا</span>
            <a href="#customer-reviews">اقرأ آراء عملائنا</a>
          </div>
        </section>
      )}

      {/* ================= TRUST / SERVICE ================= */}

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

      <section className="home-product-gallery" aria-labelledby="home-gallery-title">
        <div className="container">
          <div className="home-product-gallery-heading">
            <div>
              <span className="eyebrow">من منتجات بيرنا</span>
              <h2 id="home-gallery-title">اختيارات بيرنا لمائدتك</h2>
            </div>
            <a href="/products" className="outline-btn">كل المنتجات</a>
          </div>
          <div className="home-product-gallery-grid">
            {[
              productByName("عسل بالمكسرات"),
              productByName("عسل بردقوش"),
              productByName("زيت الزيتون"),
              productByName("طحينة"),
            ]
              .filter(Boolean)
              .map((product) => (
                <Link
                  className="home-gallery-item"
                  key={product.id}
                  to={`/products/${product.id}`}
                  aria-label={`تعرّف على ${product.name}`}
                >
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span>{product.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ================= WHATSAPP ================= */}

      <a
        href="https://wa.me/201029277716"
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

            <a href="#honey">
              أنواع العسل
            </a>

            <a href="#offers">
              مختارات بيرنا
            </a>

            <a href="#pantry">
              منتجات المائدة
            </a>

            <a href="/products">
              كل المنتجات
            </a>

            <a href="#about">
              عن بيرنا
            </a>

          </div>

          
<div className="footer-links" id="contact">

  <h3>
    خدمة العملاء
  </h3>

  <a
    href="https://wa.me/201029277716"
    target="_blank"
    rel="noopener noreferrer"
  >
    تواصل معنا على WhatsApp
  </a>

  <a
    href="https://www.facebook.com/profile.php?id=61593357845203"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="تابع بيرنا على فيسبوك"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ verticalAlign: "middle", marginLeft: "8px" }}
    >
      <path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.8-.1-1.6-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V21h3.4Z" />
    </svg>
    Facebook
  </a>

  <a
    href="https://www.instagram.com/bernafoods.official/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="تابع بيرنا على إنستجرام"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: "middle", marginLeft: "8px" }}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
    Instagram
  </a>

  <a
    href="https://www.tiktok.com/@berna.foods"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="تابع بيرنا على تيك توك"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ verticalAlign: "middle", marginLeft: "8px" }}
    >
      <path d="M19.6 7.2a6.6 6.6 0 0 1-4-1.3v8.3a6.1 6.1 0 1 1-5.3-6.1v3.4a2.8 2.8 0 1 0 1.9 2.7V2.5h3.4c.2 2.1 1.7 3.8 4 4.1v.6Z" />
    </svg>
    TikTok
  </a>

</div>

          <div className="footer-newsletter">
            <h3>تابع جديد بيرنا</h3>
            <p>للتعرّف على الجديد أو الاستفسار عن المنتجات، تواصل معنا عبر قنواتنا الرسمية.</p>
            <a
              href="https://www.instagram.com/bernafoods.official/"
              target="_blank"
              rel="noopener noreferrer"
            >
              تابعنا على إنستجرام
            </a>
            <a
              href="https://wa.me/201029277716"
              target="_blank"
              rel="noopener noreferrer"
            >
              راسلنا على WhatsApp
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

function ScrollToHash() {
  const { hash, pathname, key } = useLocation();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        return;
      }

      const requestedTargetId = decodeURIComponent(hash.slice(1));
      const targetId =
        requestedTargetId === "herbs" || requestedTargetId === "blends"
          ? "honey"
          : requestedTargetId;
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    });
  }, [hash, pathname, key]);

  return null;
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <BrowserRouter>
        <ScrollToHash />

        <Routes>

          {/* =================================================
              STORE
          ================================================= */}

          <Route
            path="/"
            element={
              <>
                <Header />
                <HomePage />
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
            path="/p/:id"
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

            <Route
              path="/admin/catalog"
              element={
                <>
                  <AdminHeader />
                  <AdminCatalog />
                </>
              }
            />

          </Route>

        </Routes>
    </BrowserRouter>
  );
}