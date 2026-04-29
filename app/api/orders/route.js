// app/api/orders/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: fetch all orders for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await db.query(
      `SELECT o.*, 
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)
               ) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.id DESC`,
      [session.user.id]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Orders GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create a new order
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { name, email, address, payment_method, total, items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Create order
    const [result] = await db.query(
      `INSERT INTO orders (user_id, name, email, address, payment_method, total, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [session.user.id, name, email, address, payment_method, total]
    );

    const orderId = result.insertId;

    // 2. Insert order items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error("Order POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
