/**
 * Finding one product in a catalog of five hundred, from the admin screens.
 *
 * Shared by the edit and delete lists so the two behave identically — the
 * owner should not have to learn that one of them narrows differently from
 * the other, least of all on the screen that throws things away.
 */

/** How many rows a list renders before it asks for a narrower search. */
export const ADMIN_LIST_LIMIT = 40;

type Searchable = {
  name: string;
  category?: string;
};

/**
 * Every term has to hit somewhere, rather than any of them.
 *
 * On 502 products an OR search widens with each word typed, which is the
 * opposite of what typing more words means: "gold watch" finds four products
 * this way and fifty-two the other. Category is searched alongside the name
 * because half the time what is remembered is "that kitchen thing" rather
 * than any word in the supplier's two-hundred-character title.
 */
export function searchProducts<T extends Searchable>(
  products: T[],
  query: string
): T[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return products;

  return products.filter((product) => {
    const haystack = `${product.name} ${product.category ?? ""}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
