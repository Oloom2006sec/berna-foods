const STORAGE_KEY = "berna-customer-product-popularity-v2";
const DAILY_ACTIVITY_KEY = "berna-customer-product-popularity-daily-v1";

let memoryCounts = {};
const popularityListeners = new Map();
const popularityOptions = new Map();
let dailyActivityTimer = null;

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

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readDailyActivity() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(DAILY_ACTIVITY_KEY) || "null"
    );
    if (
      parsed &&
      parsed.date === getLocalDateKey() &&
      Number.isInteger(parsed.count) &&
      parsed.count >= 0 &&
      Array.isArray(parsed.productIds)
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("Load daily product popularity error:", error);
  }

  return { date: getLocalDateKey(), count: 0, productIds: [] };
}

function writeDailyActivity(activity) {
  try {
    window.localStorage.setItem(DAILY_ACTIVITY_KEY, JSON.stringify(activity));
  } catch (error) {
    console.error("Save daily product popularity error:", error);
  }
}

function scheduleDailyPopularityIncrease() {
  if (dailyActivityTimer !== null) return;

  const activity = readDailyActivity();
  if (activity.count >= 2) return;

  const delay = 60 * 60 * 1000 + Math.floor(Math.random() * 61 * 60 * 1000);

  dailyActivityTimer = window.setTimeout(() => {
    dailyActivityTimer = null;

    const latestActivity = readDailyActivity();
    if (latestActivity.count >= 2) return;

    const candidates = [...popularityListeners.entries()]
      .filter(([, listeners]) => listeners.size > 0)
      .map(([productId, listeners]) => ({
        productId,
        listeners,
        options: popularityOptions.get(productId),
      }))
      .filter(
        ({ productId }) =>
          !latestActivity.productIds.includes(productId)
      );

    if (candidates.length) {
      const candidate =
        candidates[Math.floor(Math.random() * candidates.length)];
      const count = increaseProductPopularity(
        candidate.productId,
        candidate.options
      );
      candidate.listeners.forEach((listener) => listener(count));

      writeDailyActivity({
        date: getLocalDateKey(),
        count: latestActivity.count + 1,
        productIds: [
          ...latestActivity.productIds,
          candidate.productId,
        ],
      });
    }

    if (readDailyActivity().count < 2) {
      scheduleDailyPopularityIncrease();
    }
  }, delay);
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
  const nextCount = currentCount + 1;

  writeCounts({ ...readCounts(), [productId]: nextCount });
  return nextCount;
}

export function subscribeToProductPopularity(productId, options, listener) {
  const listeners = popularityListeners.get(productId) || new Set();
  listeners.add(listener);
  popularityListeners.set(productId, listeners);
  popularityOptions.set(productId, options);
  scheduleDailyPopularityIncrease();

  return () => {
    listeners.delete(listener);

    if (!listeners.size) {
      popularityListeners.delete(productId);
      popularityOptions.delete(productId);
    }
  };
}
