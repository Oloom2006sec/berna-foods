import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getOrders } from "../services/orderService";
import "./admin-dashboard.css";

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
  {
    key: "cancelled",
    label: "ملغي",
    icon: "❌",
  },
];

const paymentStatuses = [
  ["deposit_required", "جدية الحجز مطلوبة"],
  ["deposit_pending", "في انتظار مراجعة جدية الحجز"],
  ["deposit_paid", "تم دفع جدية الحجز"],
  ["fully_paid", "مدفوع بالكامل"],
];

function buildProductReport(orders) {
  const productsByName = new Map();

  orders.forEach((order) => {
    if (order.status === "cancelled" || !Array.isArray(order.items)) {
      return;
    }

    order.items.forEach((item) => {
      const orderQuantity = Number(item.quantity);
      const quantity =
        Number.isFinite(orderQuantity) && orderQuantity > 0
          ? orderQuantity
          : 1;
      const components = Array.isArray(item.bundleItems)
        ? item.bundleItems
        : [];
      const orderProducts = components.length
        ? components.map((component) => ({
            name: component.name,
            quantity:
              quantity *
              (Number(component.quantity) > 0
                ? Number(component.quantity)
                : 1),
          }))
        : [{ name: item.name, quantity }];

      orderProducts.forEach((product) => {
        if (!product.name) return;

        const entry = productsByName.get(product.name) || {
          name: product.name,
          units: 0,
          orders: new Set(),
        };
        if (order.status === "delivered") {
          entry.units += product.quantity;
        }
        entry.orders.add(order.order_number);
        productsByName.set(product.name, entry);
      });
    });
  });

  return [...productsByName.values()]
    .map((product) => ({
      ...product,
      orders: product.orders.size,
    }))
    .sort(
      (a, b) =>
        b.units - a.units ||
        b.orders - a.orders ||
        a.name.localeCompare(b.name, "ar")
    )
    .slice(0, 8);
}

function buildGovernorateReport(orders) {
  const report = new Map();

  orders.forEach((order) => {
    if (order.status === "cancelled") return;

    const name = order.governorate?.trim() || "غير محدد";
    const entry = report.get(name) || {
      name,
      orders: 0,
      sales: 0,
    };
    entry.orders += 1;
    entry.sales += Number(order.total) || 0;
    report.set(name, entry);
  });

  return [...report.values()].sort(
    (a, b) => b.orders - a.orders || b.sales - a.sales
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [period, setPeriod] =
    useState("30");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  const [governorateFilter, setGovernorateFilter] =
    useState("all");

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

  const governorates = useMemo(
    () =>
      [...new Set(
        orders
          .map((order) => order.governorate?.trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, "ar")),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start = null;
    let end = null;

    if (period === "custom") {
      start = startDate
        ? new Date(`${startDate}T00:00:00`)
        : null;
      end = endDate
        ? new Date(`${endDate}T23:59:59.999`)
        : null;
    } else if (period !== "all") {
      start = new Date(now);
      start.setDate(
        start.getDate() - Number(period) + 1
      );
      start.setHours(0, 0, 0, 0);
    }

    return orders.filter((order) => {
      const createdAt = new Date(order.created_at);

      if (
        (start && (!Number.isFinite(createdAt.getTime()) || createdAt < start)) ||
        (end && (!Number.isFinite(createdAt.getTime()) || createdAt > end))
      ) {
        return false;
      }

      return (
        (statusFilter === "all" ||
          order.status === statusFilter) &&
        (paymentFilter === "all" ||
          order.payment_status === paymentFilter) &&
        (governorateFilter === "all" ||
          order.governorate === governorateFilter)
      );
    });
  }, [
    orders,
    period,
    startDate,
    endDate,
    statusFilter,
    paymentFilter,
    governorateFilter,
  ]);

  const totalOrders = filteredOrders.length;

  const newOrders =
    filteredOrders.filter(
      (order) =>
        order.status === "new"
    ).length;

  const preparingOrders =
    filteredOrders.filter(
      (order) =>
        order.status === "preparing"
    ).length;

  const deliveryOrders =
    filteredOrders.filter(
      (order) =>
        order.status ===
        "out_for_delivery"
    ).length;

  const deliveredOrders =
    filteredOrders.filter(
      (order) =>
        order.status === "delivered"
    ).length;

  const validOrders =
    filteredOrders.filter(
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

  const recentOrders = [...filteredOrders].sort(
      (a, b) =>
        new Date(
          b.created_at
        ) -
        new Date(
          a.created_at
        )
    )
    .slice(0, 5);

  const productReport = useMemo(
    () => buildProductReport(filteredOrders),
    [filteredOrders]
  );

  const governorateReport = useMemo(
    () => buildGovernorateReport(filteredOrders),
    [filteredOrders]
  );

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

  function exportReport() {
    const headers = [
      "رقم الطلب",
      "التاريخ",
      "حالة الطلب",
      "حالة الدفع",
      "المحافظة",
      "الإجمالي",
      "المحصل",
      "المتبقي",
    ];
    const rows = filteredOrders.map((order) => [
      order.order_number,
      order.created_at,
      getStatusLabel(order.status),
      paymentStatuses.find(
        ([key]) => key === order.payment_status
      )?.[1] || order.payment_status || "",
      order.governorate || "",
      order.total || 0,
      order.deposit_paid || 0,
      order.remaining_amount || 0,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8",
      })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "berna-orders-report.csv";
    link.click();
    URL.revokeObjectURL(url);
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
              to="/admin/catalog"
              className="dashboard-orders-btn"
            >
              🏷️ إدارة الأسعار والعروض
            </Link>

            <Link
              to="/"
              className="dashboard-store-btn"
            >
              🏠 العودة للمتجر
            </Link>

            <button
              type="button"
              className="dashboard-refresh-btn"
              onClick={loadOrders}
              disabled={loading}
            >
              ↻ تحديث البيانات
            </button>

          </div>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        <section
          className="dashboard-report-filters"
          aria-label="فلاتر التقارير"
        >
          <div className="dashboard-report-filters-heading">
            <div>
              <h2>تصفية التقارير</h2>
              <p>الأرقام والتقارير أدناه تتغير حسب الاختيارات.</p>
            </div>
            <button
              type="button"
              className="dashboard-export-btn"
              onClick={exportReport}
              disabled={filteredOrders.length === 0}
            >
              تنزيل الطلبات CSV
            </button>
          </div>

          <div className="dashboard-filter-controls">
            <label>
              الفترة
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                <option value="7">آخر 7 أيام</option>
                <option value="30">آخر 30 يومًا</option>
                <option value="90">آخر 90 يومًا</option>
                <option value="all">كل الفترات</option>
                <option value="custom">فترة مخصصة</option>
              </select>
            </label>

            {period === "custom" && (
              <>
                <label>
                  من تاريخ
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>
                <label>
                  إلى تاريخ
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </label>
              </>
            )}

            <label>
              حالة الطلب
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">كل الحالات</option>
                {statuses.map((status) => (
                  <option value={status.key} key={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              حالة الدفع
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
              >
                <option value="all">كل حالات الدفع</option>
                {paymentStatuses.map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              المحافظة
              <select
                value={governorateFilter}
                onChange={(event) =>
                  setGovernorateFilter(event.target.value)
                }
              >
                <option value="all">كل المحافظات</option>
                {governorates.map((governorate) => (
                  <option value={governorate} key={governorate}>
                    {governorate}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="dashboard-filter-result">
            نتائج التقرير: <strong>{totalOrders}</strong> طلب
          </p>
        </section>

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
                إجمالي جدية الحجز المحصلة
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
                  filteredOrders.filter(
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

        <section className="dashboard-report-grid">
          <div className="dashboard-report-card">
            <div className="section-heading">
              <div>
                <h2>الأكثر مبيعًا</h2>
                <p>عدد الوحدات في الطلبات المسلّمة ضمن الفلاتر.</p>
              </div>
            </div>
            {productReport.length ? (
              <div className="dashboard-report-table-wrap">
                <table className="dashboard-report-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الوحدات</th>
                      <th>الطلبات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productReport.map((product) => (
                      <tr key={product.name}>
                        <td>{product.name}</td>
                        <td>{product.units}</td>
                        <td>{product.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dashboard-report-empty">لا توجد بيانات أصناف لهذه الفلاتر.</p>
            )}
          </div>

          <div className="dashboard-report-card">
            <div className="section-heading">
              <div>
                <h2>ملخص المحافظات</h2>
                <p>الطلبات والمبيعات لكل محافظة ضمن الفلاتر.</p>
              </div>
            </div>
            {governorateReport.length ? (
              <div className="dashboard-report-table-wrap">
                <table className="dashboard-report-table">
                  <thead>
                    <tr>
                      <th>المحافظة</th>
                      <th>الطلبات</th>
                      <th>المبيعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {governorateReport.map((governorate) => (
                      <tr key={governorate.name}>
                        <td>{governorate.name}</td>
                        <td>{governorate.orders}</td>
                        <td>{formatMoney(governorate.sales)} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dashboard-report-empty">لا توجد بيانات محافظات لهذه الفلاتر.</p>
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