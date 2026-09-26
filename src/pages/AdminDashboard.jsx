import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getOrders } from "../services/orderService";

const statuses = [
  {
    key: "new",
    label: "طلبات جديدة",
    icon: "🆕",
  },
  {
    key: "preparing",
    label: "جاري التجهيز",
    icon: "🔄",
  },
  {
    key: "out_for_delivery",
    label: "خرجت للتوصيل",
    icon: "🚚",
  },
  {
    key: "delivered",
    label: "تم التسليم",
    icon: "✅",
  },
];

export default function AdminDashboard() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getOrders();

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Dashboard orders error:",
        error
      );

      setError(
        error?.message ||
          "تعذر تحميل الطلبات."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const totalOrders =
    orders.length;

  const newOrders =
    orders.filter(
      (order) =>
        order.status === "new"
    ).length;

  const preparingOrders =
    orders.filter(
      (order) =>
        order.status === "preparing"
    ).length;

  const deliveryOrders =
    orders.filter(
      (order) =>
        order.status ===
        "out_for_delivery"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status === "delivered"
    ).length;

  const validOrders =
    orders.filter(
      (order) =>
        order.status !==
        "cancelled"
    );

  const totalSales =
    validOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.total || 0
        ),
      0
    );

  const totalDeposits =
    validOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.deposit_paid || 0
        ),
      0
    );

  const totalRemaining =
    validOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.remaining_amount ||
            0
        ),
      0
    );

  const recentOrders = [
    ...orders,
  ]
    .sort(
      (a, b) =>
        new Date(
          b.created_at
        ) -
        new Date(
          a.created_at
        )
    )
    .slice(0, 5);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleString(
      "ar-EG"
    );
  }

  function formatMoney(value) {
    return Number(
      value || 0
    ).toLocaleString(
      "ar-EG",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function getStatusLabel(
    status
  ) {
    const labels = {
      new: "جديد",
      preparing: "جاري التجهيز",
      out_for_delivery:
        "خرج للتوصيل",
      delivered: "تم التسليم",
      cancelled: "ملغي",
    };

    return (
      labels[status] ||
      status ||
      "غير معروف"
    );
  }

  if (loading) {
    return (
      <main
        className="admin-dashboard-page"
        dir="rtl"
      >
        <div className="container">

          <div className="dashboard-empty">

            <div>
              ⏳
            </div>

            <h3>
              جاري تحميل لوحة التحكم...
            </h3>

            <p>
              يتم تحميل الطلبات من قاعدة البيانات.
            </p>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main
      className="admin-dashboard-page"
      dir="rtl"
    >
      <div className="container">

        {/* ================= HEADER ================= */}

        <div className="dashboard-header">

          <div>

            <span className="eyebrow">
              BERNA FOODS
            </span>

            <h1>
              لوحة التحكم
            </h1>

            <p>
              نظرة سريعة على أداء الطلبات والمبيعات.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <Link
              to="/admin/orders"
              className="dashboard-orders-btn"
            >
              📦 إدارة الطلبات
            </Link>

            <Link
              to="/"
              className="dashboard-store-btn"
            >
              🏠 العودة للمتجر
            </Link>

          </div>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        {/* ================= STATISTICS ================= */}

        <div className="dashboard-stats">

          <div className="dashboard-stat">

            <div className="stat-icon">
              📦
            </div>

            <div>
              <span>
                إجمالي الطلبات
              </span>

              <strong>
                {totalOrders}
              </strong>
            </div>

          </div>

          <div className="dashboard-stat">

            <div className="stat-icon">
              🆕
            </div>

            <div>
              <span>
                طلبات جديدة
              </span>

              <strong>
                {newOrders}
              </strong>
            </div>

          </div>

          <div className="dashboard-stat">

            <div className="stat-icon">
              🔄
            </div>

            <div>
              <span>
                جاري التجهيز
              </span>

              <strong>
                {preparingOrders}
              </strong>
            </div>

          </div>

          <div className="dashboard-stat">

            <div className="stat-icon">
              🚚
            </div>

            <div>
              <span>
                خرج للتوصيل
              </span>

              <strong>
                {deliveryOrders}
              </strong>
            </div>

          </div>

          <div className="dashboard-stat">

            <div className="stat-icon">
              ✅
            </div>

            <div>
              <span>
                تم التسليم
              </span>

              <strong>
                {deliveredOrders}
              </strong>
            </div>

          </div>

          <div className="dashboard-stat sales-stat">

            <div className="stat-icon">
              💰
            </div>

            <div>
              <span>
                إجمالي المبيعات
              </span>

              <strong>
                {formatMoney(
                  totalSales
                )}{" "}
                ج.م
              </strong>
            </div>

          </div>

        </div>

        {/* ================= PAYMENT ================= */}

        <div className="dashboard-stats">

          <div className="dashboard-stat">

            <div className="stat-icon">
              💵
            </div>

            <div>
              <span>
                المقدمات المحصلة
              </span>

              <strong>
                {formatMoney(
                  totalDeposits
                )}{" "}
                ج.م
              </strong>
            </div>

          </div>

          <div className="dashboard-stat">

            <div className="stat-icon">
              🧾
            </div>

            <div>
              <span>
                المتبقي عند الاستلام
              </span>

              <strong>
                {formatMoney(
                  totalRemaining
                )}{" "}
                ج.م
              </strong>
            </div>

          </div>

        </div>

        {/* ================= STATUS OVERVIEW ================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <h2>
                حالة الطلبات
              </h2>

              <p>
                توزيع الطلبات حسب الحالة الحالية.
              </p>

            </div>

            <Link
              to="/admin/orders"
            >
              إدارة الطلبات ←
            </Link>

          </div>

          <div className="status-overview">

            {statuses.map(
              (status) => {

                const count =
                  orders.filter(
                    (order) =>
                      order.status ===
                      status.key
                  ).length;

                const percentage =
                  totalOrders > 0
                    ? Math.round(
                        (count /
                          totalOrders) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="status-overview-card"
                    key={
                      status.key
                    }
                  >

                    <div className="status-overview-top">

                      <span>
                        {
                          status.icon
                        }
                      </span>

                      <strong>
                        {count}
                      </strong>

                    </div>

                    <h3>
                      {
                        status.label
                      }
                    </h3>

                    <div className="status-progress">

                      <div
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                    <small>
                      {percentage}%
                      {" "}
                      من الطلبات
                    </small>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* ================= RECENT ORDERS ================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <h2>
                أحدث الطلبات
              </h2>

              <p>
                آخر الطلبات التي تم تسجيلها.
              </p>

            </div>

            <Link
              to="/admin/orders"
            >
              عرض كل الطلبات ←
            </Link>

          </div>

          {recentOrders.length === 0 ? (

            <div className="dashboard-empty">

              <div>
                📦
              </div>

              <h3>
                لا توجد طلبات
              </h3>

              <p>
                ستظهر الطلبات هنا عند استقبالها.
              </p>

            </div>

          ) : (

            <div className="recent-orders">

              {recentOrders.map(
                (order) => (

                  <div
                    className="recent-order"
                    key={
                      order.order_number
                    }
                  >

                    <div className="recent-order-main">

                      <strong>
                        {
                          order.order_number
                        }
                      </strong>

                      <span>
                        {
                          order.customer_name ||
                          "-"
                        }
                      </span>

                      <small>
                        {formatDate(
                          order.created_at
                        )}
                      </small>

                    </div>

                    <div className="recent-order-total">

                      {formatMoney(
                        order.total
                      )}{" "}
                      ج.م

                    </div>

                    <div
                      className={`recent-order-status status-${order.status}`}
                    >
                      {getStatusLabel(
                        order.status
                      )}
                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* ================= BOTTOM NAVIGATION ================= */}

        <div className="admin-bottom-navigation">

          <Link
            to="/admin/orders"
            className="dashboard-orders-btn"
          >
            📦 إدارة الطلبات
          </Link>

          <Link
            to="/"
            className="dashboard-store-btn"
          >
            🏠 العودة للمتجر
          </Link>

        </div>

      </div>
    </main>
  );
}