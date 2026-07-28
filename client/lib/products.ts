// Server-side product reads for the parts of a product page that have to be in
// the HTML Google receives — the <title>, the meta description and the
// structured data. The page itself still fetches through /api/products/[id] for
// the interactive half.

import { cache } from "react";
import mongoose from "mongoose";
import { connectDB } from "./mongodb";
import Product from "@/models/Product";

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
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    try {
      await connectDB();

      const [product] = await Product.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "product",
            as: "reviews",
          },
        },
        {
          $addFields: {
            rating: { $avg: "$reviews.rating" },
            reviewCount: { $size: "$reviews" },
          },
        },
        { $project: { reviews: 0 } },
      ]);

      if (!product) return null;

      return { ...product, _id: String(product._id) } as ProductForPage;
    } catch (error) {
      // A page that renders without its meta tags beats a page that 500s, so
      // the caller falls back to the generic title rather than failing.
      console.error("GET PRODUCT FOR PAGE ERROR:", error);
      return null;
    }
  }
);
