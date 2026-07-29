import Link from "next/link";
import { paymentMethodInfo } from "../../lib/payments";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const { payment } = await searchParams;

  // Checkout passes the method it used. Anything else in the URL — a stale
  // link, somebody typing — falls through to the Cash on Delivery wording,
  // which promises nothing that has not happened.
  const method = paymentMethodInfo(
    String(Array.isArray(payment) ? payment[0] : (payment ?? ""))
  );

  const transferred = method?.needsReference ?? false;

  return (
    <main className="page flex items-center justify-center px-4 sm:px-6">
      <div className="panel p-6 sm:p-10 text-center max-w-lg">
        <h1 className="text-5xl mb-4">✅</h1>

        <h2 className="text-3xl font-bold mb-4">
          Order Placed Successfully!
        </h2>

        <p className="text-muted-soft mb-8">
          Thank you for shopping with Arsalah.
          {transferred ? (
            <>
              {" "}
              Aap ka {method?.label} payment check hote hi order confirm kar
              diya jayega — aam taur par kuch ghanton mein. Status &ldquo;My
              Orders&rdquo; mein dikhta rahega.
            </>
          ) : (
            <> Your order has been received successfully.</>
          )}
        </p>

        <Link href="/">
          <button className="btn btn-primary btn-lg">
            Continue Shopping
          </button>
        </Link>
      </div>
    </main>
  );
}
