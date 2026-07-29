import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "../../../lib/categories";
import CategoryView from "./CategoryView";

type Props = {
  params: Promise<{ slug: string }>;
};

// The collections are a fixed list, so every category page can be prerendered.
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "Collection not found — Arsalah" };
  }

  return {
    title: `${category.name} — Arsalah`,
    description: category.tagline,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) notFound();

  return <CategoryView category={category} />;
}
