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

  return (
    <main className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        {selectedItems.length > 0 && (
          <button
            onClick={handleBulkRemove}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Remove Selected ({selectedItems.length})
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={selectedItems.length === cart.length && cart.length > 0}
              onChange={toggleSelectAll}
              id="selectAll"
            />
            <label htmlFor="selectAll" className="text-sm text-gray-600 cursor-pointer">
              Select All
            </label>
          </div>

          <ul className="space-y-4">
            {cart.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between border-b pb-4 ${
                  selectedItems.includes(item.id) ? "bg-blue-50 rounded-lg px-2" : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                  />
                  <img
                    src={item.image_url || "https://via.placeholder.com/150"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-gray-600">₱{item.price}</p>
                    <p className="text-sm">Qty: {item.quantity}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleBuyNow(item)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Total + Checkout buttons */}
          <div className="mt-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Total: ₱{totalPrice.toLocaleString()}</h2>
              {selectedItems.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Selected: ₱{selectedTotal.toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {/* Checkout Selected — lalabas lang kapag may selected */}
              {selectedItems.length > 0 && (
                <button
                  onClick={handleCheckoutSelected}
                  className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
                >
                  Checkout Selected ({selectedItems.length})
                </button>
              )}

              {/* Checkout All — lagi nandito */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Checkout All
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}