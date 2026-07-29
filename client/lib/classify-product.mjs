// Working out which of the shop's collections a product belongs in, from its
// name alone.
//
// Lives here rather than in a script because three of them need it: the
// re-categoriser, the picker that chooses new stock off the supplier, and
// anything added by hand later. One copy means a product cannot land in
// different collections depending on which script put it there.
//
// Plain .mjs for the same reason as product-copy.mjs — the scripts cannot
// import TypeScript.

// First rule that matches wins, so the specific patterns come before the
// broad ones ("smart watch" before "watch", "water bottle" before "bottle").
//
// Every \b here is load-bearing. A pattern written as `ring\b` matches the ring
// inside "Inspiring", which put a whole shelf of motivational wall art into
// Fashion & Jewelry — the supplier's names are long strings of adjectives, so a
// keyword without both boundaries will find itself somewhere.
export const RULES = [
  [/smart\s*watch|smartwatch|fitness tracker|bluetooth call/i, "Smart Watches"],
  [/\bwatch(es)?\b|wrist ?watch|timepiece/i, "Watches"],

  // Wall pieces come first because their names also carry "educational",
  // "inspiring" and "elegant", each of which belongs to a later rule.
  [
    /wall (art|decor|frame|hanging)|photo ?tile|canvas frame|wall sticker/i,
    "Home Decor",
  ],

  [
    /perfume|parfum|fragrance|eau de|cologne|lip balm|lipstick|makeup|eyeliner|kajal|mascara|nail polish|foundation stick|concealer|teeth whitening|whitening pen|toothpaste|shampoo|soap|skin care|lotion|face wash|serum/i,
    "Fragrances & Beauty",
  ],
  [
    /tumbler|water bottle|drinking bottle|thermos|travel mug|sipper|straw|flask|drinkware/i,
    "Drinkware",
  ],
  [
    // "pouch" needs saying what kind: on its own it matches "50pc in 1 pouch",
    // which is how a box of kitchen wipes is packaged, not a bag.
    /backpack|sling bag|handbag|shoulder bag|shoe bag|shoe (cleaning|care|polish|shine|wipes)|wallet|luggage|suitcase|passport|(travel|storage|makeup|cosmetic|phone|coin|packing) pouch|carry case|camping chair|folding stool/i,
    "Bags & Travel",
  ],
  [
    // The phone-accessory pattern allows a couple of words in the middle:
    // these are sold as "Mobile Bubble Grip" and "Phone Strong Holder" as often
    // as they are sold as "phone holder".
    /earbud|earphone|headphone|airpods|power ?bank|(phone|mobile)(\s+\w+){0,2}\s+(holder|grip|mount|bracket|stand)|tv (wall )?(mount|bracket|stand)|data cable|charging cable|charger|led light|flash ?light|head ?lamp|torch|camping (bulb|lamp)|emergency light|\bfan\b|speaker|usb/i,
    "Gadgets & Electronics",
  ],
  [
    /baby|infant|toddler|feeder|nappy|diaper|play mat|kids chair|pram|stroller/i,
    "Baby & Kids",
  ],
  [
    /workbook|tracing|alphabet|phonics|abc|stationery|pencil|\bpens?\b|notebook|geometry|coloring book|colouring book|painting book|learning (toy|book|tablet)|puzzle board|educational/i,
    "Learning & Stationery",
  ],
  [
    // "bubble" alone is a spirit level on a TV mount and a suction grip on a
    // phone holder before it is ever a toy.
    /\btoys?\b|plush|doll|rc car|remote control car|building block|board game|jigsaw|bubble (gun|maker|machine|blower|wand)|fidget/i,
    "Toys & Games",
  ],
  [
    /bracelet|necklace|pendant|bangle|earring|\bring\b|jewel|\bbelt\b|\bbra\b|brassiere|keychain|charm|scarf|\bsuits?\b/i,
    "Fashion & Jewelry",
  ],
  [
    // Household cleaning lives here: almost all of it is for the kitchen, and
    // the shop has no cupboard of its own for it.
    /kitchen|cookware|sauce ?pan|chopper|slicer|grater|knife|ice cube|mixing bowl|blender|whisk|spice|measuring (cup|spoon)|sink|jar opener|food (processor|storage)|stain remover|grease (cleaner|remover)|cleaning (powder|wipes)|dish ?wash|degreaser|countertop cleaner/i,
    "Kitchen",
  ],
  [
    /decor|showpiece|candle|vase|ornament|night lamp|night light|projector|diffuser|ashtray|tissue box|frame|door ?mat|shelf liner/i,
    "Home Decor",
  ],
];

/** The collection this product belongs in, or null if no rule matches. */
export function classify(name) {
  for (const [pattern, category] of RULES) {
    if (pattern.test(name)) return category;
  }
  return null;
}
