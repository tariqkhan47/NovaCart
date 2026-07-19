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
  const { logout, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login");
    }
  }, [isAdmin, router]);

  if (!isAdmin) return null;

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
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            📊 Admin Dashboard
          </h1>

          <button
            onClick={() => {
              logout();
              router.push("/admin/login");
            }}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">📦 Products</h2>
    <p className="text-4xl font-bold text-blue-600 mt-3">
      {products.length}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">📦 Orders</h2>
    <p className="text-4xl font-bold text-indigo-600 mt-3">
      {orders.length}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">⏳ Pending</h2>
    <p className="text-4xl font-bold text-orange-500 mt-3">
      {pendingOrders}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">✅ Delivered</h2>
    <p className="text-4xl font-bold text-green-600 mt-3">
      {deliveredOrders}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">🛒 Cart</h2>
    <p className="text-4xl font-bold text-cyan-600 mt-3">
      {cart.length}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">❤️ Wishlist</h2>
    <p className="text-4xl font-bold text-red-500 mt-3">
      {wishlist.length}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-lg font-semibold">💰 Revenue</h2>
    <p className="text-4xl font-bold text-yellow-500 mt-3">
      ${totalRevenue.toFixed(2)}
    </p>
  </div>

</div>

        {/* Chart */}

        <div className="bg-white rounded-xl shadow p-6 mt-10">

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
              <Bar dataKey="sales" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* Actions */}

        <div className="bg-white rounded-xl shadow p-6 mt-10">

          <h2 className="text-2xl font-bold mb-6">
            ⚙️ Admin Actions
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <Link href="/admin/add-product">
              <div className="bg-blue-600 text-white text-center py-6 rounded-xl hover:bg-blue-700 cursor-pointer">
                ➕ Add Product
              </div>
            </Link>

            <Link href="/admin/edit-product">
              <div className="bg-green-600 text-white text-center py-6 rounded-xl hover:bg-green-700 cursor-pointer">
                ✏️ Edit Product
              </div>
            </Link>

            <Link href="/admin/delete-product">
              <div className="bg-red-600 text-white text-center py-6 rounded-xl hover:bg-red-700 cursor-pointer">
                🗑 Delete Product
              </div>
            </Link>

            <Link href="/admin/orders">
              <div className="bg-purple-600 text-white text-center py-6 rounded-xl hover:bg-purple-700 cursor-pointer">
                📦 View Orders
              </div>
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}