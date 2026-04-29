import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params; // 👈 await

  await db.query("DELETE FROM products WHERE id = ?", [id]);

  return Response.json({ message: "Deleted" });
}

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params; // 👈 await

  const { name, price, stock } = await req.json();

  await db.query(
    "UPDATE products SET name=?, price=?, stock=? WHERE id=?",
    [name, price, stock, id]
  );

  return Response.json({ message: "Updated" });
}