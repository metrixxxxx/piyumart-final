"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const hasInitialized = useRef(false);

  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // set fields individually — avoids cascading render issue
    setName(session.user.name || "");
    setEmail(session.user.email || "");

    if (productId) {
      fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((data) => setProduct(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetch("/api/cart")
        .then((r) => r.json())
        .then((data) => setCartItems(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  const items =
    productId && product ? [{ ...product, quantity: 1 }] : cartItems;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  async function handleSubmit() {
    if (!name || !email || !address) {
      alert("Please fill in all fields!");
      return;
    }
    if (!email.endsWith("@lspu.edu.ph")) {
      alert("Please use your LSPU email (@lspu.edu.ph)!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, address,
          payment_method: paymentMethod,
          total,
          items: items.map((i) => ({
            product_id: i.product_id || i.id,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Order placed successfully! 🎉");
        router.push("/");
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || loading)
    return <p className="p-8">Loading...</p>;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Order Summary */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          {items.length === 0 ? (
            <p className="text-gray-500">No items to checkout.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-center border-b pb-3">
                  <img
                    src={item.image_url || "/placeholder.png"}
                    className="w-14 h-14 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">${item.price * item.quantity}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-lg px-4 py-2 w-full"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                LSPU Email <span className="text-red-400">(@lspu.edu.ph)</span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-4 py-2 w-full"
                placeholder="yourname@lspu.edu.ph"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border rounded-lg px-4 py-2 w-full"
                rows={3}
                placeholder="Your complete address"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border rounded-lg px-4 py-2 w-full"
              >
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="bg-blue-600 text-white py-3 rounded-xl text-lg hover:bg-blue-700 disabled:opacity-50 mt-2"
            >
              {submitting ? "Placing Order..." : "Place Order 🛍️"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}