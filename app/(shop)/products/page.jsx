"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  function handleAddToCart(product) {
    if (!session) {
      setShowModal(true); // 👈 show modal if not logged in
      return;
    }
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity: 1 }),
    }).then(() => alert(`${product.name} added to cart!`));
  }

  function handleBuyNow(product) {
    if (!session) {
      setShowModal(true); // 👈 show modal if not logged in
      return;
    }
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity: 1 }),
    }).then(() => router.push("/checkout"));
  }

  if (loading) return <p className="p-8">Loading products...</p>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-medium mb-6">All Products</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)} // 👈 cart handler
            onClick={() => router.push(`/products/${product.id}`)} // 👈 click to view
          />
        ))}
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