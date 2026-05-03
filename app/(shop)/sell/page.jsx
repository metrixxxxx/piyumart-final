"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

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
    category_id: "",
    stock: 0,
    is_visible: 1,
  });
  const [attrValues, setAttrValues] = useState({});

  // --- Image & Variant State ---
  const [mainImages, setMainImages] = useState([]);   // [{ file, preview }]
  const [variants, setVariants] = useState([]);        // [{ label, file, preview }]

  // --- Main Images ---
  const handleMainImages = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setMainImages((prev) => [...prev, ...previews]);
  };

  const removeMainImage = (index) => {
    setMainImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Variants ---
  const addVariant = () => setVariants((prev) => [...prev, { label: "", file: null, preview: null }]);

  const updateVariantLabel = (index, label) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, label } : v));
  };

  const updateVariantImage = (index, file) => {
    setVariants((prev) => prev.map((v, i) =>
      i === index ? { ...v, file, preview: URL.createObjectURL(file) } : v
    ));
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

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
    setForm({ name: "", description: "", price: "", category_id: "", stock: 0, is_visible: 1 });
    setAttrValues({});
    setAttributeDefs([]);
    setMainImages([]);
    setVariants([]);
  }

  async function handleSubmit() {
    const attributes = attributeDefs.map((def) => ({
      attribute_definition_id: def.id,
      value: attrValues[def.id] || "",
    }));

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("category_id", form.category_id);
    formData.append("stock", form.stock);
    formData.append("is_visible", form.is_visible);
    formData.append("attributes", JSON.stringify(attributes));

    if (editProduct) formData.append("id", editProduct.id);

    // Append main images
    mainImages.forEach((img) => formData.append("images", img.file));

    // Append variants
    variants.forEach((v, i) => {
      formData.append(`variant_label_${i}`, v.label);
      if (v.file) formData.append(`variant_image_${i}`, v.file);
    });
    formData.append("variant_count", variants.length);

    const res = await fetch("/api/sell", {
      method: editProduct ? "PUT" : "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      alert(editProduct ? "Updated!" : "Posted!");
      setShowForm(false);
      setEditProduct(null);
      resetForm();
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete product?")) return;
    await fetch("/api/sell", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
  }

  function handleEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id || "",
      stock: product.stock ?? 0,
      is_visible: product.is_visible ?? 1,
    });
    // Pre-fill existing images as previews (no file object — already saved)
    setMainImages(
      product.images?.map((url) => ({ file: null, preview: url })) || 
      (product.image_url ? [{ file: null, preview: product.image_url }] : [])
    );
    setVariants(
      product.variants?.map((v) => ({ label: v.label, file: null, preview: v.image_url })) || []
    );
    setShowForm(true);
  }

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

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    async function init() {
      await fetchMyProducts();
      await fetchCategories();
    }
    init();
  }, [status]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("products:new", (product) => {
      if (String(product.seller_id) === String(session?.user?.id)) {
        setProducts((prev) => [product, ...prev]);
      }
    });
    socket.on("products:updated", (updated) => {
      setProducts((prev) =>
        prev.map((p) => String(p.id) === String(updated.id) ? { ...p, ...updated } : p)
      );
    });
    socket.on("products:deleted", ({ id }) => {
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    });
    return () => {
      socket.off("products:new");
      socket.off("products:updated");
      socket.off("products:deleted");
    };
  }, [session?.user?.id]);

  if (status === "loading" || loading)
    return <p className="p-8">Loading...</p>;

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

      <section style={{ background: "#1a1a2e", color: "#fff", padding: "50px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700" }}>Sell Your Items</h1>
        <p style={{ opacity: 0.6, marginTop: "6px" }}>
          What are you selling today? Add and manage your products here.
        </p>
      </section>

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

            <select className="input" value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

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

            <input className="input" type="number" min="0" placeholder="Stock quantity"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />

            {/* --- PRODUCT PHOTOS --- */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Product Photos
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {mainImages.map((img, i) => (
                  <div key={i} style={{ position: "relative", width: "80px", height: "80px" }}>
                    <img src={img.preview} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                    <button
                      onClick={() => removeMainImage(i)}
                      style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "#e94560", color: "#fff", border: "none",
                        borderRadius: "50%", width: "18px", height: "18px",
                        fontSize: "10px", cursor: "pointer", fontWeight: "700",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >✕</button>
                  </div>
                ))}
                <label style={{
                  width: "80px", height: "80px", border: "2px dashed #d1d5db",
                  borderRadius: "8px", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#9ca3af", fontSize: "11px", gap: "2px"
                }}>
                  <span style={{ fontSize: "20px" }}>+</span>
                  Add photo
                  <input type="file" accept="image/*" multiple onChange={handleMainImages} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            {/* --- VARIANTS --- */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Variants <span style={{ fontSize: "11px", fontWeight: "400", color: "#9ca3af" }}>(color, size, etc.)</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {variants.map((variant, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    background: "#f9fafb", borderRadius: "10px",
                    padding: "8px 12px", border: "1px solid #f3f4f6"
                  }}>
                    <label style={{ cursor: "pointer", flexShrink: 0 }}>
                      {variant.preview ? (
                        <img src={variant.preview} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                      ) : (
                        <div style={{
                          width: "52px", height: "52px", border: "2px dashed #d1d5db",
                          borderRadius: "8px", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "#9ca3af", fontSize: "18px"
                        }}>+</div>
                      )}
                      <input type="file" accept="image/*"
                        onChange={(e) => updateVariantImage(i, e.target.files[0])}
                        style={{ display: "none" }} />
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Red - Large"
                      value={variant.label}
                      onChange={(e) => updateVariantLabel(i, e.target.value)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: "8px",
                        border: "1px solid #e5e7eb", fontSize: "13px",
                        outline: "none", background: "white"
                      }}
                    />
                    <button
                      onClick={() => removeVariant(i)}
                      style={{ background: "none", border: "none", color: "#e94560", cursor: "pointer", fontSize: "18px" }}
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={addVariant}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "none", border: "1px dashed #d1d5db",
                    borderRadius: "10px", padding: "8px 14px",
                    color: "#6b7280", fontSize: "13px", cursor: "pointer",
                    width: "fit-content"
                  }}
                >
                  + Add variant
                </button>
              </div>
            </div>

            {/* --- VISIBILITY TOGGLE --- */}
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
              <div style={{ position: "relative" }}>
                <img
                  src={
                    product.images?.[0] ||
                    product.image_url ||
                    "/placeholder.png"
                  }
                  className="h-40 w-full object-cover rounded-lg"
                />
                {product.images?.length > 1 && (
                  <span style={{
                    position: "absolute", bottom: "6px", right: "6px",
                    background: "rgba(0,0,0,0.55)", color: "#fff",
                    fontSize: "11px", padding: "2px 8px", borderRadius: "999px"
                  }}>
                    +{product.images.length - 1} photos
                  </span>
                )}
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

              <div className="mt-3">
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-black font-bold">₱{Number(product.price).toLocaleString()}</p>
                <p style={{ fontSize: "12px", color: product.stock === 0 ? "#e94560" : "#16a34a" }}>
                  {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                </p>
                {product.variants?.length > 0 && (
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                    {product.variants.length} variant{product.variants.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

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