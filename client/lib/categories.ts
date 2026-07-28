/**
 * The store's collections.
 *
 * This is the single source of truth: the home page chips and tiles, the
 * /category/[slug] pages, the admin product form and the seed script all read
 * from here, so a collection is added or renamed in exactly one place.
 *
 * `name` is what lives in Product.category in the database, so renaming one
 * means migrating the existing rows (see scripts/recategorize-products.mjs).
 */
export type Category = {
  /** URL segment for /category/[slug] */
  slug: string;
  /** Stored on the product and shown in the UI */
  name: string;
  icon: string;
  /** Used as the page subtitle and the meta description */
  tagline: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "home-decor",
    name: "Home Decor",
    icon: "🛋️",
    tagline:
      "Wall art, showpieces, candles and mood lighting to finish off a room.",
  },
  {
    slug: "kitchen",
    name: "Kitchen",
    icon: "🍳",
    tagline:
      "Choppers, cookware, storage and the small tools that speed up prep.",
  },
  {
    slug: "drinkware",
    name: "Drinkware",
    icon: "🥤",
    tagline:
      "Insulated tumblers, water bottles, travel mugs and their accessories.",
  },
  {
    slug: "watches",
    name: "Watches",
    icon: "⌚",
    tagline:
      "Analog, quartz and digital wrist watches for men, women and couples.",
  },
  {
    slug: "smart-watches",
    name: "Smart Watches",
    icon: "📱",
    tagline:
      "Bluetooth calling, fitness tracking and multi-strap smartwatch bundles.",
  },
  {
    slug: "fragrances-beauty",
    name: "Fragrances & Beauty",
    icon: "🌸",
    tagline:
      "Long lasting perfumes and everyday personal care picks.",
  },
  {
    slug: "fashion-jewelry",
    name: "Fashion & Jewelry",
    icon: "💍",
    tagline:
      "Bracelets, necklaces, charms, belts and wearable everyday style.",
  },
  {
    slug: "bags-travel",
    name: "Bags & Travel",
    icon: "🎒",
    tagline:
      "Backpacks, sling bags, wallets and gear that travels well.",
  },
  {
    slug: "gadgets-electronics",
    name: "Gadgets & Electronics",
    icon: "🔌",
    tagline:
      "Earbuds, rechargeable lights, phone mounts and portable fans.",
  },
  {
    slug: "toys-games",
    name: "Toys & Games",
    icon: "🧸",
    tagline:
      "Remote control cars, plush toys, building blocks and party fun.",
  },
  {
    slug: "learning-stationery",
    name: "Learning & Stationery",
    icon: "✏️",
    tagline:
      "Activity books, puzzle boards, tracing sets and school supplies.",
  },
  {
    slug: "baby-kids",
    name: "Baby & Kids",
    icon: "🍼",
    tagline:
      "Feeding, safety, play mats and furniture for babies and toddlers.",
  },
];

/** Category names in display order — handy for <select> options. */
export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name);

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function getCategoryByName(name: string): Category | undefined {
  return CATEGORIES.find((category) => category.name === name);
}

/**
 * Slug for a stored category name. Products carrying a category we no longer
 * list still get a usable link rather than a broken one.
 */
export function slugifyCategory(name: string): string {
  return (
    getCategoryByName(name)?.slug ??
    name
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}
