"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { io } from "socket.io-client";

export default function MyListingsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, revenue: 0 });
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("listings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let mounted = true;

    const loadData = async () => {
      const [productsRes, statsRes, ordersRes] = await Promise.all([
        fetch("/api/sell"),
        fetch("/api/my-listings/stats"),
        fetch("/api/seller/orders"),
      ]);
      const productsData = await productsRes.json();
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (mounted) {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setOrderStats(statsData);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setLoading(false);
      }
    };

    loadData();

    const socket = io();
    socket.on("products:new", (product) => {
      if (String(product.seller_id) === String(session.user.id))
        setProducts((prev) => [product, ...prev]);
    });
    socket.on("products:updated", (updated) => {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    });
    socket.on("products:deleted", ({ id }) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    });
    socket.on("orders:new", (order) => {
      if (order.items?.some((i) => String(i.seller_id) === String(session.user.id))) {
        setOrders((prev) => [{ ...order, id: order.orderId, status: "pending" }, ...prev]);
      }
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [session?.user?.id]);

  async function handleOrderStatus(id, status) {
    await fetch(`/api/seller/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_visible === 1).length,
    totalOrders: orderStats.totalOrders,
    revenue: orderStats.revenue,
  };

  const filtered = filter === "all" ? products
    : products.filter((p) => filter === "visible" ? p.is_visible === 1 : p.is_visible === 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  async function handleDelete(id) {
    if (!confirm("Delete this listing?")) return;
    await fetch(`/api/my-listings/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleVisibility(id, current) {
    await fetch(`/api/my-listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: current ? 0 : 1 }),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_visible: current ? 0 : 1 } : p)));
  }

  if (!session) return <div className="min-h-screen flex items-center justify-center text-gray-400">Please log in.</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Listings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your products and orders</p>
        </div>
        <Link href="/sell" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">
          + Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Listings" value={stats.total} />
        <StatCard label="Active" value={stats.active} color="green" />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Revenue" value={`₱${Number(stats.revenue).toLocaleString()}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === "listings" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Listings
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "orders" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Orders
          {pendingOrders > 0 && (
            <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-bold">
              {pendingOrders}
            </span>
          )}
        </button>
      </div>

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <>
          <div className="flex gap-2 mb-4">
            {["all", "visible", "hidden"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                  filter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}>
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No listings found. <Link href="/sell" className="text-blue-400 hover:underline">Sell something</Link>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3">Price</th>
                    <th className="text-left px-4 py-3">Stock</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image_url && (
                            <Image src={p.image_url} alt={p.name} width={40} height={40} className="rounded-lg object-cover w-10 h-10" />
                          )}
                          <span className="font-medium text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">₱{Number(p.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-300">{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.is_visible ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"
                        }`}>
                          {p.is_visible ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleVisibility(p.id, p.is_visible)}
                            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition">
                            {p.is_visible ? "Hide" : "Show"}
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <>
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No orders yet.</div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                    <th className="text-left px-4 py-3">Order ID</th>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3">Buyer</th>
                    <th className="text-left px-4 py-3">Qty</th>
                    <th className="text-left px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 font-mono text-gray-400">#{o.id}</td>
                      <td className="px-4 py-3 text-white">{o.product_name}</td>
                      <td className="px-4 py-3">
                        <p className="text-white">{o.buyer_name}</p>
                        <p className="text-xs text-gray-500">{o.buyer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{o.quantity}</td>
                      <td className="px-4 py-3 text-white font-medium">₱{Number(o.total).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === "pending"   ? "bg-yellow-900/50 text-yellow-400"
                          : o.status === "confirmed" ? "bg-blue-900/50 text-blue-400"
                          : o.status === "rejected" ? "bg-red-900/50 text-red-400"
                          : o.status === "shipped"  ? "bg-purple-900/50 text-purple-400"
                          : "bg-green-900/50 text-green-400"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {o.status === "pending" && (
                            <>
                              <button onClick={() => handleOrderStatus(o.id, "confirmed")}
                                className="text-xs px-2 py-1 rounded bg-green-900/50 hover:bg-green-800 text-green-400 transition">
                                ✅ Confirm
                              </button>
                              <button onClick={() => handleOrderStatus(o.id, "rejected")}
                                className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition">
                                ❌ Reject
                              </button>
                            </>
                          )}
                          {o.status === "confirmed" && (
                            <button onClick={() => handleOrderStatus(o.id, "shipped")}
                              className="text-xs px-2 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-400 transition">
                              🚚 Ship
                            </button>
                          )}
                          {o.status === "shipped" && (
                            <button onClick={() => handleOrderStatus(o.id, "completed")}
                              className="text-xs px-2 py-1 rounded bg-blue-900/50 hover:bg-blue-800 text-blue-400 transition">
                              ✔ Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = { green: "text-green-400", yellow: "text-yellow-400", blue: "text-blue-400" };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${colorMap[color] || "text-white"}`}>{value}</p>
    </div>
  );
}