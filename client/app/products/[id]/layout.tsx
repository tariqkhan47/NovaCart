import type { Metadata } from "next";
import { getProduct } from "../../../lib/products";
import {
  SITE_NAME,
  SITE_URL,
  seoDescriptionFor,
  seoTitleFor,
  discountPercent,
} from "../../../lib/seo";

/**
 * The search-engine half of a product page.
 *
 * page.tsx is a Client Component — it needs the cart and the reviews — and
 * `generateMetadata` is only supported in Server Components, so the title, the
 * meta description and the structured data are produced here, in the layout
 * that wraps it. Both halves read the product through the same cached loader,
 * so this costs one extra query per request rather than one per tag.
 */

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: `Product not found | ${SITE_NAME}` };
  }

  const title = seoTitleFor(product);
  const description = seoDescriptionFor(product);
  const url = `${SITE_URL}/products/${product._id}`;

  return {
    title,
    description,
    // Without this, every filter and tracking parameter on the URL looks like a
    // separate page with the same content.
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: Props & { children: React.ReactNode }) {
  const { id } = await params;
  const product = await getProduct(id);

  // Everything below is a claim Google may show as a rich result, so it must
  // match the page exactly: the same price, the same availability, and a
  // rating only when real reviews back it.
  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: seoDescriptionFor(product),
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product._id}`,
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      // Only claim a strike-through in search results when the shop really did
      // charge more before — see lib/seo.ts.
      ...(discountPercent(product.price, product.compareAtPrice) !== null && {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          priceType: "https://schema.org/ListPrice",
          priceCurrency: "PKR",
          price: product.compareAtPrice,
        },
      }),
    },
    ...(product.rating &&
      product.reviewCount > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(product.rating.toFixed(1)),
          reviewCount: product.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // Product names come from the supplier, so escape anything that could
          // close the script tag early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      {children}
    </>
  );
}
