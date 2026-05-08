import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Ownership check helper
async function ownsProduct(userId, productId) {
  const [rows] = await db.query(
    "SELECT id FROM products WHERE id = ? AND seller_id = ?",
    [productId, userId]
  );
  return rows.length > 0;
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownsProduct(session.user.id, id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 // DELETE
await db.query(
  "DELETE FROM products WHERE id = ? AND seller_id = ?",
  [id, session.user.id]
);
  return NextResponse.json({ success: true });
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownsProduct(session.user.id, id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { is_visible } = await req.json();
  await db.query(
  "UPDATE products SET is_visible = ? WHERE id = ? AND seller_id = ?",
  [is_visible, id, session.user.id]
);
  return NextResponse.json({ success: true });
}