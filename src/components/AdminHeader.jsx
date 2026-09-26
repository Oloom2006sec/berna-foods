import { Link, useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("berna-admin-auth");

    navigate("/admin/login", {
      replace: true,
    });
  }

  return (
    <header
      className="admin-header-bar"
      dir="rtl"
    >
      <div className="container admin-header-inner">

        {/* ================= BRAND ================= */}

        <div className="admin-brand">

          <span className="admin-brand-icon">
            🍯
          </span>

          <div>
            <strong>
              BERNA FOODS
            </strong>

            <small>
              لوحة الإدارة
            </small>
          </div>

        </div>

        {/* ================= NAVIGATION ================= */}

        <nav className="admin-nav">

          <Link
            to="/admin"
            className="admin-nav-link"
          >
            📊 لوحة التحكم
          </Link>

          <Link
            to="/admin/orders"
            className="admin-nav-link"
          >
            📦 الطلبات
          </Link>

          <Link
            to="/track-order"
            className="admin-nav-link"
          >
            🔎 تتبع الطلب
          </Link>

          <Link
            to="/"
            className="admin-nav-link"
          >
            🏠 المتجر
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-logout-btn"
          >
            🚪 تسجيل الخروج
          </button>

        </nav>

      </div>
    </header>
  );
}