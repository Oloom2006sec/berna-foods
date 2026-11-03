import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { products } from "../data/products";
import {
  getDefaultStoreSettings,
  loadStoreSettings,
  saveStoreSettings as persistStoreSettings,
} from "../services/storeSettingsService";
import { setProductOffers } from "../utils/promotionPricing";

const StoreSettingsContext = createContext(null);

function applyStoreSettings(settings) {
  const pricesBySku = new Map(
    settings.prices.map((price) => [price.sku, price])
  );

  for (const product of products) {
    const savedPrice = pricesBySku.get(product.sku);
    if (!savedPrice) {
      continue;
    }

    product.price = savedPrice.price;
    product.minOfferPrice = savedPrice.minOfferPrice;
  }

  setProductOffers(settings.productOffers);
}

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(getDefaultStoreSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const savedSettings = await loadStoreSettings();
        if (!active) {
          return;
        }

        if (savedSettings) {
          applyStoreSettings(savedSettings);
          setSettings(savedSettings);
        }
      } catch (loadError) {
        console.error("Load store settings error:", loadError);
        if (active) {
          setError(loadError.message || "تعذر تحميل إعدادات الأسعار والعروض.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const saveSettings = useCallback(async (nextSettings) => {
    const savedSettings = await persistStoreSettings(nextSettings);
    applyStoreSettings(savedSettings);
    setSettings(savedSettings);
    setError("");
    return savedSettings;
  }, []);

  const value = useMemo(
    () => ({ settings, loading, error, saveSettings }),
    [settings, loading, error, saveSettings]
  );

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error(
      "useStoreSettings must be used within StoreSettingsProvider"
    );
  }

  return context;
}
