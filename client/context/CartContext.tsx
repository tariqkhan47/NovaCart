"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { trackTikTok } from "../lib/tiktok";

type CartItem = {
  id: string
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];

  addToCart: (
    product: Omit<CartItem, "quantity">
  ) => void;

  removeFromCart: (id: string) => void;

  increaseQuantity: (id: string) => void;

  decreaseQuantity: (id: string) => void;

  clearCart: () => void;
};
const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("novacart-cart");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "novacart-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  function addToCart(product: Omit<CartItem, "quantity">) {
    // Reported here rather than at each button, so the product page, the
    // cards and "Buy it now" all count the same way and a new button added
    // later cannot quietly go unreported.
    trackTikTok("AddToCart", {
      content_id: product.id,
      content_name: product.name,
      content_type: "product",
      quantity: 1,
      price: product.price,
      value: product.price,
    });

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(id: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(id: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
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