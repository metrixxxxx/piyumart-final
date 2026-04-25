"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json();
        if (!data.admin) {
          router.push("/admin/login");
          return;
        }
        setAdmin(data.admin);
        fetchData();
      } catch (err) {
        router.push("/admin/login");
      }
    }
    checkAdmin();
  }, []);

  async function fetchData() {
    const [productsRes, usersRes, ordersRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/admin/users"),
      fetch("/api/admin/orders"),
    ]);
    const productsData = await productsRes.json();
    const usersData = await usersRes.json();
    const ordersData = await ordersRes.json();
    setProducts(Array.isArray(productsData) ? productsData : []);
    setUsers(Array.isArray(usersData) ? usersData : []);
    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function handleDeleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleDeleteUser(id) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleUpdateOrderStatus(id, status) {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  }

  if (loading) return <p className="p-8">Loading dashboard...</p>;

  return (
    <main className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome, {admin?.name}!</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{products.length}</p>
          <p className="text-gray-500 mt-1">Total Products</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-600">{users.length}</p>
          <p className="text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-yellow-600">{orders.length}</p>
          <p className="text-gray-500 mt-1">Total Orders</p>
        </div>
      </div>

      {/* Orders Table */}
      <h2 className="text-xl font-semibold mb-4">All Orders</h2>
      <div className="bg-white rounded-xl border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Order ID</th>
              <th className="text-left p-4">Buyer</th>
              <th className="text-left p-4">Address</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Payment</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-4">#{order.id}</td>
                <td className="p-4">
                  <p className="font-medium">{order.name}</p>
                  <p className="text-gray-400 text-xs">{order.buyer_email}</p>
                </td>
                <td className="p-4 text-gray-500">{order.address}</td>
                <td className="p-4 font-bold">${Number(order.total).toLocaleString()}</td>
                <td className="p-4 uppercase text-xs">{order.payment_method}</td>
                <td className="p-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className={`border rounded-lg px-2 py-1 text-xs font-medium ${
                      order.status === "pending"
                        ? "bg-yellow-50 border-yellow-300 text-yellow-600"
                        : order.status === "otw"
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : order.status === "delivered"
                        ? "bg-green-50 border-green-300 text-green-600"
                        : "bg-gray-50"
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="otw">OTW</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Products Table */}
      <h2 className="text-xl font-semibold mb-4">All Products</h2>
      <div className="bg-white rounded-xl border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Seller</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="p-4 flex items-center gap-3">
                  <img
                    src={product.image_url || "/placeholder.png"}
                    className="w-10 h-10 rounded object-cover"
                  />
                  {product.name}
                </td>
                <td className="p-4">${product.price}</td>
                <td className="p-4">{product.seller_name || "N/A"}</td>
                <td className="p-4">
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Table */}
      <h2 className="text-xl font-semibold mb-4">All Users</h2>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  {user.role !== "admin" && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}