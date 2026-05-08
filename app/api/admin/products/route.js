import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await db.query(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
  `);

  return Response.json(rows);
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  await db.query("DELETE FROM products WHERE id = ?", [id]);

  if (global.io) {
    global.io.emit("products:deleted", { id });
  }

  return Response.json({ success: true });
}