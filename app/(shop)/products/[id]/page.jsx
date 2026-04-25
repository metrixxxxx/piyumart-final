"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams(); // 👈 gets the id from the URL

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
    if (!session) {
      setShowModal(true);
      return;
    }
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`${product.name} added to cart!`);
      router.push("/cart");
    }
  }

  if (loading) return <p className="p-8">Loading...</p>;
  if (!product) return <p className="p-8">Product not found.</p>;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-gray-500 mb-6 hover:text-black"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <img
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          className="w-full rounded-xl object-cover max-h-96"
        />

        {/* Details */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-semibold mb-2">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-4">${product.price}</p>
          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-500">Quantity:</span>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-4 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg hover:bg-blue-700"
          >
            Add to Cart
          </button>
        </div>
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
    </main>
  );
}