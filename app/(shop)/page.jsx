"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/products/ProductCard";
import HeroSlider from "@/components/HeroSlider";

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

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

     <section
  style={{
    background: "#1a1a2e",
    color: "white",
    padding: "50px 20px",
    textAlign: "center",
  }}
>
  <div style={{ maxWidth: "700px", margin: "0 auto" }}>
    <h1 style={{ fontSize: "38px", fontWeight: "700" }}>
      {session
        ? `Welcome back, ${session.user.name}! 👋`
        : "Welcome to PiyuMart 🛍️"}
    </h1>

    <p style={{ marginTop: "10px", opacity: 0.7 }}>
      {session
        ? "Browse and add items to your cart."
        : "Buy & sell within your campus marketplace"}
    </p>
  </div>

  {/* 👇 SLIDER GOES HERE */}
  <div style={{ marginTop: "40px" }}>
    <HeroSlider />
  </div>
</section>

      {/* CONTENT WRAPPER */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >

        {/* HEADER ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
            Featured Products
          </h2>

          <span style={{ fontSize: "12px", color: "#999" }}>
            {products.length} items
          </span>
        </div>

        {/* CONTENT */}
        {loading ? (
          <p style={{ color: "#777" }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ color: "#777" }}>No products available yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #eee",
                  overflow: "hidden",
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}