export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-50 pt-14 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 md:grid-cols-3 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Nova<span className="text-brand-400">Cart</span>
          </h2>
          <p className="mt-3 text-ink-100/80">
            Your one-stop shop for quality products.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-white">Quick Links</h3>
          <ul className="space-y-2 text-ink-100/80">
            <li><a href="#" className="hover:text-brand-400 transition">Home</a></li>
            <li><a href="#" className="hover:text-brand-400 transition">Products</a></li>
            <li><a href="#" className="hover:text-brand-400 transition">Categories</a></li>
            <li><a href="#" className="hover:text-brand-400 transition">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-white">Contact</h3>
          <div className="space-y-2 text-ink-100/80">
            <p>info@novacart.com</p>
            <p>+92 300 1234567</p>
            <p>Pakistan</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-white/10 text-sm text-ink-100/60">
        © {new Date().getFullYear()} NovaCart. All rights reserved.
      </div>
    </footer>
  );
}
