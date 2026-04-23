export default function ProductCard({ product }) {
  return (
    <div className="border rounded shadow p-6 bg-white">
      <img
        src={product.image_url || "/placeholder.png"}
        alt={product.name}
        className="w-full h-48 object-cover rounded"
      />
      <h2 className="text-black text-lg font-semibold mt-2">{product.name}</h2>
      <p className="text-black">{product.description}</p>
      <p className="text-blue-600 font-bold mt-2">${product.price}</p>
    </div>
  );
}
