import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db.query("DELETE FROM product_attributes WHERE product_id = ?", [params.id]);
  await db.query("DELETE FROM product_images WHERE product_id = ?", [params.id]);
  await db.query("DELETE FROM product_variants WHERE product_id = ?", [params.id]);
  await db.query("DELETE FROM products WHERE id = ?", [params.id]);

  if (global.io) global.io.emit("products:deleted", { id: params.id });

  return Response.json({ success: true });
}