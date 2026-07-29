import type { Metadata } from "next";
import CollectionsView from "./CollectionsView";

export const metadata: Metadata = {
  title: "Collections — Arsalah",
  description:
    "Browse Arsalah by collection: home decor, kitchen, drinkware, watches, smart watches, fragrances, fashion, bags, gadgets, toys, stationery and baby products.",
};

export default function CollectionsPage() {
  return <CollectionsView />;
}
