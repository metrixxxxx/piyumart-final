import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.query("DELETE FROM products WHERE id = ?", [id]);

  // ✅ Notify all users product was deleted
  if (global.io) {
    global.io.emit("products:deleted", { id: Number(id) });
  }

  return Response.json({ message: "Deleted" });
}

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { name, price, stock } = await req.json();

  await db.query(
    "UPDATE products SET name=?, price=?, stock=? WHERE id=?",
    [name, price, stock, id]
  );

  // ✅ Notify all users product was updated
  if (global.io) {
    global.io.emit("products:updated", { id: Number(id), name, price, stock });
  }

  return Response.json({ message: "Updated" });
}