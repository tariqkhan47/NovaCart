// Server-side product reads for the parts of a product page that have to be in
// the HTML Google receives — the <title>, the meta description and the
// structured data. The page itself still fetches through /api/products/[id] for
// the interactive half.

import { cache } from "react";
import { prisma } from "./db";
import { parseId } from "./ids";
import { serializeProduct } from "./serialize";

export type ProductForPage = {
  _id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image: string;
  description: string;
  detailHtml?: string;
  seoDescription?: string;
  stock: number;
  rating: number | null;
  reviewCount: number;
};

/**
 * One product with its rating, or null if the id is unknown.
 *
 * Wrapped in React's `cache` so the metadata pass and the render pass of the
 * same request share a single database round trip instead of making two.
 */
export const getProduct = cache(
  async (id: string): Promise<ProductForPage | null> => {
    const productId = parseId(id);
    if (productId === null) return null;

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) return null;

      const rating = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return serializeProduct({
        ...product,
        rating: rating._avg.rating,
        reviewCount: rating._count.rating,
      }) as ProductForPage;
    } catch (error) {
      // A page that renders without its meta tags beats a page that 500s, so
      // the caller falls back to the generic title rather than failing.
      console.error("GET PRODUCT FOR PAGE ERROR:", error);
      return null;
    }
  }
);
