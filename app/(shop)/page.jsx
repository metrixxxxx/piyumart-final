"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/products/ProductCard";
import HeroSlider from "@/components/HeroSlider";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : [];
        const filtered = session?.user?.id
          ? allProducts.filter((p) => String(p.seller_id) !== String(session.user.id))
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

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  const displayed = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === "all" || String(p.category_id) === String(category);
    return matchesSearch && matchesCategory;
  });

  const tabStyle = (active) => ({
    padding: "6px 16px",
    borderRadius: "999px",
    border: "1px solid",
    borderColor: active ? "#1a1a2e" : "#ddd",
    background: active ? "#1a1a2e" : "#fff",
    color: active ? "#fff" : "#555",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: active ? "600" : "400",
    transition: "all 0.15s",
  });

  

  return (
    <main style={{ background: "#f0eeea", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ background: "#1a1a2e", color: "white", padding: "40px 20px 0", textAlign: "center" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "700" }}>
            {session ? `Welcome back, ${session.user.name}! 👋` : "Welcome to PiyuMart 🛍️"}
          </h1>
          <p style={{ marginTop: "8px", opacity: 0.6, fontSize: "15px" }}>
            {session ? "Discover student deals on campus." : "Buy & sell within your campus marketplace"}
          </p>
        </div>

        {/* SEARCH BAR */}
        <div style={{ maxWidth: "520px", margin: "24px auto 0", position: "relative" }}>
          <svg
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", opacity: 0.5, pointerEvents: "none" }}
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 40px 11px 42px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "14px",
              outline: "none",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              boxSizing: "border-box",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "rgba(255,255,255,0.6)", padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ marginTop: "32px" }}>
          <HeroSlider />
        </div>
      </section>

      {/* CONTENT WRAPPER */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>

        {/* CATEGORY TABS */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button onClick={() => setCategory("all")} style={tabStyle(category === "all")}>
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(String(cat.id))}
              style={tabStyle(category === String(cat.id))}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* HEADER ROW */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
            {category === "all"
              ? "All Products"
              : categories.find((c) => String(c.id) === category)?.name || "Products"}
          </h2>
          <span style={{ fontSize: "12px", color: "#999" }}>
            {displayed.length} item{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* CONTENT */}
        {loading ? (
          <p style={{ color: "#777" }}>Loading products...</p>
        ) : displayed.length === 0 ? (
          <p style={{ color: "#777" }}>
            {search ? `No results for "${search}".` : "No products available yet."}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "18px" }}>
            {displayed.map((product) => (
              <div
                key={product.id}
                style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e8e8e8", overflow: "hidden", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
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