import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    // What the shop charged for this product before the current price — shown
    // struck through beside it. Only ever set to a price the product was
    // genuinely sold at, so the saving on the card is one a shopper could
    // actually have paid; a made-up "was" price is a false discount claim.
    // Left unset means no crossed-out price, which is the default.
    //
    // That it clears the current price is enforced by normalizeComparePrice in
    // lib/seo.ts, which every write goes through: a schema validator cannot do
    // it, because on findByIdAndUpdate `this` is the query rather than the
    // document, so the price to compare against is not in reach.
    compareAtPrice: {
      type: Number,
      min: 0,
    },

    category: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    // The <meta name="description"> for the product page, and the snippet
    // Google shows under the link. Search engines cut these off around 160
    // characters, and the supplier's own copy is either far longer or a
    // sentence fragment, so it gets its own field rather than reusing
    // description. Unset falls back to a line built from the product's own
    // details — see lib/seo.ts.
    seoDescription: {
      type: String,
      maxlength: 200,
      trim: true,
    },

    // The supplier's full write-up, as HTML: paragraphs, feature lists and the
    // photos that go between them. `description` stays the one-line summary
    // shown beside the price, because that is what a card and a cart row need;
    // this is the long section further down the product page, and most of what
    // convinces someone to buy is in here.
    //
    // Always stored already cleaned. Every write goes through sanitizeHtml in
    // lib/rich-text.mjs, which drops scripts, event handlers and every
    // attribute bar an image's src and alt — the copy is written by other
    // people on the supplier's portal, so untrusted markup rendered raw would
    // be a stored XSS hole on every product page.
    detailHtml: {
      type: String,
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    // Hand-picked for the Featured Products row on the home page.
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product =
  models.Product || mongoose.model("Product", ProductSchema);

export default Product;