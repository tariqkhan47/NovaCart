import { AuthProvider } from "../context/AuthContext";
import type { Metadata } from "next";
import { Amiri, Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "../context/ThemeContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";

// Body and headings both. The SaaS look this theme is built on sets the
// whole page in one grotesk and separates the headings by weight and tight
// tracking rather than by a second face — so there is no display font to
// load beside this one.
const inter = Inter({
  variable: "--font-inter",
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
  // Kept under 155 characters so search results do not cut it off mid-sentence,
  // which is why the category list is shorter than the shop's full range.
  description:
    "Shop home decor, kitchen, drinkware, watches, fragrances, bags, gadgets and toys at Arsalah. Cash on Delivery, EasyPaisa or bank transfer across Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 return (
  <html
    lang="en"
    className={`${inter.variable} ${amiri.variable} h-full antialiased`}
  >
    <body>
      {/* Runs while the page is still parsing, before anything is painted.
          The white theme is the shop's own look, so the server sends <html>
          bare; a visitor who has switched to dark needs the class put on
          before the first frame, or every page load flashes white at them.
          Wrapped in try/catch because localStorage throws outright in a
          browser with site data blocked, which would take the page with it. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(localStorage.getItem('theme')==='dark')" +
            "document.documentElement.classList.add('dark')}catch(e){}",
        }}
      />
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </body>
  </html>
);
}