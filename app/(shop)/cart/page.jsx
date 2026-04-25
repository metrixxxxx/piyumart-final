"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch("/api/cart");

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        setCart(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCart(); // 👈 only runs once on mount
  }, []); // 👈 empty array = only on mount, never again

  async function handleAddToCart(item) {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Item added to cart!");
        // manually refetch after adding
        const res2 = await fetch("/api/cart");
        const updated = await res2.json();
        setCart(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  }

  if (loading) return <p className="p-8">Loading cart...</p>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <ul className="space-y-4">
          {cart.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={item.image_url || "/placeholder.png"}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="text-gray-600">${item.price}</p>
                  <p className="text-sm">Qty: {item.quantity}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Add Again
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}