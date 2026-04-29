"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleAddToCart(e) {
    e.stopPropagation();

    if (!session) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      router.push("/cart");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyNow(e) {
    e.stopPropagation();

    if (!session) {
      setShowModal(true);
      return;
    }

    router.push(`/checkout?productId=${product.id}`);
  }

  return (
    <>
      {/* CARD */}
      <div
        onClick={() => router.push(`/products/${product.id}`)}
        style={{
          background: "#fff",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #eee",
          cursor: "pointer",
          transition: "0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-3px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        {/* IMAGE */}
        <div style={{ height: "180px", overflow: "hidden" }}>
          <img
            src={
              product.image_url?.trim()
                ? product.image_url
                : "https://via.placeholder.com/400x300?text=No+Image"
            }
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* CONTENT */}
        <div style={{ padding: "14px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "6px",
              color: "#1a1a2e",
            }}
          >
            {product.name}
          </h2>

          <p
            style={{
              fontSize: "12px",
              color: "#777",
              height: "32px",
              overflow: "hidden",
            }}
          >
            {product.description}
          </p>

          <div style={{ marginTop: "10px" }}>
            <p
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#e94560",
              }}
            >
              ₱{Number(product.price).toLocaleString()}
            </p>

            <p style={{ fontSize: "11px", color: "#999" }}>
              Sold by: {product.seller_name || "Unknown"}
            </p>
          </div>

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={handleAddToCart}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: "12px",
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "..." : "Add"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #1a1a2e",
                background: "#fff",
                color: "#1a1a2e",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (UNCHANGED LOGIC) */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "300px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>
              Sign in required
            </h2>

            <p style={{ fontSize: "13px", color: "#777", marginBottom: "16px" }}>
              You need to login first.
            </p>

            <button
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                padding: "10px",
                background: "#1a1a2e",
                color: "#fff",
                borderRadius: "8px",
                marginBottom: "8px",
              }}
            >
              Sign in
            </button>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}