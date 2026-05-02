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

  const [categories, setCategories] = useState([]);
  const [attributeDefs, setAttributeDefs] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category_id: "",
    stock: 0,
    is_visible: 1,
  });

  const [attrValues, setAttrValues] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchMyProducts();
      fetchCategories();
    }
  }, [status]);

  useEffect(() => {
    if (!form.category_id) return;
    async function fetchAttrs() {
      const res = await fetch(`/api/attributes?category_id=${form.category_id}`);
      const data = await res.json();
      setAttributeDefs(Array.isArray(data) ? data : []);
      setAttrValues({});
    }
    fetchAttrs();
  }, [form.category_id]);

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  }

  async function fetchMyProducts() {
    try {
      const res = await fetch("/api/sell");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", description: "", price: "", image_url: "", category_id: "", stock: 0, is_visible: 1 });
    setAttrValues({});
    setAttributeDefs([]);
  }

  async function handleSubmit() {
    const attributes = attributeDefs.map((def) => ({
      attribute_definition_id: def.id,
      value: attrValues[def.id] || "",
    }));

    const method = editProduct ? "PUT" : "POST";
    const body = editProduct
      ? { ...form, id: editProduct.id, attributes }
      : { ...form, attributes };

    const res = await fetch("/api/sell", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      alert(editProduct ? "Updated!" : "Posted!");
      setShowForm(false);
      setEditProduct(null);
      resetForm();
      fetchMyProducts();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete product?")) return;
    await fetch("/api/sell", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchMyProducts();
  }

  function handleEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category_id: product.category_id || "",
      stock: product.stock ?? 0,
      is_visible: product.is_visible ?? 1,
    });
    setShowForm(true);
  }

  if (status === "loading" || loading)
    return <p className="p-8">Loading...</p>;

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ background: "#1a1a2e", color: "#fff", padding: "50px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700" }}>Sell Your Items</h1>
        <p style={{ opacity: 0.6, marginTop: "6px" }}>
          What are you selling today? Add and manage your products here.
        </p>
      </section>

      {/* HEADER */}
      <div className="card flex items-center mb-6">
        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold">
          {session?.user?.name?.charAt(0)?.toUpperCase() || "S"}
        </div>
        <div className="ml-3">
          <h2 className="font-semibold">{session?.user?.name}</h2>
          <p className="text-sm text-gray-500">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); resetForm(); setShowForm(true); }}
          className="btn btn-primary ml-auto"
        >
          + Add Product
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">{editProduct ? "Edit Product" : "Add Product"}</h3>
          <div className="grid gap-3">
            <input className="input" placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <textarea className="input" placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <input className="input" type="number" placeholder="Price" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} />

            <input className="input" placeholder="Image URL" value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

            <select className="input" value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* DYNAMIC ATTRIBUTES */}
            {attributeDefs.length > 0 && (
              <div className="grid gap-3">
                {attributeDefs.map((def) => (
                  <div key={def.id}>
                    <label className="text-sm text-gray-500 mb-1 block">{def.name}</label>
                    <input
                      className="input"
                      placeholder={def.name}
                      value={attrValues[def.id] || ""}
                      onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* STOCK */}
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Stock quantity"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
            />

            {/* VISIBILITY TOGGLE */}
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
              <div
                onClick={() => setForm({ ...form, is_visible: form.is_visible ? 0 : 1 })}
                style={{
                  width: "42px", height: "24px", borderRadius: "999px",
                  background: form.is_visible ? "#1a1a2e" : "#ccc",
                  position: "relative", transition: "background 0.2s", cursor: "pointer",
                }}
              >
                <div style={{
                  position: "absolute", top: "3px",
                  left: form.is_visible ? "21px" : "3px",
                  width: "18px", height: "18px",
                  borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s",
                }} />
              </div>
              {form.is_visible ? "Visible to buyers" : "Hidden from buyers"}
            </label>

            <div className="flex gap-2">
              <button onClick={handleSubmit} className="btn btn-primary w-full">
                {editProduct ? "Save" : "Post"}
              </button>
              <button onClick={() => { setShowForm(false); setEditProduct(null); resetForm(); }}
                className="btn btn-outline w-full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <h3 className="font-semibold mb-4">My Products</h3>
      {products.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">No products yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="card cursor-pointer"
              onClick={() => handleEdit(product)}
              style={{ opacity: product.is_visible ? 1 : 0.6 }}
            >
              {/* IMAGE WITH BADGES */}
              <div style={{ position: "relative" }}>
                <img
                  src={product.image_url || "/placeholder.png"}
                  className="h-40 w-full object-cover rounded-lg"
                />
                {!product.is_visible && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "8px",
                    background: "rgba(0,0,0,0.4)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff", fontSize: "12px", fontWeight: "700", background: "#555", padding: "3px 10px", borderRadius: "999px" }}>
                      Hidden
                    </span>
                  </div>
                )}
                {product.stock === 0 && product.is_visible && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "8px",
                    background: "rgba(0,0,0,0.3)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff", fontSize: "12px", fontWeight: "700", background: "#e94560", padding: "3px 10px", borderRadius: "999px" }}>
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* INFO */}
              <div className="mt-3">
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-black font-bold">₱{Number(product.price).toLocaleString()}</p>
                <p style={{ fontSize: "12px", color: product.stock === 0 ? "#e94560" : "#16a34a" }}>
                  {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                </p>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                  className="btn btn-primary w-full"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                  className="btn btn-red w-full"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}