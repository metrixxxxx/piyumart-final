import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await db.query(
    `SELECT p.*, u.name as seller_name 
     FROM products p 
     JOIN users u ON p.seller_id = u.id 
     ORDER BY p.created_at DESC`
  );

  return Response.json(rows);
}