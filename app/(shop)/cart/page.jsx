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

    fetchCart();
  }, []);

  async function handleBuyNow(item) {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/checkout");
      }
    } catch (err) {
      console.error("Error buying item:", err);
    }
  }

  async function handleCheckout() {
    try {
      const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          total: totalPrice,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Order placed!");
        router.push("/orders");
      } else {
        alert("Checkout failed");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  }

  if (loading) return <p className="p-8">Loading cart...</p>;

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="flex items-center space-x-4">
                  {/* ✅ FIXED IMAGE FALLBACK */}
                  <img
                    src={
                      item.image_url ||
                      "https://via.placeholder.com/150"
                    }
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  <div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-gray-600">₱{item.price}</p>
                    <p className="text-sm">Qty: {item.quantity}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleBuyNow(item)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Buy Now
                </button>
              </li>
            ))}
          </ul>

          {/* TOTAL + CHECKOUT */}
          <div className="mt-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              Total: ₱{totalPrice}
            </h2>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </main>
  );
}