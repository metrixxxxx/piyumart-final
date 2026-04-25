import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { productId } = await req.json();

    // 1. Get user
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [session.user.email]
    );

    const user = users[0];
    if (!user) return new Response("User not found", { status: 404 });

    // 2. Get or create cart
    let [carts] = await db.query(
      "SELECT * FROM carts WHERE user_id = ?",
      [user.id]
    );

    let cart;

    if (carts.length === 0) {
      await db.query(
        "INSERT INTO carts (user_id) VALUES (?)",
        [user.id]
      );

      [carts] = await db.query(
        "SELECT * FROM carts WHERE user_id = ?",
        [user.id]
      );
    }

    cart = carts[0];

    // 3. Check if item exists
    const [items] = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cart.id, productId]
    );

    if (items.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?",
        [items[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 1)",
        [cart.id, productId]
      );
    }

    return Response.json({ message: "Added to cart" });

  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}