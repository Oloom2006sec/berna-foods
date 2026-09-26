import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("berna-wishlist");

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // حفظ المفضلة في LocalStorage
  useEffect(() => {
    localStorage.setItem(
      "berna-wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  // إضافة / إزالة من المفضلة
  function toggleWishlist(product) {
    setWishlist((current) => {
      const exists = current.some(
        (item) =>
          item?.groupId === product?.groupId ||
          item?.id === product?.id ||
          item?.name === product?.name
      );

      if (exists) {
        return current.filter(
          (item) =>
            item?.groupId !== product?.groupId &&
            item?.id !== product?.id &&
            item?.name !== product?.name
        );
      }

      return [...current, product];
    });
  }

  // هل المنتج موجود في المفضلة؟
  function isFavorite(id) {
    return wishlist.some(
      (item) =>
        item?.groupId === id ||
        item?.id === id
    );
  }

  // مسح كل المفضلة
  function clearWishlist() {
    setWishlist([]);
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        toggleWishlist,
        isFavorite,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}