"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
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
  }, [router]);

  // ----------------------------
  // REMOVE SINGLE ITEM
  // ----------------------------
  async function handleRemove(cartItemId) {
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_item_id: cartItemId }),
      });
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      setSelectedItems((prev) => prev.filter((id) => id !== cartItemId));
    } catch (err) {
      console.error("Remove error:", err);
    }
  }

  // ----------------------------
  // BULK REMOVE
  // ----------------------------
  async function handleBulkRemove() {
    if (selectedItems.length === 0) return;
    if (!confirm(`Remove ${selectedItems.length} item(s) from cart?`)) return;

    await Promise.all(
      selectedItems.map((id) =>
        fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_item_id: id }),
        })
      )
    );

    setCart((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  }

  // ----------------------------
  // CHECKBOX HANDLERS
  // ----------------------------
  function toggleSelectItem(id) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map((item) => item.id));
    }
  }

  // ----------------------------
  // CHECKOUT ALL
  // ----------------------------
  function handleCheckout() {
    sessionStorage.removeItem("selectedCartItems");
    router.push("/checkout");
  }

  // ----------------------------
  // CHECKOUT SELECTED
  // ----------------------------
  function handleCheckoutSelected() {
    // I-store yung selected items sa sessionStorage
    const selectedCartItems = cart.filter((item) =>
      selectedItems.includes(item.id)
    );
    sessionStorage.setItem(
      "selectedCartItems",
      JSON.stringify(selectedCartItems)
    );
    router.push("/checkout?source=selected");
  }

  function handleBuyNow(item) {
  router.push(`/checkout?productId=${item.product_id}&quantity=${item.quantity}`); // 👈 dagdag &quantity
}

  if (loading) return <p className="p-8">Loading cart...</p>;

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const selectedTotal = cart
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const btnBlue = {
  background: "#1a1a2e",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "12px",
  border: "none",
  cursor: "pointer",
};

const btnRed = {
  background: "#e94560",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "12px",
  border: "none",
  cursor: "pointer",
};

const btnGreen = {
  background: "#198754",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "12px",
  border: "none",
  cursor: "pointer",
};

  return (
  <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

    {/* HERO */}
    <section
      style={{
        background: "#1a1a2e",
        color: "#fff",
        padding: "50px 20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: "700" }}>Your Cart</h1>
      <p style={{ opacity: 0.6, marginTop: "6px" }}>
        Review items before checkout
      </p>
    </section>

    {/* CONTENT */}
    <section
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >

      {cart.length === 0 ? (
        <p style={{ color: "#777" }}>Your cart is empty.</p>
      ) : (
        <>
          {/* SELECT ALL */}
          <div style={{ marginBottom: "16px", fontSize: "14px" }}>
            <label>
              <input
                type="checkbox"
                checked={selectedItems.length === cart.length && cart.length > 0}
                onChange={toggleSelectAll}
              />{" "}
              Select All
            </label>
          </div>

          {/* CART ITEMS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                  />

                  <img
                    src={item.image_url || "https://via.placeholder.com/80"}
                    style={{
                      width: "70px",
                      height: "70px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />

                  <div>
                    <h3 style={{ fontWeight: "600" }}>{item.name}</h3>
                    <p style={{ fontSize: "12px", color: "#777" }}>
                      Qty: {item.quantity}
                    </p>
                    <p style={{ color: "#e94560", fontWeight: "700" }}>
                      ₱{item.price}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={btnBlue} onClick={() => handleBuyNow(item)}>
                    Buy
                  </button>
                  <button style={btnRed} onClick={() => handleRemove(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL SECTION */}
          <div
            style={{
              marginTop: "30px",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: "12px",
              padding: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
                ₱{totalPrice.toLocaleString()}
              </h2>

              {selectedItems.length > 0 && (
                <p style={{ fontSize: "12px", color: "#777" }}>
                  Selected: ₱{selectedTotal.toLocaleString()}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {selectedItems.length > 0 && (
                <button style={btnBlue} onClick={handleCheckoutSelected}>
                  Checkout Selected
                </button>
              )}

              <button style={btnGreen} onClick={handleCheckout}>
                Checkout All
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  </main>
);
}