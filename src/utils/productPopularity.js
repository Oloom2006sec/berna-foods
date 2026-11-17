const STORAGE_KEY = "berna-customer-product-popularity-v2";

let memoryCounts = {};
const popularityListeners = new Map();
const popularityTimers = new Map();

function readCounts() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return memoryCounts;

    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      memoryCounts = parsed;
    }
  } catch (error) {
    console.error("Load customer product popularity error:", error);
  }

  return memoryCounts;
}

function writeCounts(counts) {
  memoryCounts = counts;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch (error) {
    console.error("Save customer product popularity error:", error);
  }
}

function getStoredCount(productId, counts) {
  const count = Number(counts[productId]);
  return Number.isFinite(count) && count >= 1 ? count : null;
}

function isHoneyProduct(category, productName) {
  return category === "عسل النحل" || productName.includes("عسل");
}

function createInitialCount({ category, productName, kind }) {
  if (kind === "bundle") {
    return 75 + Math.floor(Math.random() * 176);
  }

  if (isHoneyProduct(category, productName)) {
    return 201 + Math.floor(Math.random() * 300);
  }

  return 101 + Math.floor(Math.random() * 300);
}

export function getProductPopularity(productId, options) {
  const counts = readCounts();
  const savedCount = getStoredCount(productId, counts);
  if (savedCount !== null) return savedCount;

  const initialCount = createInitialCount(options);
  writeCounts({ ...counts, [productId]: initialCount });
  return initialCount;
}

export function increaseProductPopularity(productId, options) {
  const counts = readCounts();
  const currentCount =
    getStoredCount(productId, counts) ??
    getProductPopularity(productId, options);
  const nextCount = currentCount + 1 + Math.floor(Math.random() * 3);

  writeCounts({ ...readCounts(), [productId]: nextCount });
  return nextCount;
}

function schedulePopularityIncrease(productId, options) {
  const timerId = window.setTimeout(() => {
    popularityTimers.delete(productId);

    const count = increaseProductPopularity(productId, options);
    const listeners = popularityListeners.get(productId);
    listeners?.forEach((listener) => listener(count));

    if (listeners?.size) {
      schedulePopularityIncrease(productId, options);
    }
  }, 7000 + Math.floor(Math.random() * 8001));

  popularityTimers.set(productId, timerId);
}

export function subscribeToProductPopularity(productId, options, listener) {
  const listeners = popularityListeners.get(productId) || new Set();
  listeners.add(listener);
  popularityListeners.set(productId, listeners);

  if (!popularityTimers.has(productId)) {
    schedulePopularityIncrease(productId, options);
  }

  return () => {
    listeners.delete(listener);

    if (!listeners.size) {
      popularityListeners.delete(productId);
      window.clearTimeout(popularityTimers.get(productId));
      popularityTimers.delete(productId);
    }
  };
}
