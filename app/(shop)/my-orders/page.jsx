"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading)
    return <p className="p-8">Loading orders...</p>;

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
      <h1 style={{ fontSize: "32px", fontWeight: "700" }}>My Orders</h1>
      <p style={{ opacity: 0.6, marginTop: "6px" }}>
        Track your purchases
      </p>
    </section>

    {/* CONTENT */}
    <section
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >

      {orders.length === 0 ? (
        <p style={{ color: "#777" }}>No orders yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: "12px",
                padding: "16px",
              }}
            >

              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ fontWeight: "700" }}>
                  Order #{order.id}
                </h3>

                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background:
                      order.status === "pending"
                        ? "#fff3cd"
                        : order.status === "completed"
                        ? "#d4edda"
                        : "#f8d7da",
                  }}
                >
                  {order.status}
                </span>
              </div>

              {/* INFO */}
              <p style={{ fontSize: "13px", color: "#777" }}>
                {order.name} • {order.address}
              </p>

              {/* TOTAL */}
              <p style={{ marginTop: "10px", fontWeight: "700", color: "#e94560" }}>
                ₱{Number(order.total).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  </main>
);
}