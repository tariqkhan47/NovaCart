import type { Metadata } from "next";
import UnsubscribeView from "./UnsubscribeView";

export const metadata: Metadata = {
  title: "Unsubscribe — Arsalah",
  description: "Stop marketing emails from Arsalah.",
  // Nothing here is worth indexing, and the token should stay out of search.
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <UnsubscribeView token={token ?? ""} />;
}
