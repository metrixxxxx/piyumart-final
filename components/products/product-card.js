"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  console.log("Product ID:", product.id);

  async function handleAddToCart(e) {
    e.stopPropagation(); // 👈 don't trigger card click

    if (!session) {
      setShowModal(true); // 👈 show modal if not logged in
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
        window.location.href = "/cart";
      } else {
        alert(data.error || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Card — click to view product detail */}
      <div
        className="flex flex-col h-full border rounded-lg p-4 bg-amber-200 cursor-pointer hover:shadow-md transition"
        onClick={() => router.push(`/products/${product.id}`)} // 👈 click = go to detail
      >
        <img
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          className="w-full h-48 object-cover rounded"
        />
        <div className="flex-1 mt-2">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <p className="text-sm text-gray-600 line-clamp-3">{product.description}</p>
          <p className="text-md font-bold mt-2">${product.price}</p>
        </div>
        <button
          onClick={handleAddToCart} // 👈 separate from card click
          disabled={loading}
          className="mt-auto bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* Login Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 w-80 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium mb-2">Sign in to continue</h2>
            <p className="text-gray-500 text-sm mb-6">
              You need to be logged in to add items to your cart.
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

