import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  // Check if logged in user is admin
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [[{ totalUsers }]]      = await db.query(`SELECT COUNT(*) AS totalUsers FROM users WHERE role != 'admin'`);
    const [[{ totalSellers }]]    = await db.query(`SELECT COUNT(*) AS totalSellers FROM users WHERE role = 'seller' AND status = 'active'`);
    const [[{ pendingSellers }]]  = await db.query(`SELECT COUNT(*) AS pendingSellers FROM users WHERE role = 'seller' AND status = 'pending'`);
    const [[{ totalProducts }]]   = await db.query(`SELECT COUNT(*) AS totalProducts FROM products WHERE status = 'approved'`);
    const [[{ pendingProducts }]] = await db.query(`SELECT COUNT(*) AS pendingProducts FROM products WHERE status = 'pending'`);
    const [[{ totalOrders }]]     = await db.query(`SELECT COUNT(*) AS totalOrders FROM orders`);
    const [[{ totalRevenue }]]    = await db.query(`SELECT SUM(total) AS totalRevenue FROM orders WHERE status = 'delivered'`);

    return NextResponse.json({
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      pendingProducts,
      totalOrders,
      totalRevenue: totalRevenue || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function toggleFeatured(id) {
  await fetch("/api/products/feature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  // refresh page or re-fetch products
  window.location.reload();
}