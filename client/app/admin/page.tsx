"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import type { Order } from "../../types/order";
import { formatPrice } from "../../lib/currency";

export default function AdminPage() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { logout, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));

    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProductCount(data.length))
      .catch(() => setProductCount(0));
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  const liveOrders = orders.filter(
    (order) => order.status !== "Cancelled"
  );

  const totalRevenue = liveOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  // Revenue per month, built from real orders.
  const salesByMonth = new Map<string, number>();

  for (const order of liveOrders) {
    const key = new Date(order.createdAt).toLocaleString("en", {
      month: "short",
      year: "2-digit",
    });

    salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + order.total);
  }

  const salesData = Array.from(salesByMonth, ([month, sales]) => ({
    month,
    sales,
  }));

  return (
    <main className="page p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <span className="eyebrow">NovaCart Admin</span>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2">
              📊 Admin Dashboard
            </h1>
          </div>

          <button
            onClick={async () => {
              await logout();
              router.push("/admin/login");
              router.refresh();
            }}
            className="btn btn-danger btn-sm"
          >
            Logout
          </button>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

  {[
    { label: "📦 Products", value: productCount, tone: "text-brand-600" },
    { label: "📦 Orders", value: orders.length, tone: "text-ink-700 dark:text-brand-200" },
    { label: "⏳ Pending", value: pendingOrders, tone: "text-brand-700" },
    { label: "✅ Delivered", value: deliveredOrders, tone: "text-success" },
    { label: "🛒 Cart", value: cart.length, tone: "text-brand-500" },
    { label: "❤️ Wishlist", value: wishlist.length, tone: "text-danger" },
    {
      label: "💰 Revenue",
      value: formatPrice(totalRevenue),
      tone: "text-brand-600",
    },
  ].map((stat) => (
    <div key={stat.label} className="card card-hover p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold">{stat.label}</h2>
      {/* break-words keeps a long revenue figure inside its card on a phone. */}
      <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 break-words ${stat.tone}`}>
        {stat.value}
      </p>
    </div>
  ))}

</div>

        {/* Chart */}

        <div className="panel p-4 sm:p-6 mt-10">

          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            📈 Sales Analytics
          </h2>

          {salesData.length === 0 ? (
            <p className="text-muted-soft text-center py-16">
              No sales yet — the chart fills in as orders come in.
            </p>
          ) : (
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
          )}

        </div>

        {/* Actions */}

        <div className="panel p-4 sm:p-6 mt-10">

          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            ⚙️ Admin Actions
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">

            <Link href="/admin/add-product">
              <button className="btn btn-primary btn-block py-4 sm:py-6 text-sm sm:text-base">
                ➕ Add Product
              </button>
            </Link>

            <Link href="/admin/edit-product">
              <button className="btn btn-dark btn-block py-4 sm:py-6 text-sm sm:text-base">
                ✏️ Edit Product
              </button>
            </Link>

            <Link href="/admin/delete-product">
              <button className="btn btn-danger btn-block py-4 sm:py-6 text-sm sm:text-base">
                🗑 Delete Product
              </button>
            </Link>

            <Link href="/admin/orders">
              <button className="btn btn-outline btn-block py-4 sm:py-6 text-sm sm:text-base">
                📦 View Orders
              </button>
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}