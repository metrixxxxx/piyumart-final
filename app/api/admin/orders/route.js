import db from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

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
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();

  await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

  return Response.json({ success: true });
}
