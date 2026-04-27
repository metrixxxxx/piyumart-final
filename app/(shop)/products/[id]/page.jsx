"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  async function handleAddToCart() {
    if (!session) { setShowModal(true); return; }
    setAddingToCart(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity }),
    });
    const data = await res.json();
    setAddingToCart(false);
    if (data.success) router.push("/cart");
  }

  async function handleBuyNow() {
  if (!session) { setShowModal(true); return; }
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: product.id, quantity }),
  });
  const data = await res.json();
  if (data.success) router.push(`/checkout?productId=${product.id}&quantity=${quantity}`); // 👈 dagdag quantity
}

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px" }}>
      <p style={{ color: "#9ca3af", fontSize: "18px" }}>Loading product...</p>
    </div>
  );

  if (!product) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px" }}>
      <p style={{ color: "#9ca3af", fontSize: "18px" }}>Product not found.</p>
    </div>
  );

  return (
    // 👇 DITO — walang minHeight at backgroundColor
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#6b7280",
            marginBottom: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back
        </button>

        {/* Card */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          border: "1px solid #f3f4f6",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>

          {/* Image */}
          <img
            src={product.image_url || "/placeholder.png"}
            alt={product.name}
            style={{
              width: "100%",
              height: "220px",
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Details */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>

            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>
              {product.name}
            </h1>

            <p style={{ fontSize: "22px", fontWeight: "700", color: "#2563eb", margin: 0 }}>
              ₱{Number(product.price).toLocaleString()}
            </p>

            {product.description && (
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.6" }}>
                {product.description}
              </p>
            )}

            {/* Attributes */}
{product.attributes?.length > 0 && (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>
      Product Details
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {product.attributes.map((attr) => (
        <div
          key={attr.name}
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            padding: "8px 12px",
            border: "1px solid #f3f4f6",
          }}
        >
          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{attr.label}</p>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#111827", margin: 0 }}>
            {attr.value}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

            <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "4px 0" }} />

            {/* Quantity */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>Quantity</span>
              <div style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                overflow: "hidden",
              }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: "8px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: "600" }}
                >
                  −
                </button>
                <span style={{ padding: "8px 16px", fontWeight: "600", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{ padding: "8px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: "600" }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              style={{
                width: "100%",
                backgroundColor: "#2563eb",
                color: "white",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                opacity: addingToCart ? 0.6 : 1,
              }}
            >
              {addingToCart ? "Adding..." : "🛒 Add to Cart"}
            </button>

            <button
              onClick={handleBuyNow}
              style={{
                width: "100%",
                backgroundColor: "#111827",
                color: "white",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ⚡ Buy Now
            </button>

          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "32px",
              width: "300px",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
            <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>Sign in to continue</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
              You need to be logged in to add items to your cart or buy now.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => router.push("/login")}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "white",
                  color: "#6b7280",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                }}
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}