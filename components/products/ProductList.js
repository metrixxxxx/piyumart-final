import ProductCard from "./ProductCard";

export default function ProductList({ products }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
