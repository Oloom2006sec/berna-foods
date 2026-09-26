import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      navigate("/products");
      closeMenu();
      return;
    }

    navigate(`/products?search=${encodeURIComponent(query)}`);

    setSearch("");
    closeMenu();
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">

          {/* Logo */}
          <Link
            to="/"
            className="logo"
            onClick={closeMenu}
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
          >
            <Link to="/" onClick={closeMenu}>
              الرئيسية
            </Link>

            <Link to="/products" onClick={closeMenu}>
              المنتجات
            </Link>

            <Link to="/#offers" onClick={closeMenu}>
              الباقات
            </Link>

            <Link to="/#about" onClick={closeMenu}>
              عن بيرنا
            </Link>

            <Link to="/#contact" onClick={closeMenu}>
              تواصل معنا
            </Link>
          </nav>

          {/* Search */}
          <form
            className="header-search"
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
              onClick={() => setCartOpen(true)}
              aria-label="السلة"
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
              aria-label="فتح القائمة"
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