"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId");
  const isBuyNow = Boolean(productId);
  const quantity = parseInt(searchParams.get("quantity") || "1");

  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
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
            if (stored) setCartItems(JSON.parse(stored));
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

  const items = isBuyNow && product ? [{ ...product, quantity }] : cartItems;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

 async function handleSubmit() {
  if (!name || !email || !address) return alert("Please fill in all fields!");
  if (!email.endsWith("@lspu.edu.ph")) return alert("Please use your LSPU email!");
  if (items.length === 0) return alert("No items to checkout!");

  setSubmitting(true);
  try {
    for (const item of items) {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, address,
          payment_method: paymentMethod,
          total: item.price * item.quantity,
          items: [{ product_id: item.product_id || item.id, quantity: item.quantity || 1, price: item.price }],
        }),
      });

      // ✅ Catch stock errors from the server
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
    }

    setOrderDone(true);
    setTimeout(() => router.push("/my-orders"), 2500);
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  } finally {
    setSubmitting(false);
  }
}

  if (status === "loading" || loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8f7f4" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTop: "3px solid #1a1a2e", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading checkout...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ✅ Success screen
  if (orderDone) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8f7f4" }}>
      <div style={{ textAlign: "center", padding: "48px", background: "#fff", borderRadius: "24px", border: "1px solid #e8e8e8", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>Order Placed!</h2>
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Redirecting to your orders...</p>
      </div>
    </div>
  );

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ background: "#1a1a2e", color: "#fff", padding: "50px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>Checkout</h1>
        <p style={{ opacity: 0.5, marginTop: "8px", fontSize: "14px" }}>
          {items.length} item{items.length !== 1 ? "s" : ""} · ₱{total.toLocaleString()} total
        </p>
      </section>

      <section style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }} className="checkout-grid">

          {/* LEFT — Delivery Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Section: Contact */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e8e8", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#fff" }}>1</div>
                <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", margin: 0 }}>Contact Information</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Juan dela Cruz"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>LSPU Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@lspu.edu.ph"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section: Delivery */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e8e8", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#fff" }}>2</div>
                <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", margin: 0 }}>Delivery Address</h2>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building, Street, Barangay, City, Province"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
            </div>

            {/* Section: Payment */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e8e8", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#fff" }}>3</div>
                <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", margin: 0 }}>Payment Method</h2>
              </div>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 16px", borderRadius: "12px",
                  border: "1.5px solid #1a1a2e", background: "#f8f7f4",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>💵</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0 }}>Cash on Delivery</p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Pay when your order arrives</p>
                </div>
                <div style={{ marginLeft: "auto", width: "18px", height: "18px", borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Order Summary */}
          <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e8e8", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>Order Summary</h3>

              {items.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "14px" }}>No items to checkout.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <img
                        src={item.image_url || "/placeholder.png"}
                        alt={item.name}
                        style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "10px", flexShrink: 0, border: "1px solid #f0f0f0" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "#111827", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                        <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Qty: {item.quantity}</p>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#111827", margin: 0, flexShrink: 0 }}>
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280" }}>
                  <span>Subtotal</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280" }}>
                  <span>Shipping</span>
                  <span style={{ color: "#16a34a", fontWeight: "600" }}>Free</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700", color: "#111827", marginTop: "4px" }}>
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || items.length === 0}
                style={{
                  width: "100%", marginTop: "16px",
                  background: submitting || items.length === 0 ? "#9ca3af" : "#1a1a2e",
                  color: "#fff", border: "none", borderRadius: "12px",
                  padding: "14px", fontSize: "14px", fontWeight: "700",
                  cursor: submitting || items.length === 0 ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {submitting ? "Placing Order..." : `Place Order · ₱${total.toLocaleString()}`}
              </button>

              <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", marginTop: "10px", lineHeight: "1.5" }}>
                🔒 Secured checkout · Cash on Delivery only
              </p>
            </div>

            <button
              onClick={() => router.back()}
              style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", textAlign: "center" }}
            >
              ← Back to Cart
            </button>
          </div>

        </div>
      </section>

      <style>{`
        @media (max-width: 700px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  background: "#fafafa",
  transition: "border 0.15s",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8f7f4" }}>
        <p style={{ color: "#9ca3af" }}>Loading checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}