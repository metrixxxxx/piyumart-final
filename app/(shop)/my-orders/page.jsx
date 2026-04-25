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
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-600"
                    : order.status === "completed"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Name:</span>
                  <span>{order.name}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Address:</span>
                  <span>{order.address}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Payment:</span>
                  <span className="uppercase">{order.payment_method}</span>
                </div>
                <div className="flex justify-between font-bold mt-3 text-lg">
                  <span>Total</span>
                  <span>${Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}