// app/api/orders/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notify } from "@/lib/notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await db.query(
      `SELECT o.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'name', p.name,
            'image_url', COALESCE(
              (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC LIMIT 1),
              p.image_url
            )
          )
        ) FROM order_items oi 
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = o.id
        ) AS items
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

    // 1. Check stock for all items BEFORE doing anything
    for (const item of items) {
      const [rows] = await db.query(
        `SELECT name, stock FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (!rows[0]) {
        return NextResponse.json(
          { error: `Product not found (ID: ${item.product_id})` },
          { status: 404 }
        );
      }

      if (rows[0].stock < item.quantity) {
        return NextResponse.json(
          { error: `"${rows[0].name}" only has ${rows[0].stock} left in stock.` },
          { status: 400 }
        );
      }
    }

    // 2. Create order
    const [result] = await db.query(
      `INSERT INTO orders (user_id, name, email, address, payment_method, total, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [session.user.id, name, email, address, payment_method, total]
    );

    const orderId = result.insertId;

    // 3. Insert order items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // 4. Deduct stock + notify sellers
    for (const item of items) {
      await db.query(
        `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
        [item.quantity, item.product_id, item.quantity]
      );

      // Get updated product info
      const [productRows] = await db.query(
        `SELECT seller_id, name, stock FROM products WHERE id = ?`,
        [item.product_id]
      );
      const product = productRows[0];
      if (!product) continue;

      // Notify seller — someone bought their product
      await notify({
        userId: product.seller_id,
        type: "order",
        message: `Someone bought your product "${product.name}" x${item.quantity}`,
      });

      // Notify seller — low stock warning (threshold: 5)
      if (product.stock <= 5) {
        await notify({
          userId: product.seller_id,
          type: "low_stock",
          message: `⚠️ Low stock: "${product.name}" only has ${product.stock} left.`,
        });
      }
    }

    // 5. Notify buyer — order placed
    await notify({
      userId: session.user.id,
      type: "order_placed",
      message: `Your order #${orderId} has been placed successfully! Total: ₱${Number(total).toLocaleString()}`,
    });

    // 6. Emit to admin dashboard via socket
    if (global.io) {
      global.io.emit("orders:new", {
        orderId, name, email, address, payment_method, total, items,
      });
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error("Order POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}