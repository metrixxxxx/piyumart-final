import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 👈 import from here

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const [rows] = await db.query(
      "SELECT * FROM products WHERE seller_id = ?",
      [session.user.id]
    );
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { name, description, price, image_url } = await req.json();

    await db.query(
      "INSERT INTO products (name, description, price, image_url, seller_id, seller_name) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, price, image_url, session.user.id, session.user.name]
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { id, name, description, price, image_url } = await req.json();

    await db.query(
      "UPDATE products SET name=?, description=?, price=?, image_url=? WHERE id=? AND seller_id=?",
      [name, description, price, image_url, id, session.user.id]
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await req.json();

    await db.query(
      "DELETE FROM products WHERE id=? AND seller_id=?",
      [id, session.user.id]
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}