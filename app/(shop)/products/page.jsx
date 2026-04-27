"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = All
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : [];

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
  }, [session]);

  // Filter by selected category (client-side)
  const visibleProducts = selectedCategory
    ? products.filter((p) => String(p.category_id) === String(selectedCategory))
    : products;

  function handleAddToCart(product) {
    if (!session) { setShowModal(true); return; }
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity: 1 }),
    }).then(() => alert(`${product.name} added to cart!`));
  }

  function handleBuyNow(product) {
    if (!session) { setShowModal(true); return; }
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

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-1.5 rounded-full text-sm border transition ${
            selectedCategory === null
              ? "bg-black text-white border-black"
              : "bg-white text-gray-600 border-gray-300 hover:border-black"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${
              selectedCategory === cat.id
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-black"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {visibleProducts.length === 0 ? (
        <p className="text-gray-500">No products found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => handleAddToCart(product)}
              onClick={() => router.push(`/products/${product.id}`)}
            />
          ))}
        </div>
      )}

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