export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10 mt-10">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold">NovaCart</h2>
          <p className="mt-3 text-gray-400">
            Your one-stop shop for quality products.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="#">Home</a></li>
            <li><a href="#">Products</a></li>
            <li><a href="#">Categories</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Contact</h3>
          <p>info@novacart.com</p>
          <p>+92 300 1234567</p>
          <p>Pakistan</p>
        </div>
      </div>
    </footer>
  );
}