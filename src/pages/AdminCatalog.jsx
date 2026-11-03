import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import { useStoreSettings } from "../context/StoreSettingsContext";
import { getDefaultStoreSettings } from "../services/storeSettingsService";
import "./admin-catalog.css";

const tabs = [
  { id: "prices", label: "الأسعار" },
  { id: "individual", label: "العروض المنفردة" },
  { id: "bundles", label: "عروض المجموعات" },
];

function createBundleDraft() {
  return {
    name: "",
    description: "",
    status: "draft",
    channel: "أفراد",
    startDate: "",
    endDate: "",
    selectedSku: products.find((product) => product.available !== false)?.sku || "",
    selectedQuantity: 1,
    discountPercent: 0,
    items: [],
  };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AdminCatalog() {
  const storeSettings = useStoreSettings();

  if (storeSettings.loading) {
    return (
      <main className="admin-catalog-page" dir="rtl">
        <div className="container">
          <div className="admin-catalog-message">جاري تحميل الأسعار والعروض...</div>
        </div>
      </main>
    );
  }

  return (
    <AdminCatalogEditor
      settings={storeSettings.settings}
      settingsError={storeSettings.error}
      saveSettings={storeSettings.saveSettings}
    />
  );
}

function AdminCatalogEditor({ settings, settingsError, saveSettings }) {
  const [activeTab, setActiveTab] = useState("prices");
  const [draft, setDraft] = useState(settings);
  const [bundleDraft, setBundleDraft] = useState(createBundleDraft);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const productBySku = useMemo(
    () => new Map(products.map((product) => [product.sku, product])),
    []
  );
  const approvedPricesBySku = useMemo(
    () =>
      new Map(
        getDefaultStoreSettings().prices.map((price) => [price.sku, price])
      ),
    []
  );
  const orderedProducts = useMemo(
    () =>
      products.filter((product) => product.available !== false).sort((a, b) =>
        a.name.localeCompare(b.name, "ar") ||
        Number(a.weightGrams) - Number(b.weightGrams) ||
        a.packageType.localeCompare(b.packageType, "ar")
      ),
    []
  );
  function getBundleTotals(items, discountPercent) {
    const totals = items.reduce(
      (result, item) => {
        const price = draft.prices.find((entry) => entry.sku === item.sku);
        result.regular += Number(price?.price || 0) * item.quantity;
        result.minimum += Number(price?.minOfferPrice || 0) * item.quantity;
        return result;
      },
      { regular: 0, minimum: 0 }
    );
    const regularPrice = roundMoney(totals.regular);
    const minimumPrice = roundMoney(totals.minimum);
    const requestedDiscount = Number(discountPercent) || 0;
    const bundlePrice = roundMoney(
      regularPrice * (1 - requestedDiscount / 100)
    );

    return {
      regularPrice,
      minimumPrice,
      bundlePrice,
      discountAmount: roundMoney(regularPrice - bundlePrice),
      maxDiscountPercent:
        regularPrice > 0
          ? Math.min(
              90,
              Math.floor(
                ((regularPrice - minimumPrice) / regularPrice) * 100 +
                  Number.EPSILON
              )
            )
          : 0,
    };
  }

  const bundleTotals = getBundleTotals(
    bundleDraft.items,
    bundleDraft.discountPercent
  );
  const selectedProductPrice =
    draft.prices.find((price) => price.sku === bundleDraft.selectedSku)
      ?.price || 0;

  function updatePrice(sku, field, value) {
    setDraft((current) => ({
      ...current,
      prices: current.prices.map((price) =>
        price.sku === sku ? { ...price, [field]: value } : price
      ),
    }));
    setSuccess("");
  }

  function updateDiscount(productName, value) {
    setDraft((current) => ({
      ...current,
      productOffers: current.productOffers.map((offer) =>
        offer.productName === productName
          ? { ...offer, discountPercent: value }
          : offer
      ),
    }));
    setSuccess("");
  }

  function addBundleItem() {
    if (!bundleDraft.selectedSku) {
      return;
    }

    const quantity = Number(bundleDraft.selectedQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      setSaveError("أدخل كمية صحيحة من 1 إلى 99.");
      return;
    }

    const existing = bundleDraft.items.find(
      (item) => item.sku === bundleDraft.selectedSku
    );
    const nextQuantity =
      Number(existing?.quantity || 0) + Number(bundleDraft.selectedQuantity);
    if (nextQuantity > 99) {
      setSaveError("الحد الأقصى لكمية الصنف الواحد في المجموعة هو 99.");
      return;
    }

    setBundleDraft((current) => {
      const items = existing
        ? current.items.map((item) =>
            item.sku === current.selectedSku
              ? {
                  ...item,
                  quantity:
                    item.quantity + Number(current.selectedQuantity),
                }
              : item
          )
        : [
            ...current.items,
            {
              sku: current.selectedSku,
              quantity: Number(current.selectedQuantity),
            },
          ];

      return { ...current, items };
    });
    setSaveError("");
  }

  function removeBundleItem(sku) {
    setBundleDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.sku !== sku),
    }));
  }

  function addBundle() {
    const name = bundleDraft.name.trim();
    const discountPercent = Number(bundleDraft.discountPercent);
    const totals = getBundleTotals(bundleDraft.items, discountPercent);

    if (!name || bundleDraft.items.length === 0) {
      setSaveError("اكتب اسم المجموعة وأضف منتجًا واحدًا على الأقل.");
      return;
    }

    if (
      bundleDraft.startDate &&
      bundleDraft.endDate &&
      bundleDraft.endDate < bundleDraft.startDate
    ) {
      setSaveError("تاريخ نهاية العرض يجب أن يكون بعد تاريخ بدايته.");
      return;
    }

    if (
      !Number.isInteger(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > totals.maxDiscountPercent ||
      totals.bundlePrice < totals.minimumPrice
    ) {
      setSaveError(
        `نسبة الخصم يجب ألا تتجاوز ${totals.maxDiscountPercent}% حتى لا يقل سعر المجموعة عن الحد الأدنى المعتمد.`
      );
      return;
    }

    const newBundle = {
      id: crypto.randomUUID(),
      name,
      description: bundleDraft.description.trim(),
      status: bundleDraft.status,
      channel: bundleDraft.channel,
      startDate: bundleDraft.startDate,
      endDate: bundleDraft.endDate,
      items: bundleDraft.items,
      discountPercent,
      bundlePrice: totals.bundlePrice,
      enabled: bundleDraft.status === "active",
    };

    setDraft((current) => ({
      ...current,
      bundleOffers: [...current.bundleOffers, newBundle],
    }));
    setBundleDraft(createBundleDraft());
    setSaveError("");
    setSuccess("");
  }

  function updateBundle(bundleId, updates) {
    setDraft((current) => ({
      ...current,
      bundleOffers: current.bundleOffers.map((bundle) =>
        bundle.id === bundleId ? { ...bundle, ...updates } : bundle
      ),
    }));
    setSuccess("");
  }

  function updateBundleDiscount(bundle, value) {
    const discountPercent = Number(value);
    const totals = getBundleTotals(bundle.items, discountPercent);
    if (
      !Number.isInteger(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > totals.maxDiscountPercent
    ) {
      setSaveError(
        `أقصى خصم مسموح لمجموعة "${bundle.name}" هو ${totals.maxDiscountPercent}%.`
      );
      return;
    }

    updateBundle(bundle.id, {
      discountPercent: value,
      bundlePrice: totals.bundlePrice,
    });
    setSaveError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSuccess("");

    try {
      await saveSettings(draft);
      setSuccess("تم حفظ الأسعار والعروض بنجاح.");
    } catch (saveFailure) {
      console.error("Save catalog settings error:", saveFailure);
      setSaveError(
        saveFailure.message ||
          "تعذر الحفظ. تحقق من إعداد قاعدة بيانات إدارة المتجر."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-catalog-page" dir="rtl">
      <div className="container">
        <header className="admin-catalog-header">
          <div>
            <span className="eyebrow">إدارة المتجر</span>
            <h1>الأسعار والعروض</h1>
            <p>الأسعار الحالية والحد الأدنى المعتمد محمّلان كبداية.</p>
          </div>
          <Link className="admin-catalog-back" to="/admin">العودة للوحة التحكم</Link>
        </header>

        {settingsError && (
          <div className="admin-catalog-alert" role="alert">
            تعذر تحميل الإعدادات المحفوظة من قاعدة البيانات. شغّل ترحيل قاعدة
            البيانات <code>supabase/migrations/20261103180000_store_settings.sql</code>
            ثم أعد تحميل الصفحة. ستظل الأسعار الحالية ظاهرة إلى أن يتم الربط.
          </div>
        )}
        {saveError && <div className="admin-catalog-alert" role="alert">{saveError}</div>}
        {success && <div className="admin-catalog-success" role="status">{success}</div>}

        <nav className="admin-catalog-tabs" aria-label="إدارة الأسعار والعروض">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "active" : ""}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <form onSubmit={handleSave}>
          {activeTab === "prices" && (
            <section className="admin-catalog-panel">
              <div className="admin-catalog-panel-heading">
                <div>
                  <h2>أسعار المنتجات والأوزان</h2>
                  <p>السعر الأرضي هو أقل سعر مسموح به بعد الخصم.</p>
                </div>
                <span>{draft.prices.length} اختيارًا</span>
              </div>
              <div className="admin-catalog-table-wrap">
                <table className="admin-catalog-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الوزن / العبوة</th>
                      <th>سعر البيع (ج.م)</th>
                      <th>أقل سعر مسموح (ج.م)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.prices.map((price) => {
                      const product = productBySku.get(price.sku);
                      if (!product) {
                        return null;
                      }

                      return (
                        <tr key={price.sku}>
                          <td>
                            <strong>{product.name}</strong>
                            {product.available === false && (
                              <small className="admin-catalog-unavailable">غير متاح حاليًا</small>
                            )}
                          </td>
                          <td>{product.weight} · {product.packageType}</td>
                          <td>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={price.price}
                              aria-label={`سعر ${product.name} ${product.weight}`}
                              onChange={(event) =>
                                updatePrice(price.sku, "price", event.target.value)
                              }
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={approvedPricesBySku.get(price.sku)?.minOfferPrice || 0.01}
                              step="0.01"
                              value={price.minOfferPrice}
                              aria-label={`الحد الأدنى لسعر ${product.name} ${product.weight}`}
                              onChange={(event) =>
                                updatePrice(
                                  price.sku,
                                  "minOfferPrice",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "individual" && (
            <section className="admin-catalog-panel">
              <div className="admin-catalog-panel-heading">
                <div>
                  <h2>العروض المنفردة</h2>
                  <p>حدد نسبة الخصم لكل منتج؛ السعر النهائي لن يتجاوز الحد الأدنى.</p>
                </div>
                <span>{draft.productOffers.length} منتجًا</span>
              </div>
              <div className="admin-offer-list">
                {draft.productOffers.map((offer) => (
                  <label className="admin-offer-row" key={offer.productName}>
                    <span>
                      <strong>{offer.productName}</strong>
                      <small>اكتب 0 لإيقاف عرض هذا المنتج</small>
                    </span>
                    <span className="admin-discount-input">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        step="1"
                        value={offer.discountPercent}
                        aria-label={`نسبة خصم ${offer.productName}`}
                        onChange={(event) =>
                          updateDiscount(offer.productName, event.target.value)
                        }
                        required
                      />
                      <b>%</b>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {activeTab === "bundles" && (
            <section className="admin-catalog-panel">
              <div className="admin-catalog-panel-heading">
                <div>
                  <h2>عروض المجموعات</h2>
                  <p>اختر المنتجات والأوزان والكميات، وحدد نسبة الخصم ليُحسب السعر تلقائيًا. المجموعات الجديدة تحفظ متوقفة حتى تراجعها وتفعّلها.</p>
                </div>
                <span>{draft.bundleOffers.length} مجموعة</span>
              </div>
              <div className="admin-catalog-info">
                العرض الذي حالته «نشط» وقناة بيعه «أفراد» يظهر تلقائيًا أسفل
                البانر الرئيسي في صفحة العميل خلال الفترة المحددة، ويمكن للعميل
                إضافته إلى السلة بسعر المجموعة.
              </div>

              <div className="admin-bundle-form">
                <section className="admin-bundle-section">
                  <div className="admin-bundle-section-heading">
                    <h3>بيانات العرض</h3>
                    <span>شاشة إدخال</span>
                  </div>
                  <div className="admin-bundle-details-grid">
                    <label>
                      اسم العرض
                      <input
                        value={bundleDraft.name}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="مثال: باقة بيرنا العائلية"
                      />
                    </label>
                    <label>
                      قناة البيع
                      <select
                        value={bundleDraft.channel}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            channel: event.target.value,
                          }))
                        }
                      >
                        <option value="أفراد">أفراد</option>
                        <option value="جملة">جملة</option>
                      </select>
                    </label>
                    <label>
                      حالة العرض
                      <select
                        value={bundleDraft.status}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                      >
                        <option value="draft">مسودة</option>
                        <option value="active">نشط</option>
                        <option value="paused">متوقف</option>
                      </select>
                    </label>
                    <label>
                      تاريخ البداية
                      <input
                        type="date"
                        value={bundleDraft.startDate}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            startDate: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      تاريخ النهاية
                      <input
                        type="date"
                        min={bundleDraft.startDate || undefined}
                        value={bundleDraft.endDate}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            endDate: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      وصف مختصر
                      <input
                        value={bundleDraft.description}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="اختياري"
                      />
                    </label>
                  </div>
                </section>

                <section className="admin-bundle-section">
                  <div className="admin-bundle-section-heading">
                    <h3>مكونات العرض</h3>
                    <button
                      type="button"
                      className="admin-bundle-secondary"
                      onClick={addBundleItem}
                    >
                      + إضافة صنف
                    </button>
                  </div>
                  <div className="admin-bundle-item-entry">
                    <label>
                      الصنف والوزن
                      <select
                        value={bundleDraft.selectedSku}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            selectedSku: event.target.value,
                          }))
                        }
                      >
                        {orderedProducts.map((product) => (
                          <option key={product.sku} value={product.sku}>
                            {product.name} — {product.weight} ({product.packageType})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      الكمية
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={bundleDraft.selectedQuantity}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            selectedQuantity: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="admin-bundle-selected-price">
                      سعر الوحدة
                      <strong>{formatMoney(selectedProductPrice)} ج.م</strong>
                    </div>
                  </div>

                  <div className="admin-bundle-table-wrap">
                    <table className="admin-bundle-table">
                      <thead>
                        <tr>
                          <th>الصنف</th>
                          <th>الكمية</th>
                          <th>سعر الوحدة</th>
                          <th>التكلفة</th>
                          <th>الإجمالي</th>
                          <th aria-label="حذف"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bundleDraft.items.map((item) => {
                          const product = productBySku.get(item.sku);
                          const unitPrice =
                            draft.prices.find((price) => price.sku === item.sku)
                              ?.price || 0;
                          return (
                            <tr key={item.sku}>
                              <td>{product?.name} — {product?.weight}</td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={item.quantity}
                                  aria-label={`كمية ${product?.name} ${product?.weight}`}
                                  onChange={(event) => {
                                    const quantity = Number(event.target.value);
                                    if (
                                      !Number.isInteger(quantity) ||
                                      quantity < 1 ||
                                      quantity > 99
                                    ) {
                                      return;
                                    }
                                    setBundleDraft((current) => ({
                                      ...current,
                                      items: current.items.map((currentItem) =>
                                        currentItem.sku === item.sku
                                          ? { ...currentItem, quantity }
                                          : currentItem
                                      ),
                                    }));
                                  }}
                                />
                              </td>
                              <td>{formatMoney(unitPrice)} ج.م</td>
                              <td>—</td>
                              <td>{formatMoney(unitPrice * item.quantity)} ج.م</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-bundle-remove"
                                  onClick={() => removeBundleItem(item.sku)}
                                  aria-label={`حذف ${product?.name} من العرض`}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {bundleDraft.items.length === 0 && (
                          <tr>
                            <td colSpan="6" className="admin-bundle-table-empty">
                              اختر صنفًا ثم اضغط «إضافة صنف».
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-bundle-summary">
                  <h3>ملخص العرض المباشر</h3>
                  <div className="admin-bundle-summary-grid">
                    <div>
                      <span>إجمالي قبل الخصم</span>
                      <strong>{formatMoney(bundleTotals.regularPrice)} ج.م</strong>
                    </div>
                    <label>
                      خصم العرض (%)
                      <input
                        type="number"
                        min="0"
                        max={bundleTotals.maxDiscountPercent}
                        step="1"
                        value={bundleDraft.discountPercent}
                        onChange={(event) =>
                          setBundleDraft((current) => ({
                            ...current,
                            discountPercent: event.target.value,
                          }))
                        }
                      />
                      <small>أقصى خصم مسموح: {bundleTotals.maxDiscountPercent}%</small>
                    </label>
                    <div>
                      <span>قيمة الخصم</span>
                      <strong>{formatMoney(bundleTotals.discountAmount)} ج.م</strong>
                    </div>
                    <div>
                      <span>السعر النهائي</span>
                      <strong>{formatMoney(bundleTotals.bundlePrice)} ج.م</strong>
                    </div>
                    <div>
                      <span>مساهمة الربح التقديرية</span>
                      <strong>—</strong>
                      <small>أضف تكلفة الأصناف لحساب الربح</small>
                    </div>
                  </div>
                  <p className="admin-bundle-minimum">
                    أقل سعر مسموح حسب الحدود المعتمدة:{" "}
                    <strong>{formatMoney(bundleTotals.minimumPrice)} ج.م</strong>
                  </p>
                </section>

                <div className="admin-bundle-form-actions">
                  <button
                    type="button"
                    className="admin-bundle-add"
                    onClick={addBundle}
                  >
                    حفظ العرض في السجل
                  </button>
                  <button
                    type="button"
                    className="admin-bundle-secondary"
                    onClick={() => {
                      setBundleDraft(createBundleDraft());
                      setSaveError("");
                    }}
                  >
                    عرض جديد
                  </button>
                </div>
              </div>

              <div className="admin-bundle-list">
                {draft.bundleOffers.length === 0 ? (
                  <p className="admin-catalog-empty">لم تتم إضافة مجموعات بعد.</p>
                ) : (
                  draft.bundleOffers.map((bundle) => (
                    <article className="admin-bundle-card" key={bundle.id}>
                      <div>
                        <h3>{bundle.name}</h3>
                        {bundle.description && <p>{bundle.description}</p>}
                        <p className="admin-bundle-metadata">
                          {bundle.channel || "أفراد"} ·{" "}
                          {bundle.status === "active"
                            ? "نشط"
                            : bundle.status === "paused"
                              ? "متوقف"
                              : "مسودة"}
                          {(bundle.startDate || bundle.endDate) &&
                            ` · ${bundle.startDate || "—"} إلى ${bundle.endDate || "—"}`}
                        </p>
                        <ul>
                          {bundle.items.map((item) => {
                            const product = productBySku.get(item.sku);
                            return (
                              <li key={item.sku}>
                                {product?.name} — {product?.weight} × {item.quantity}
                              </li>
                            );
                          })}
                        </ul>
                        <strong>
                          خصم المجموعة: {Number(bundle.discountPercent || 0)}% ·{" "}
                          السعر بعد الخصم: {formatMoney(bundle.bundlePrice)} ج.م
                        </strong>
                      </div>
                      <div className="admin-bundle-actions">
                        <label className="admin-bundle-discount">
                          الخصم %
                          <input
                            type="number"
                            min="0"
                            max={
                              getBundleTotals(bundle.items, 0).maxDiscountPercent
                            }
                            step="1"
                            value={bundle.discountPercent || 0}
                            onChange={(event) =>
                              updateBundleDiscount(bundle, event.target.value)
                            }
                          />
                        </label>
                        <label className="admin-bundle-status">
                          حالة العرض
                          <select
                            value={bundle.status || (bundle.enabled ? "active" : "draft")}
                            onChange={(event) =>
                              updateBundle(bundle.id, {
                                status: event.target.value,
                                enabled: event.target.value === "active",
                              })
                            }
                          >
                            <option value="draft">مسودة</option>
                            <option value="active">نشط</option>
                            <option value="paused">متوقف</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              bundleOffers: current.bundleOffers.filter(
                                (item) => item.id !== bundle.id
                              ),
                            }))
                          }
                        >
                          حذف
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          <div className="admin-catalog-save-row">
            <button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
            <span>الأسعار والعروض الفردية والمجموعات تحفظ معًا.</span>
          </div>
        </form>
      </div>
    </main>
  );
}
