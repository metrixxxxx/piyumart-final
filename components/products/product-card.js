"use client";
import { useState } from "react";

export default function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          product_id: product.id, // 👈 key fix
          quantity: 1 
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert(`${product.name} added to cart!`);
        window.location.href = "/cart"; // 👈 simple redirect, no useRouter
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
    <div className="flex flex-col h-full border rounded-lg p-4 bg-amber-200">
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
        onClick={handleAddToCart}
        disabled={loading}
        className="mt-auto bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add to Cart"}
      </button>
    </div>
  );
}