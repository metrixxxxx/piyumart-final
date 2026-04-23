import ProductList from "@/components/products/product-list";

export default async function HomePage() {
  // fetch products from backend API
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store", // para laging fresh
  });
  const products = await res.json();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">PIYUMART</h1>
      <ProductList products={products} />
    </div>
  );
}

