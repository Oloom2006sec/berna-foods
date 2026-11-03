import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleNavigation(target) {
    closeMenu();

    if (target === "/" && pathname === "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    if (target.startsWith("/#") && pathname === "/") {
      const requestedHash = target.slice(1);
      if (hash === requestedHash) {
        const targetId = decodeURIComponent(requestedHash.slice(1));
        window.requestAnimationFrame(() => {
          document.getElementById(targetId)?.scrollIntoView({
            behavior: "instant",
            block: "start",
          });
        });
      }
      return;
    }

    if (target === pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setCartOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      navigate("/products");
      setSearchOpen(false);
      closeMenu();
      return;
    }

    navigate(`/products?search=${encodeURIComponent(query)}`);

    setSearch("");
    setSearchOpen(false);
    closeMenu();
  }

  return (
    <>
      <div className="header-announcement" role="note">
        اختيارات بيرنا الطبيعية لبيتك ومائدتك
      </div>
      <header className="header">
        <div className="container header-inner">

          {/* Logo */}
          <Link
            to="/"
            className="logo"
            onClick={() => handleNavigation("/")}
          >
            <span className="logo-icon">
              🍯
            </span>

            <div>
              <strong>بيرنا</strong>
              <small>BERNA FOODS</small>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className={`nav ${menuOpen ? "nav-open" : ""}`}
            id="primary-navigation"
            aria-label="القائمة الرئيسية"
          >
            <Link to="/" onClick={() => handleNavigation("/")}>
              الرئيسية
            </Link>

            <Link to="/#offers" onClick={() => handleNavigation("/#offers")}>
              مختارات بيرنا
            </Link>

            <Link to="/#honey" onClick={() => handleNavigation("/#honey")}>
              أنواع العسل
            </Link>

            <Link to="/#pantry" onClick={() => handleNavigation("/#pantry")}>
              منتجات المائدة
            </Link>

            <Link to="/products" onClick={() => handleNavigation("/products")}>
              كل المنتجات
            </Link>

            <Link to="/#contact" onClick={() => handleNavigation("/#contact")}>
              تواصل معنا
            </Link>
          </nav>

          {/* Search */}
          <form
            className={`header-search ${searchOpen ? "mobile-search-open" : ""}`}
            id="header-search"
            onSubmit={handleSearch}
          >
            <input
              type="search"
              placeholder="ابحث..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button
              type="submit"
              aria-label="بحث"
            >
              🔎
            </button>
          </form>

          {/* Actions */}
          <div className="header-actions">

            <button
              className="mobile-search-btn"
              type="button"
              onClick={() => {
                setSearchOpen((open) => !open);
                closeMenu();
              }}
              aria-label={searchOpen ? "إغلاق البحث" : "فتح البحث"}
              aria-expanded={searchOpen}
              aria-controls="header-search"
            >
              🔎
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="wishlist-header-btn"
              aria-label="المفضلة"
              onClick={closeMenu}
            >
              ♡

              {wishlistCount > 0 && (
                <span>{wishlistCount}</span>
              )}
            </Link>

            {/* Cart */}
            <button
              className="cart-btn"
              type="button"
              onClick={() => {
                closeMenu();
                setCartOpen(true);
              }}
              aria-label="السلة"
              aria-haspopup="dialog"
            >
              🛒

              {cartCount > 0 && (
                <span>{cartCount}</span>
              )}
            </button>

            {/* Mobile menu */}
            <button
              className="mobile-menu-btn"
              type="button"
              onClick={() =>
                setMenuOpen((open) => !open)
              }
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
            >
              {menuOpen ? "✕" : "☰"}
            </button>

          </div>

        </div>
      </header>

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
        />
      )}
    </>
  );
}