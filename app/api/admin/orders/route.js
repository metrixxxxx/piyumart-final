import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { notify } from "@/lib/notify";

// GET — all orders
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await db.query(`
    SELECT o.*, u.name as buyer_name, u.email as buyer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.id DESC
  `);

  return Response.json(rows);
}

// PUT — update order status
export async function PUT(req) {
  const { id, status } = await req.json();
  await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

  // Notify the buyer
  const [orderRows] = await db.query(
    "SELECT user_id FROM orders WHERE id = ?",
    [id]
  );

  if (orderRows[0]) {
    const statusLabels = {
      pending: "Pending",
      otw: "On the way",
      delivered: "Delivered",
    };
    await notify({
      userId: orderRows[0].user_id,
      type: "order_status",
      message: `Your order #${id} is now ${statusLabels[status] || status}.`,
    });
  }

  // Emit to admin dashboard via socket
  if (global.io) {
    global.io.emit("orders:updated", { id, status });
  }

  return Response.json({ success: true });
}