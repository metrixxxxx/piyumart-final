"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId");
  const isBuyNow = Boolean(productId);
  const quantity = parseInt(searchParams.get("quantity") || "1"); // 👈 new

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
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      setLoading(true);
      try {
        if (isBuyNow) {
          const res = await fetch(`/api/products/${productId}`);
          const data = await res.json();
          setProduct(data);
        } else {
          const source = searchParams.get("source");
          if (source === "selected") {
            const stored = sessionStorage.getItem("selectedCartItems");
            if (stored) {
              setCartItems(JSON.parse(stored));
            }
          } else {
            const res = await fetch("/api/cart");
            const data = await res.json();
            setCartItems(Array.isArray(data) ? data : []);
          }
        }
        setName(session?.user?.name || "");
        setEmail(session?.user?.email || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status, isBuyNow, productId, session, searchParams]);

  const items =
  isBuyNow && product
    ? [{ ...product, quantity }] // 👈 yung quantity sa URL na, hindi na 1
    : cartItems;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
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

    if (items.length === 0) {
      alert("No items to checkout!");
      return;
    }

    setSubmitting(true);

    try {
      for (const item of items) {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            address,
            payment_method: paymentMethod,
            total: item.price * item.quantity,
            items: [{
              product_id: item.product_id || item.id,
              quantity: item.quantity || 1,
              price: item.price,
            }],
          }),
        });
      }

      alert("Order placed successfully! 🎉");
      router.push("/my-orders");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || loading || (isBuyNow && !product)) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          {items.length === 0 ? (
            <p className="text-gray-500">No items to checkout.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item, idx) => (
                <li key={idx} className="flex gap-3 border-b pb-3">
                  {/* 👇 Fixed size container para hindi mag-stretch yung image */}
                  <div style={{ width: 64, height: 64, flexShrink: 0 }}>
                    <img
                      src={item.image_url || "https://via.placeholder.com/64"}
                      alt={item.name}
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        display: "block",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold whitespace-nowrap">₱{(item.price * item.quantity).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
        </div>

        {/* DELIVERY DETAILS */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>

          <div className="flex flex-col gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full"
              placeholder="Full Name"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full"
              placeholder="Email"
            />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full"
              rows={3}
              placeholder="Address"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full"
            >
              <option value="cod">Cash on Delivery</option>
            </select>

            <button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Placing Order..." : "Place Order 🛍️"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}