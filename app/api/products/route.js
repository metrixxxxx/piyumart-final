import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    let rows;
    if (session?.user?.id) {
      const [loggedInRows] = await db.query(
        "SELECT *, STOCK as stock FROM products WHERE seller_id != ? AND is_visible = 1",
        [session.user.id]
      );
      rows = loggedInRows;
    } else {
      const [guestRows] = await db.query(
        "SELECT *, STOCK as stock FROM products WHERE is_visible = 1"
      );
      rows = guestRows;
    }

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, image_url } = body;

    const [result] = await db.query(
      "INSERT INTO products (name, description, price, image_url, seller_id, is_visible, STOCK) VALUES (?, ?, ?, ?, ?, 1, 0)",
      [name, description, price, image_url, session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}