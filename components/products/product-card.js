"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // ✅ ADD TO CART
  async function handleAddToCart(e) {
    e.stopPropagation();

    if (!session) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`${product.name} added to cart!`);
        router.push("/cart");
      } else {
        alert(data.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ BUY NOW (FIXED — outside function)
  async function handleBuyNow(e) {
    e.stopPropagation();

    if (!session) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      // 🔥 Simple version: go to checkout with product
      router.push(`/checkout?productId=${product.id}`);
    } catch (err) {
      console.error("Error in buy now:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* PRODUCT CARD */}
      <div
        className="flex flex-col h-full border rounded-lg p-4 bg-blue-300 cursor-pointer hover:shadow-md transition"
        onClick={() => router.push(`/products/${product.id}`)}
      >
       <img
  src={
    product.image_url && product.image_url.trim() !== ""
      ? product.image_url
      : "https://via.placeholder.com/400x300?text=No+Image"
  }
  alt={product.name || "No image"}
  className="w-full h-48 object-cover rounded"
/>


        <div className="flex-1 mt-2">
  <h2 className="text-lg font-semibold">{product.name}</h2>
  <p className="text-sm text-gray-600 line-clamp-3">{product.description}</p>
  <p className="text-md font-bold mt-2">${product.price}</p>
  <p className="text-xs text-gray-400 mt-1">Sold by: {product.seller_name || "Unknown"}</p> {/* 👈 add this */}
</div>

        {/* ✅ BUTTONS (FIXED LAYOUT) */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add to Cart"}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* ✅ LOGIN MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 w-80 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium mb-2">
              Sign in to continue
            </h2>

            <p className="text-gray-500 text-sm mb-6">
              You need to be logged in to continue.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/login")}
                className="bg-black text-white py-2 rounded-lg"
              >
                Sign in
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="border border-gray-300 py-2 rounded-lg"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}