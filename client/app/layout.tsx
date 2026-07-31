import { AuthProvider } from "../context/AuthContext";
import type { Metadata } from "next";
import { Amiri, Inter, Plus_Jakarta_Sans } from "next/font/google";
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

// Headings. Poppins was the geometric round face the old amber theme was
// built on; this one is a grotesk with much tighter apertures, which is what
// makes the big headings read as a single dense block rather than a row of
// circles.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
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
    className={`dark ${inter.variable} ${jakarta.variable} ${amiri.variable} h-full antialiased`}
  >
    <body>
      {/* Runs while the page is still parsing, before anything is painted.
          The server always sends <html class="dark"> because that is the
          shop's look; a visitor who has switched to light needs it taken off
          before the first frame, or every page load flashes black at them.
          Wrapped in try/catch because localStorage throws outright in a
          browser with site data blocked, which would take the page with it. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(localStorage.getItem('theme')==='light')" +
            "document.documentElement.classList.remove('dark')}catch(e){}",
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

      {/* Both are no-ops until switched on in the Vercel dashboard. */}
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);
}