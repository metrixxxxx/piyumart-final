"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import { getSocket } from "@/lib/socket";

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    async function fetchData() {
      try {
        const [productRes, allRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch("/api/products"),
        ]);
        const productData = await productRes.json();
        const allData = await allRes.json();
        setProduct(productData);
        setSelectedImageIndex(0);
        setSelectedVariant(null);
        setAllProducts(
          Array.isArray(allData)
            ? allData.filter((p) => String(p.id) !== String(id))
            : []
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const socket = getSocket();
    socket.on("products:updated", (updated) => {
      if (String(updated.id) === String(id)) setProduct((prev) => ({ ...prev, ...updated }));
      setAllProducts((prev) => prev.map((p) => String(p.id) === String(updated.id) ? { ...p, ...updated } : p));
    });
    socket.on("products:deleted", ({ id: deletedId }) => {
      if (String(deletedId) === String(id)) router.push("/products");
      setAllProducts((prev) => prev.filter((p) => String(p.id) !== String(deletedId)));
    });
    socket.on("products:new", (newProduct) => {
      setAllProducts((prev) => [newProduct, ...prev]);
    });
    return () => {
      socket.off("products:updated");
      socket.off("products:deleted");
      socket.off("products:new");
    };
  }, [id]);

  async function handleAddToCart() {
    if (!session) { setShowModal(true); return; }
    setAddingToCart(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product.id,
        quantity,
        variant: selectedVariant?.label || null,
      }),
    });
    const data = await res.json();
    setAddingToCart(false);
    if (data.success) router.push("/cart");
  }

  async function handleBuyNow() {
    if (!session) { setShowModal(true); return; }
    router.push(
      `/checkout?productId=${product.id}&quantity=${quantity}${selectedVariant ? `&variant=${encodeURIComponent(selectedVariant.label)}` : ""}`
    );
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0eeea" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTop: "3px solid #2563eb", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: "15px" }}>Loading product...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!product) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0eeea" }}>
      <p style={{ color: "#9ca3af", fontSize: "18px" }}>Product not found.</p>
    </div>
  );

  const isOutOfStock = product.stock === 0;

  // Build full image list from product.images[] or fallback to image_url
  const allImages = product.images?.length > 0
    ? product.images
    : product.image_url
    ? [product.image_url]
    : ["/placeholder.png"];

  // Active image: if a variant is selected AND has its own image, show that
  // otherwise show whichever thumbnail was clicked
  const activeImage = (selectedVariant?.image_url) || allImages[selectedImageIndex] || "/placeholder.png";

  const hasVariants = product.variants?.length > 0;

  return (
    <div style={{ background: "#f0eeea", minHeight: "100vh" }}>

      {/* HERO BREADCRUMB */}
      <div style={{ background: "#1a1a2e", padding: "16px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => router.push("/products")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px", padding: 0 }}>
            Products
          </button>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>›</span>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "500" }}>
            {product.name}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 20px" }}>

        {/* DETAIL CARD */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "20px",
          border: "1px solid #e8e8e8",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }} className="product-detail-grid">

          {/* LEFT — Image Gallery */}
          <div style={{ display: "flex", flexDirection: "column", background: "#fafafa" }}>

            {/* Main image */}
            <div style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden" }}>
              <img
                key={activeImage}
                src={activeImage}
                alt={product.name}
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  transition: "opacity 0.2s ease",
                }}
              />

              {/* Image counter badge */}
              {allImages.length > 1 && (
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  background: "rgba(0,0,0,0.5)", color: "#fff",
                  fontSize: "12px", padding: "3px 10px", borderRadius: "999px",
                  backdropFilter: "blur(4px)",
                }}>
                  {selectedVariant ? "variant" : `${selectedImageIndex + 1} / ${allImages.length}`}
                </div>
              )}

              {isOutOfStock && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ background: "#e94560", color: "#fff", padding: "8px 24px", borderRadius: "999px", fontSize: "15px", fontWeight: "700", letterSpacing: "0.5px" }}>
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={{
                display: "flex", gap: "8px", padding: "12px",
                overflowX: "auto", borderTop: "1px solid #f0f0f0",
              }}>
                {allImages.map((img, i) => {
                  const isActive = !selectedVariant && selectedImageIndex === i;
                  return (
                    <div
                      key={i}
                      onClick={() => { setSelectedImageIndex(i); setSelectedVariant(null); }}
                      style={{
                        width: "60px", height: "60px", flexShrink: 0,
                        borderRadius: "10px", overflow: "hidden",
                        cursor: "pointer",
                        border: isActive ? "2.5px solid #2563eb" : "2.5px solid transparent",
                        boxShadow: isActive ? "0 0 0 1px #bfdbfe" : "none",
                        transition: "all 0.15s",
                        opacity: isActive ? 1 : 0.55,
                      }}
                    >
                      <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — Info */}
          <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>

            {/* Category badge */}
            {product.category_name && (
              <span style={{
                display: "inline-block", width: "fit-content",
                background: "#eff6ff", color: "#2563eb",
                fontSize: "11px", fontWeight: "600", padding: "3px 10px",
                borderRadius: "999px", letterSpacing: "0.3px",
              }}>
                {product.category_name}
              </span>
            )}

            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0, lineHeight: "1.3" }}>
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", margin: 0 }}>
                ₱{Number(product.price).toLocaleString()}
              </p>
            </div>

            {/* Stock + Seller row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                fontSize: "12px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px",
                background: isOutOfStock ? "#fef2f2" : "#f0fdf4",
                color: isOutOfStock ? "#e94560" : "#16a34a",
              }}>
                {isOutOfStock ? "Out of Stock" : `${product.stock} in stock`}
              </span>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                by <strong style={{ color: "#6b7280" }}>{product.seller_name || "Unknown"}</strong>
              </span>
            </div>

            {product.description && (
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, lineHeight: "1.75", borderTop: "1px solid #f3f4f6", paddingTop: "14px" }}>
                {product.description}
              </p>
            )}

            {/* Attributes */}
            {product.attributes?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "12px", fontWeight: "700", color: "#374151", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Product Details
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {product.attributes.map((attr) => (
                    <div key={attr.name} style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "8px 12px", border: "1px solid #f0f0f0" }}>
                      <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>{attr.label}</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#111827", margin: "2px 0 0" }}>{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {hasVariants && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontSize: "12px", fontWeight: "700", color: "#374151", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Variants
                  {selectedVariant && (
                    <span style={{ fontWeight: "500", color: "#2563eb", marginLeft: "8px", textTransform: "none", letterSpacing: 0 }}>
                      — {selectedVariant.label}
                    </span>
                  )}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {product.variants.map((variant, i) => {
                    const isSelected = selectedVariant?.label === variant.label;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedVariant(isSelected ? null : variant);
                          // Don't reset selectedImageIndex so gallery stays where it was
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: "7px",
                          padding: variant.image_url ? "5px 12px 5px 5px" : "7px 14px",
                          borderRadius: "10px", cursor: "pointer", fontSize: "13px",
                          fontWeight: "500", transition: "all 0.15s",
                          border: isSelected ? "2px solid #2563eb" : "1.5px solid #e5e7eb",
                          background: isSelected ? "#eff6ff" : "#f9fafb",
                          color: isSelected ? "#2563eb" : "#374151",
                          boxShadow: isSelected ? "0 0 0 3px #bfdbfe" : "none",
                        }}
                      >
                        {variant.image_url && (
                          <img
                            src={variant.image_url}
                            style={{ width: "30px", height: "30px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                          />
                        )}
                        {variant.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "2px 0" }} />

            {/* Quantity */}
            {!isOutOfStock && (
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>Qty</span>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: "600", color: "#374151" }}>−</button>
                  <span style={{ padding: "8px 18px", fontWeight: "700", fontSize: "15px", borderLeft: "1.5px solid #e5e7eb", borderRight: "1.5px solid #e5e7eb", minWidth: "48px", textAlign: "center" }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    style={{ padding: "8px 18px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: "600", color: "#374151" }}>+</button>
                </div>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>max {product.stock}</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || isOutOfStock}
                style={{
                  width: "100%", padding: "13px",
                  backgroundColor: isOutOfStock ? "#e5e7eb" : "#2563eb",
                  color: isOutOfStock ? "#9ca3af" : "white",
                  borderRadius: "12px", border: "none",
                  fontSize: "15px", fontWeight: "700",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  opacity: addingToCart ? 0.7 : 1,
                  transition: "background 0.15s, transform 0.1s",
                }}
                onMouseEnter={(e) => { if (!isOutOfStock) e.target.style.background = "#1d4ed8"; }}
                onMouseLeave={(e) => { if (!isOutOfStock) e.target.style.background = "#2563eb"; }}
              >
                {addingToCart ? "Adding to cart..." : "🛒 Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                style={{
                  width: "100%", padding: "13px",
                  backgroundColor: isOutOfStock ? "#f3f4f6" : "#111827",
                  color: isOutOfStock ? "#9ca3af" : "white",
                  borderRadius: "12px", border: "none",
                  fontSize: "15px", fontWeight: "700",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!isOutOfStock) e.target.style.background = "#1f2937"; }}
                onMouseLeave={(e) => { if (!isOutOfStock) e.target.style.background = "#111827"; }}
              >
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* MORE PRODUCTS */}
        {allProducts.length > 0 && (
          <div style={{ marginTop: "56px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a2e", margin: 0 }}>
                More Products
              </h2>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
            }}>
              {allProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  style={{
                    background: "#fff", borderRadius: "14px",
                    border: "1px solid #e8e8e8", overflow: "hidden",
                    cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Login Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
          backdropFilter: "blur(4px)",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: "white", borderRadius: "20px", padding: "36px",
            width: "320px", textAlign: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>🔒</div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>Sign in to continue</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>
              You need to be logged in to add items or buy.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => router.push("/login")}
                style={{ backgroundColor: "#2563eb", color: "white", padding: "12px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                Sign in
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: "white", color: "#6b7280", padding: "12px", borderRadius: "12px", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: "14px" }}>
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}