import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();

  await db.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status, params.id]
  );

  return Response.json({ message: "Order updated" });
}