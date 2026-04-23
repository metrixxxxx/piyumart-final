import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, price, image_url } = body;

    const [result] = await db.query(
      "INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)",
      [name, description, price, image_url]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("DB Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


// GET all products
export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
