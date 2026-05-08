import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // To this
const [products] = await db.query(
  "SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC",
  [userId]
);

  // To this
const [orderStats] = await db.query(
  `SELECT 
    COUNT(DISTINCT o.id) as totalOrders,
    COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
   FROM orders o
   JOIN order_items oi ON oi.order_id = o.id
   JOIN products p ON p.id = oi.product_id
   WHERE p.seller_id = ?`,
  [userId]
);

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_visible === 1).length,
    totalOrders: orderStats[0]?.totalOrders || 0,
    revenue: orderStats[0]?.revenue || 0,
    
  };

  return NextResponse.json({ products, stats });
}