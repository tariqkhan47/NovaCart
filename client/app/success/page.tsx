import Link from "next/link";
import { paymentMethodInfo } from "../../lib/payments";
import ClearCart from "./ClearCart";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const one = (value: string | string[] | undefined) =>
  String(Array.isArray(value) ? value[0] : (value ?? ""));

export default async function SuccessPage({ searchParams }: Props) {
  const { payment, status } = await searchParams;

  // Checkout passes the method it used. Anything else in the URL — a stale
  // link, somebody typing — falls through to the Cash on Delivery wording,
  // which promises nothing that has not happened.
  const method = paymentMethodInfo(one(payment));

  const transferred = method?.needsReference ?? false;

  // Set by the Safepay return route, and only ever to "paid" once the
  // signature has been checked. Anything else means the shop cannot yet say
  // the money arrived, so it does not.
  const card = method?.method === "card";
  const cardPaid = card && one(status) === "paid";

  return (
    <main className="page flex items-center justify-center px-4 sm:px-6">
      <ClearCart />

      <div className="panel p-6 sm:p-10 text-center max-w-lg">
        <h1 className="text-5xl mb-4">✅</h1>

        <h2 className="text-3xl font-bold mb-4">
          Order Placed Successfully!
        </h2>

        <p className="text-muted-soft mb-8">
          Thank you for shopping with Arsalah.
          {cardPaid ? (
            <>
              {" "}
              Aap ki card payment mil gayi hai. Order confirm ho chuka hai aur
              jald bhej diya jayega.
            </>
          ) : card ? (
            <>
              {" "}
              Aap ka order mil gaya hai. Card payment confirm hote hi order
              aage barhega — status &ldquo;My Orders&rdquo; mein dikhta rahega.
            </>
          ) : transferred ? (
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
