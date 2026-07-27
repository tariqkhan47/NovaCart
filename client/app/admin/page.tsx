"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import { products } from "../../data/products";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrderContext";

export default function AdminPage() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { orders } = useOrders();
  const { logout, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  const totalRevenue = orders.reduce(
  (sum, order) => sum + order.total,
  0
);

const pendingOrders = orders.filter(
  (order) => order.status === "Pending"
).length;

const deliveredOrders = orders.filter(
  (order) => order.status === "Delivered"
).length;

  const salesData = [
    { month: "Jan", sales: 1200 },
    { month: "Feb", sales: 2100 },
    { month: "Mar", sales: 1800 },
    { month: "Apr", sales: 2800 },
    { month: "May", sales: 3500 },
    { month: "Jun", sales: 4200 },
  ];

  return (
    <main className="page p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="eyebrow">NovaCart Admin</span>
            <h1 className="text-4xl font-bold mt-2">
              📊 Admin Dashboard
            </h1>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
            className="btn btn-danger btn-sm"
          >
            Logout
          </button>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

  {[
    { label: "📦 Products", value: products.length, tone: "text-brand-600" },
    { label: "📦 Orders", value: orders.length, tone: "text-ink-700 dark:text-brand-200" },
    { label: "⏳ Pending", value: pendingOrders, tone: "text-brand-700" },
    { label: "✅ Delivered", value: deliveredOrders, tone: "text-success" },
    { label: "🛒 Cart", value: cart.length, tone: "text-brand-500" },
    { label: "❤️ Wishlist", value: wishlist.length, tone: "text-danger" },
    {
      label: "💰 Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      tone: "text-brand-600",
    },
  ].map((stat) => (
    <div key={stat.label} className="card card-hover p-6">
      <h2 className="text-lg font-semibold">{stat.label}</h2>
      <p className={`text-4xl font-bold mt-3 ${stat.tone}`}>
        {stat.value}
      </p>
    </div>
  ))}

</div>

        {/* Chart */}

        <div className="panel p-6 mt-10">

          <h2 className="text-2xl font-bold mb-6">
            📈 Sales Analytics
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#f0a500" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* Actions */}

        <div className="panel p-6 mt-10">

          <h2 className="text-2xl font-bold mb-6">
            ⚙️ Admin Actions
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <Link href="/admin/add-product">
              <button className="btn btn-primary btn-block py-6">
                ➕ Add Product
              </button>
            </Link>

            <Link href="/admin/edit-product">
              <button className="btn btn-dark btn-block py-6">
                ✏️ Edit Product
              </button>
            </Link>

            <Link href="/admin/delete-product">
              <button className="btn btn-danger btn-block py-6">
                🗑 Delete Product
              </button>
            </Link>

            <Link href="/admin/orders">
              <button className="btn btn-outline btn-block py-6">
                📦 View Orders
              </button>
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}