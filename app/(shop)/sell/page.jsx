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
    name: "", description: "", price: "", image_url: "", category_id: ""
  });
  const [attrValues, setAttrValues] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") { fetchMyProducts(); fetchCategories(); }
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      alert(editProduct ? "Product updated!" : "Product added!");
      setShowForm(false);
      setEditProduct(null);
      resetForm();
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
    if (data.success) { alert("Product deleted!"); fetchMyProducts(); }
  }

  function handleEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category_id: product.category_id || "",
    });
    if (product.attributes) {
      const vals = {};
      product.attributes.forEach((a) => {
        const def = attributeDefs.find((d) => d.name === a.name);
        if (def) vals[def.id] = a.value;
      });
      setAttrValues(vals);
    }
    setShowForm(true);
  }

  function resetForm() {
    setForm({ name: "", description: "", price: "", image_url: "", category_id: "" });
    setAttrValues({});
    setAttributeDefs([]);
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
          onClick={() => { setEditProduct(null); resetForm(); setShowForm(true); }}
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
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="border rounded-lg px-4 py-2 w-full"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {attributeDefs.length > 0 && (
              <div className="border rounded-xl p-4 bg-gray-50 grid grid-cols-1 gap-3">
                <p className="text-sm font-medium text-gray-600 mb-1">Product Attributes</p>
                {attributeDefs.map((def) => (
                  <div key={def.id}>
                    <label className="text-sm text-gray-600 mb-1 block">
                      {def.label} {def.required ? <span className="text-red-500">*</span> : ""}
                    </label>
                    {def.type === "select" ? (
                      <select
                        value={attrValues[def.id] || ""}
                        onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
                        className="border rounded-lg px-4 py-2 w-full"
                      >
                        <option value="">-- Select --</option>
                        {JSON.parse(def.options || "[]").map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : def.type === "date" ? (
                      <input
                        type="date"
                        value={attrValues[def.id] || ""}
                        onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
                        className="border rounded-lg px-4 py-2 w-full"
                      />
                    ) : def.type === "number" ? (
                      <input
                        type="number"
                        placeholder={def.label}
                        value={attrValues[def.id] || ""}
                        onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
                        className="border rounded-lg px-4 py-2 w-full"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={def.label}
                        value={attrValues[def.id] || ""}
                        onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
                        className="border rounded-lg px-4 py-2 w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editProduct ? "Save Changes" : "Post Product"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditProduct(null); resetForm(); }}
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
            <ProductCardWithModal
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
}

// ✅ MODAL CARD COMPONENT
function ProductCardWithModal({ product, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Card */}
      <div
        className="bg-white border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition group"
        onClick={() => setOpen(true)}
      >
        <div className="overflow-hidden">
          <img
            src={product.image_url || "/placeholder.png"}
            alt={product.name}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
          <p className="font-bold text-blue-600 mt-1">₱{Number(product.price).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">Click to view details</p>
        </div>
      </div>

      {/* Modal — fullscreen, horizontal layout */}
{open && (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    onClick={() => setOpen(false)}
  >
    <div
      className="bg-white w-full h-full flex flex-row overflow-hidden relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ← Back button — nasa pinaka-ibabaw, fixed position */}
      <button
        onClick={() => setOpen(false)}
        style={{ position: "fixed", top: "16px", left: "16px", zIndex: 99999 }}
        className="bg-white rounded-full px-4 py-2 flex items-center gap-2 text-gray-600 hover:bg-gray-100 shadow-md text-sm font-medium"
      >
        ← Back
      </button>

      {/* LEFT — Image */}
      <div className="w-1/2 h-full">
        <img
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* RIGHT — Details */}
      ...

            {/* RIGHT — Details */}
            <div className="w-1/2 h-full flex flex-col overflow-y-auto">
              {/* Header */}
<div className="p-8 pb-4 border-b border-gray-100">
  <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
    {product.category_name || "Uncategorized"}
  </p>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h2>
                <p className="text-3xl font-bold text-blue-600 mt-3">
                  ₱{Number(product.price).toLocaleString()}
                </p>
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col gap-6 flex-1">
                {/* Description */}
                {product.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Description
                    </p>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Attributes */}
                {product.attributes?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Product Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {product.attributes.map((attr) => (
                        <div
                          key={attr.name}
                          className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                        >
                          <p className="text-xs text-gray-400 mb-0.5">{attr.label}</p>
                          <p className="text-sm font-semibold text-gray-800">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer — Buttons */}
              <div className="p-8 pt-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => { onEdit(product); setOpen(false); }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => { onDelete(product.id); setOpen(false); }}
                  className="flex-1 bg-red-50 text-red-500 border border-red-200 py-3 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}