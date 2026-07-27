import { AuthProvider } from "../context/AuthContext";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "../context/ThemeContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ProductProvider } from "../context/ProductContext";
import { OrderProvider } from "../context/OrderContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NovaCart",
  description: "Modern Ecommerce Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 return (
  <html
    lang="en"
    className={`${inter.variable} ${poppins.variable} h-full antialiased`}
  >
    <body>
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <WishlistProvider>
                <OrderProvider>
                  {children}
                </OrderProvider>
              </WishlistProvider>
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </body>
  </html>
);
}