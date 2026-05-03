"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import { getSocket } from "@/lib/socket";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
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

    // ✅ Realtime listeners
    const socket = getSocket();

    socket.on("products:new", (newProduct) => {
      if (session?.user?.id && String(newProduct.seller_id) === String(session.user.id)) return;
      setProducts((prev) => [newProduct, ...prev]);
    });

    socket.on("products:updated", (updated) => {
      setProducts((prev) =>
        prev.map((p) => String(p.id) === String(updated.id) ? { ...p, ...updated } : p)
      );
    });

    socket.on("products:deleted", ({ id }) => {
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    });

    return () => {
      socket.off("products:new");
      socket.off("products:updated");
      socket.off("products:deleted");
    };
  }, [session]);

  const visibleProducts = selectedCategory
    ? products.filter((p) => String(p.category_id) === String(selectedCategory))
    : products;

  function handleAddToCart(product) {
    if (!session) {
      setShowModal(true);
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
      setShowModal(true);
      return;
    }

    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, quantity: 1 }),
    }).then(() => router.push("/checkout"));
  }

  if (loading) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading products...</p>
      </main>
    );
  }

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>
      
      {/* HEADER (MATCH HOMEPAGE STYLE) */}
      <section
        style={{
          background: "#1a1a2e",
          color: "#fff",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "36px", fontWeight: "700" }}>
          All Products
        </h1>
        <p style={{ opacity: 0.6, marginTop: "10px" }}>
          Browse items from students in your campus
        </p>
      </section>

      {/* CONTENT WRAPPER */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >

        {/* CATEGORY FILTER */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid #ddd",
              background: selectedCategory === null ? "#1a1a2e" : "#fff",
              color: selectedCategory === null ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                border: "1px solid #ddd",
                background:
                  selectedCategory === cat.id ? "#1a1a2e" : "#fff",
                color: selectedCategory === cat.id ? "#fff" : "#333",
                cursor: "pointer",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* PRODUCTS GRID */}
        {visibleProducts.length === 0 ? (
          <p style={{ color: "#777" }}>
            No products found in this category.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "12px",
                  border: "1px solid #eee",
                }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  onClick={() =>
                    router.push(`/products/${product.id}`)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOGIN MODAL (UNCHANGED LOGIC) */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "320px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>
              Sign in to continue
            </h2>
            <p style={{ fontSize: "14px", color: "#777", marginBottom: "20px" }}>
              You need to be logged in to add items.
            </p>

            <button
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                padding: "10px",
                background: "#1a1a2e",
                color: "#fff",
                borderRadius: "8px",
                marginBottom: "10px",
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
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </main>
  );
}