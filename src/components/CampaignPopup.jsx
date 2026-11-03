import { useEffect, useRef, useState } from "react";
import { campaign } from "../data/homePromotions";
import { useStoreSettings } from "../context/StoreSettingsContext";

const dismissedStorageKey = "berna-campaign-popup-dismissed";

export default function CampaignPopup() {
  const { settings } = useStoreSettings();
  const maximumDiscount = Math.max(
    0,
    ...settings.productOffers.map((offer) => Number(offer.discountPercent) || 0)
  );
  const [isOpen, setIsOpen] = useState(
    () =>
      campaign.enabled &&
      window.sessionStorage.getItem(dismissedStorageKey) !== "true"
  );
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) {
      return undefined;
    }

    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [isOpen]);

  function dismissPopup() {
    window.sessionStorage.setItem(dismissedStorageKey, "true");
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="campaign-popup"
      aria-labelledby="campaign-popup-title"
      onCancel={(event) => {
        event.preventDefault();
        dismissPopup();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismissPopup();
        }
      }}
    >
      <div className="campaign-popup-content" dir="rtl">
        <button
          type="button"
          className="campaign-popup-close"
          aria-label="إغلاق الإعلان"
          onClick={dismissPopup}
        >
          ×
        </button>
        <span className="campaign-popup-icon" aria-hidden="true">
          🍯
        </span>
        <span className="campaign-popup-eyebrow">
          عروض خاصة من بيرنا
        </span>
        <h2 id="campaign-popup-title">
          {campaign.name} وصلت!
        </h2>
        <p>
          اكتشف عروض بيرنا على كل المنتجات، بخصومات تصل إلى{" "}
          <strong>{maximumDiscount}%</strong>.
        </p>
        <a
          className="campaign-popup-cta"
          href="#offers"
          onClick={dismissPopup}
        >
          اكتشف العروض
        </a>
      </div>
    </dialog>
  );
}
