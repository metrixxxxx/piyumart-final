"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch("/api/cart");
        if (res.status === 401) { router.push("/login"); return; }
        const data = await res.json();
        setCart(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, [router]);

  async function handleUpdateQuantity(cartItemId, newQty) {
    if (newQty < 1) return;
    setUpdatingId(cartItemId);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_item_id: cartItemId, quantity: newQty }),
      });
      setCart((prev) =>
        prev.map((item) => item.id === cartItemId ? { ...item, quantity: newQty } : item)
      );
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(cartItemId) {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_item_id: cartItemId }),
    });
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    setSelectedItems((prev) => prev.filter((id) => id !== cartItemId));
  }

  async function handleBulkRemove() {
    if (selectedItems.length === 0) return;
    if (!confirm(`Remove ${selectedItems.length} item(s)?`)) return;
    await Promise.all(selectedItems.map((id) =>
      fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_item_id: id }),
      })
    ));
    setCart((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  }

  function toggleSelectItem(id) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setSelectedItems(selectedItems.length === cart.length ? [] : cart.map((item) => item.id));
  }

  function handleCheckoutAll() {
    sessionStorage.removeItem("selectedCartItems");
    router.push("/checkout");
  }

  function handleCheckoutSelected() {
    const selected = cart.filter((item) => selectedItems.includes(item.id));
    sessionStorage.setItem("selectedCartItems", JSON.stringify(selected));
    router.push("/checkout?source=selected");
  }

  function handleBuyNow(item) {
    router.push(`/checkout?productId=${item.product_id}&quantity=${item.quantity}`);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8f7f4" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTop: "3px solid #1a1a2e", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#9ca3af" }}>Loading cart...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedTotal = cart
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const allSelected = selectedItems.length === cart.length && cart.length > 0;

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ background: "#1a1a2e", color: "#fff", padding: "50px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>Your Cart</h1>
        <p style={{ opacity: 0.5, marginTop: "8px", fontSize: "14px" }}>
          {cart.length === 0 ? "Nothing here yet" : `${cart.length} item${cart.length > 1 ? "s" : ""} in your cart`}
        </p>
      </section>

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: "20px", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>Your cart is empty</h2>
            <p style={{ color: "#9ca3af", marginBottom: "24px", fontSize: "14px" }}>Browse products and add items to get started</p>
            <button
              onClick={() => router.push("/products")}
              style={{ background: "#1a1a2e", color: "#fff", padding: "12px 28px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }} className="cart-grid">

            {/* LEFT — Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Toolbar */}
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e8e8e8", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                  <div
                    onClick={toggleSelectAll}
                    style={{
                      width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                      border: allSelected ? "none" : "2px solid #d1d5db",
                      background: allSelected ? "#1a1a2e" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {allSelected && <span style={{ color: "#fff", fontSize: "12px", fontWeight: "700" }}>✓</span>}
                  </div>
                  Select All
                </label>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleBulkRemove}
                    style={{ background: "#fef2f2", color: "#e94560", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Remove {selectedItems.length} selected
                  </button>
                )}
              </div>

              {/* Cart Items */}
              {cart.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                const isUpdating = updatingId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#fff",
                      border: isSelected ? "1.5px solid #2563eb" : "1px solid #e8e8e8",
                      borderRadius: "16px", padding: "16px",
                      display: "flex", gap: "14px", alignItems: "center",
                      transition: "border 0.15s, box-shadow 0.15s",
                      boxShadow: isSelected ? "0 0 0 3px #bfdbfe" : "none",
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleSelectItem(item.id)}
                      style={{
                        width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                        border: isSelected ? "none" : "2px solid #d1d5db",
                        background: isSelected ? "#2563eb" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {isSelected && <span style={{ color: "#fff", fontSize: "12px", fontWeight: "700" }}>✓</span>}
                    </div>

                    {/* Image */}
                    <img
                      src={item.image_url || "/placeholder.png"}
                      style={{ width: "76px", height: "76px", objectFit: "cover", borderRadius: "12px", flexShrink: 0, border: "1px solid #f0f0f0" }}
                    />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: "600", fontSize: "15px", color: "#111827", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </h3>
                      {item.variant && (
                        <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "999px", display: "inline-block", marginBottom: "6px" }}>
                          {item.variant}
                        </span>
                      )}
                      <p style={{ color: "#2563eb", fontWeight: "700", fontSize: "15px", margin: "0 0 8px" }}>
                        ₱{(item.price * item.quantity).toLocaleString()}
                        <span style={{ color: "#9ca3af", fontWeight: "400", fontSize: "12px", marginLeft: "6px" }}>
                          ₱{Number(item.price).toLocaleString()} each
                        </span>
                      </p>

                      {/* ✅ Quantity Controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                          style={{
                            width: "30px", height: "30px", borderRadius: "8px 0 0 8px",
                            border: "1.5px solid #e5e7eb", borderRight: "none",
                            background: item.quantity <= 1 ? "#f9fafb" : "#fff",
                            color: item.quantity <= 1 ? "#d1d5db" : "#374151",
                            fontSize: "16px", fontWeight: "700", cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >−</button>
                        <div style={{
                          width: "38px", height: "30px", border: "1.5px solid #e5e7eb",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: "700", color: "#111827", background: "#fff",
                        }}>
                          {isUpdating ? "..." : item.quantity}
                        </div>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          style={{
                            width: "30px", height: "30px", borderRadius: "0 8px 8px 0",
                            border: "1.5px solid #e5e7eb", borderLeft: "none",
                            background: "#fff", color: "#374151",
                            fontSize: "16px", fontWeight: "700", cursor: isUpdating ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >+</button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleBuyNow(item)}
                        style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Buy Now
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={{ background: "#fef2f2", color: "#e94560", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT — Summary (unchanged) */}
            <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8e8e8", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>Order Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280" }}>
                    <span>Subtotal ({cart.length} items)</span>
                    <span>₱{totalPrice.toLocaleString()}</span>
                  </div>
                  {selectedItems.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#2563eb" }}>
                      <span>Selected ({selectedItems.length} items)</span>
                      <span>₱{selectedTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                    <span>Total</span>
                    <span>₱{(selectedItems.length > 0 ? selectedTotal : totalPrice).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleCheckoutSelected}
                      style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
                    >
                      Checkout Selected ({selectedItems.length})
                    </button>
                  )}
                  <button
                    onClick={handleCheckoutAll}
                    style={{
                      width: "100%",
                      background: selectedItems.length > 0 ? "#f9fafb" : "#1a1a2e",
                      color: selectedItems.length > 0 ? "#374151" : "#fff",
                      border: selectedItems.length > 0 ? "1px solid #e5e7eb" : "none",
                      borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: "700", cursor: "pointer"
                    }}
                  >
                    Checkout All
                  </button>
                </div>
              </div>
              <button
                onClick={() => router.push("/products")}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", textAlign: "center" }}
              >
                ← Continue Shopping
              </button>
            </div>
          </div>
        )}
      </section>

      <style>{`
        @media (max-width: 700px) {
          .cart-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}