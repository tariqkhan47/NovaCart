import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page flex items-center justify-center px-4 sm:px-6">
      <div className="panel p-6 sm:p-10 text-center max-w-lg">
        <p className="eyebrow">Error 404</p>

        <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-4">
          Page not found
        </h1>

        <p className="text-muted-soft mb-8">
          The page you were looking for doesn&apos;t exist, or it may have
          been moved.
        </p>

        <Link href="/">
          <button className="btn btn-primary btn-lg">
            Back to Shop
          </button>
        </Link>
      </div>
    </main>
  );
}
