import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    let rows;
    if (session?.user?.id) {
      const [result] = await db.query(
        "SELECT * FROM products WHERE seller_id != ?",
        [session.user.id]
      );
      rows = result;
    } else {
      const [result] = await db.query("SELECT * FROM products");
      rows = result;
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
      "INSERT INTO products (name, description, price, image_url, seller_id) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, image_url, session.user.id]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("DB Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}