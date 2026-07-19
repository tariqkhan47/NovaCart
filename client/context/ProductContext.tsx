"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { products as initialProducts } from "../data/products";

export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
};

type ProductContextType = {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      const savedProducts = localStorage.getItem("products");

      if (savedProducts) {
        return JSON.parse(savedProducts);
      }
    }

    return initialProducts as Product[];
  });

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

 const addProduct = (product: Product) => {
  setProducts((prev) => {
    const updated = [...prev, product];
    localStorage.setItem("products", JSON.stringify(updated));
    return updated;
  });
};

  const updateProduct = (updatedProduct: Product) => {
  setProducts((prev) => {
    const updated = prev.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    );

    localStorage.setItem("products", JSON.stringify(updated));

    return updated;
  });
};

  const deleteProduct = (id: number) => {
  setProducts((prev) => {
    const updated = prev.filter((product) => product.id !== id);

    localStorage.setItem("products", JSON.stringify(updated));

    return updated;
  });
};

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductProvider"
    );
  }

  return context;
}