"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  addToWishlist: (product: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("novacart-wishlist");

    if (saved) {
      setWishlist(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "novacart-wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  function addToWishlist(product: WishlistItem) {
    const exists = wishlist.find(
      (item) => item.id === product.id
    );

    if (!exists) {
      setWishlist((prev) => [...prev, product]);
    }
  }

  function removeFromWishlist(id: string) {
    setWishlist((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}