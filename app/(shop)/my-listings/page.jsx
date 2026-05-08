"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { io } from "socket.io-client";

export default function MyListingsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, revenue: 0 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    let mounted = true;

    const loadData = async () => {
      const [productsRes, statsRes] = await Promise.all([
        fetch("/api/sell"),
        fetch("/api/my-listings/stats"),
      ]);
      const productsData = await productsRes.json();
      const statsData = await statsRes.json();

      if (mounted) {
        setProducts(productsData);
        setOrderStats(statsData);
        setLoading(false);
      }
    };

    loadData();

    const socket = io();
    socket.on("products:new", (product) => {
      if (product.seller_id === session.user.id)
        setProducts((prev) => [product, ...prev]);
    });
    socket.on("products:updated", (updated) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    });
    socket.on("products:deleted", ({ id }) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [session?.user?.id]);

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_visible === 1).length,
    totalOrders: orderStats.totalOrders,
    revenue: orderStats.revenue,
  };

  const filtered =
    filter === "all"
      ? products
      : products.filter((p) =>
          filter === "visible" ? p.is_visible === 1 : p.is_visible === 0
        );

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
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_visible: current ? 0 : 1 } : p))
    );
  }

  if (!session)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Please log in.
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Listings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your products</p>
        </div>
        <Link
          href="/sell"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          + Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Listings" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Revenue" value={`₱${Number(stats.revenue).toLocaleString()}`} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["all", "visible", "hidden"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No listings found.{" "}
          <Link href="/sell" className="text-blue-400 hover:underline">
            Sell something
          </Link>
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
                <tr
                  key={p.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url && (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover w-10 h-10"
                        />
                      )}
                      <span className="font-medium text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    ₱{Number(p.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.is_visible
                          ? "bg-green-900/50 text-green-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {p.is_visible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleVisibility(p.id, p.is_visible)}
                        className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                      >
                        {p.is_visible ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-400 transition"
                      >
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
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}