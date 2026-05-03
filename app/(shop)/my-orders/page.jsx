"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

const STATUS_CONFIG = {
  pending:   { label: "Pending",    bg: "#fff8e1", color: "#b45309", dot: "#f59e0b" },
  confirmed: { label: "Confirmed",  bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  shipped:   { label: "Shipped",    bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  completed: { label: "Completed",  bg: "#f0fdf4", color: "#15803d", dot: "#16a34a" },
  cancelled: { label: "Cancelled",  bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "12px", fontWeight: "600", padding: "4px 12px",
      borderRadius: "999px", background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const items = (() => {
    try { return typeof order.items === "string" ? JSON.parse(order.items) : (order.items || []); }
    catch { return []; }
  })();

  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={{
      background: "#fff", borderRadius: "16px",
      border: "1px solid #e8e8e8", overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      {/* CARD HEADER */}
      <div style={{
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: expanded ? "1px solid #f3f4f6" : "none",
        cursor: "pointer", gap: "12px",
      }} onClick={() => setExpanded(!expanded)}>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
          {/* Show first item image in header, or fallback icon */}
          {items[0]?.image_url ? (
            <img
              src={items[0].image_url}
              alt={items[0].name}
              style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid #e8e8e8" }}
            />
          ) : (
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "#f8f7f4", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "18px", flexShrink: 0,
            }}>🛍️</div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>
                Order #{order.id}
              </span>
              <StatusBadge status={order.status} />
            </div>
            {date && (
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>{date}</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
          <span style={{ fontWeight: "700", fontSize: "16px", color: "#111827" }}>
            ₱{Number(order.total).toLocaleString()}
          </span>
          <span style={{
            color: "#9ca3af", fontSize: "12px", display: "inline-block",
            transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}>▼</span>
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Delivery Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="order-info-grid">
            <div style={{ background: "#f8f7f4", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Recipient</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0 }}>{order.name || "—"}</p>
            </div>
            <div style={{ background: "#f8f7f4", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Email</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0, wordBreak: "break-all" }}>{order.email || "—"}</p>
            </div>
            <div style={{ background: "#f8f7f4", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Payment</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0 }}>
                {order.payment_method === "cod" ? "💵 Cash on Delivery" : order.payment_method || "—"}
              </p>
            </div>
            <div style={{ background: "#f8f7f4", borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Address</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: 0 }}>{order.address || "—"}</p>
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
                Items Ordered
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 14px", background: "#f8f7f4", borderRadius: "10px",
                  }}>
                    {/* ✅ Product image */}
                    <img
                      src={item.image_url || "/placeholder.png"}
                      alt={item.name || "Product"}
                      onError={(e) => { e.target.src = "https://placehold.co/52x52?text=?"; }}
                      style={{
                        width: "52px", height: "52px", borderRadius: "8px",
                        objectFit: "cover", flexShrink: 0, border: "1px solid #e8e8e8",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* ✅ Product name */}
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name || `Product #${item.product_id}`}
                      </p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>
                        Qty: {item.quantity} × ₱{Number(item.price).toLocaleString()}
                      </p>
                    </div>
                    <p style={{ fontWeight: "700", color: "#111827", margin: 0, fontSize: "14px", flexShrink: 0 }}>
                      ₱{(item.quantity * item.price).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: "1px solid #f3f4f6", paddingTop: "12px",
          }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#6b7280" }}>Order Total</span>
            <span style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e" }}>
              ₱{Number(order.total).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));

    const socket = getSocket();
    socket.on("orders:updated", ({ id, status }) => {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    });
    return () => socket.off("orders:updated");
  }, [status]);

  if (status === "loading" || loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8f7f4" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTop: "3px solid #1a1a2e", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading orders...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <main style={{ background: "#f8f7f4", minHeight: "100vh" }}>

      {/* HERO */}
      <section style={{ background: "#1a1a2e", color: "#fff", padding: "50px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>My Orders</h1>
        <p style={{ opacity: 0.5, marginTop: "8px", fontSize: "14px" }}>
          {orders.length === 0 ? "No orders yet" : `${orders.length} order${orders.length > 1 ? "s" : ""} total`}
        </p>
      </section>

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: "20px", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📦</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>No orders yet</h2>
            <p style={{ color: "#9ca3af", marginBottom: "24px", fontSize: "14px" }}>Your completed purchases will appear here</p>
            <button
              onClick={() => router.push("/products")}
              style={{ background: "#1a1a2e", color: "#fff", padding: "12px 28px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            {/* FILTER TABS */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {["all", "pending", "confirmed", "shipped", "completed", "cancelled"].map((s) => {
                const count = s === "all" ? orders.length : (statusCounts[s] || 0);
                if (s !== "all" && !statusCounts[s]) return null;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    style={{
                      padding: "7px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: "600",
                      border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                      borderColor: filter === s ? "#1a1a2e" : "#e5e7eb",
                      background: filter === s ? "#1a1a2e" : "#fff",
                      color: filter === s ? "#fff" : "#374151",
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>

            {/* ORDERS LIST */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px" }}>No {filter} orders.</p>
              ) : (
                filtered.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </>
        )}
      </section>

      <style>{`
        @media (max-width: 600px) {
          .order-info-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}