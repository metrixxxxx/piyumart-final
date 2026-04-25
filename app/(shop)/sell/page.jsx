"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", image_url: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") fetchMyProducts();
  }, [status]);

  async function fetchMyProducts() {
    try {
      const res = await fetch("/api/sell");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    const method = editProduct ? "PUT" : "POST";
    const body = editProduct
      ? { ...form, id: editProduct.id }
      : form;

    const res = await fetch("/api/sell", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      alert(editProduct ? "Product updated!" : "Product added!");
      setShowForm(false);
      setEditProduct(null);
      setForm({ name: "", description: "", price: "", image_url: "" });
      fetchMyProducts();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch("/api/sell", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Product deleted!");
      fetchMyProducts();
    }
  }

  function handleEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
    });
    setShowForm(true);
  }

  if (status === "loading" || loading) return <p className="p-8">Loading...</p>;

  return (
    <main className="p-8 max-w-5xl mx-auto">

      {/* User Info */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
          {session.user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{session.user.name}</h2>
          <p className="text-gray-500 text-sm">{session.user.email}</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setForm({ name: "", description: "", price: "", image_url: "" }); setShowForm(true); }}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {editProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <input
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2 w-full"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 w-full"
              rows={3}
            />
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border rounded-lg px-4 py-2 w-full"
            />
            <input
              placeholder="Image URL"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="border rounded-lg px-4 py-2 w-full"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editProduct ? "Save Changes" : "Post Product"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditProduct(null); }}
                className="border border-gray-300 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Products */}
      <h3 className="text-lg font-semibold mb-4">My Products</h3>
      {products.length === 0 ? (
        <p className="text-gray-500">You have no products yet. Add one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border rounded-xl overflow-hidden">
              <img
                src={product.image_url || "/placeholder.png"}
                alt={product.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                <p className="font-bold mt-1">${product.price}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 border border-blue-600 text-blue-600 py-1 rounded-lg text-sm hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 border border-red-500 text-red-500 py-1 rounded-lg text-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}