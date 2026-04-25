// app/api/cart/route.js
import db from '@/lib/db';                          // 👈 missing
import { getServerSession } from 'next-auth';        // 👈 missing
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // 👈 missing

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const userId = session.user.id;

    const [items] = await db.query(`
  SELECT 
    cart_items.id,
    cart_items.product_id,
    cart_items.quantity,
    products.name,
    products.price,
    products.image_url
  FROM cart_items
  JOIN carts ON cart_items.cart_id = carts.id
  JOIN products ON cart_items.product_id = products.id
  WHERE carts.user_id = ?
`, [userId]);

    return Response.json(items);

  } catch (err) {
    console.error('GET /api/cart error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const userId = session.user.id;
    const { product_id, quantity } = await req.json();

    // 1. Get or create the user's cart
    const [cart] = await db.query(
      'SELECT id FROM carts WHERE user_id = ?', [userId]
    );

    let cartId;
    if (cart.length === 0) {
      const [result] = await db.query(
        'INSERT INTO carts (user_id) VALUES (?)', [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = cart[0].id;
    }

    // 2. Add item to that cart
    await db.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
      [cartId, product_id, quantity]
    );

    return Response.json({ success: true });

  } catch (err) {
    console.error('POST /api/cart error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}