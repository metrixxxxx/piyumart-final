"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/products/product-card";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : [];

        // 👇 seller_id (underscore) at String() para walang type mismatch
        const filtered = session?.user?.id
          ? allProducts.filter(
              (p) => String(p.seller_id) !== String(session.user.id)
            )
          : allProducts;

        setProducts(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [session]); // 👈 [session] hindi [] 

  return (
    <main className="p-8">
      {/* Hero */}
      <div className="bg-white rounded-xl p-10 text-center mb-10 border border-gray-200">
        <h1 className="text-3xl font-semibold mb-2">
          {session
            ? `Welcome back, ${session.user.name}! 👋`
            : "Welcome to PiyuMart 🛍️"}
        </h1>
        <p className="text-gray-500 mb-2">
          {session
            ? "Browse and add items to your cart."
            : "Browse our products — sign in to add to cart and checkout."}
        </p>
      </div>

      {/* Products */}
      <h2 className="text-xl font-medium mb-4">Featured Products</h2>
      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}