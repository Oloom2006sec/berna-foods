import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "berna-cart";

function readCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeItem(item) {
  return {
    ...item,

    quantity: Math.max(
      1,
      Number(item.quantity) || 1
    ),

    price: Number(item.price) || 0,

    weightGrams:
      Number(item.weightGrams) || 0,

    /*
      Keep the exact SKU and package information.
    */
    sku: item.sku || item.id || "",

    packageType:
      item.packageType || "",

    weight:
      item.weight || "",
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readCart);

  /*
    Save cart
  */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  /*
    Add product / exact Variant
  */
  function addToCart(product) {
    const item = normalizeItem(product);

    /*
      SKU is the unique identifier of the Variant.

      Example:

      عسل الموالح 500 جم بلاستيك
      SKU A

      عسل الموالح 500 جم زجاج
      SKU B

      They must remain separate.
    */
    const key = item.sku || item.id;

    setCart((current) => {
      const existing = current.find(
        (entry) =>
          (entry.sku || entry.id) === key
      );

      if (existing) {
        return current.map((entry) =>
          (entry.sku || entry.id) === key
            ? {
                ...entry,

                quantity:
                  Number(entry.quantity || 0) +
                  Number(item.quantity || 1),
              }
            : entry
        );
      }

      return [...current, item];
    });
  }

  /*
    Increase quantity
  */
  function increaseQuantity(key) {
    setCart((current) =>
      current.map((item) =>
        item.id === key || item.sku === key
          ? {
              ...item,
              quantity:
                Number(item.quantity || 0) + 1,
            }
          : item
      )
    );
  }

  /*
    Decrease quantity
  */
  function decreaseQuantity(key) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === key || item.sku === key
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) - 1,
              }
            : item
        )
        .filter(
          (item) =>
            Number(item.quantity || 0) > 0
        )
    );
  }

  /*
    Remove item completely
  */
  function removeFromCart(key) {
    setCart((current) =>
      current.filter(
        (item) =>
          item.id !== key &&
          item.sku !== key
      )
    );
  }

  /*
    Clear cart
  */
  function clearCart() {
    setCart([]);
  }

  /*
    Total price
  */
  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  /*
    Total number of pieces
    Example:
      2 products × quantities 1 + 3
      = cartCount 4
  */
  const cartCount = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const value = {
    cart,

    cartTotal,

    cartCount,

    addToCart,

    increaseQuantity,

    decreaseQuantity,

    removeFromCart,

    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}