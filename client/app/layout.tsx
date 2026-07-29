import { AuthProvider } from "../context/AuthContext";
import type { Metadata } from "next";
import { Amiri, Inter, Poppins } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "../context/ThemeContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

// For the kalima in the header. Neither Inter nor Poppins carries Arabic
// glyphs, so without this the browser falls back to whatever Arabic face the
// device happens to have — a different shape on every phone, and on the ones
// with none, empty boxes. Amiri is a naskh face that sets the tashkeel
// properly, which a UI font does not.
const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Arsalah — Home Decor, Kitchen, Watches, Fragrances & More",
  description:
    "Shop home decor, kitchen, drinkware, watches, smart watches, fragrances, bags, gadgets, toys and baby products at Arsalah. Cash on Delivery across Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 return (
  <html
    lang="en"
    className={`${inter.variable} ${poppins.variable} ${amiri.variable} h-full antialiased`}
  >
    <body>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>

      {/* Both are no-ops until switched on in the Vercel dashboard. */}
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);
}