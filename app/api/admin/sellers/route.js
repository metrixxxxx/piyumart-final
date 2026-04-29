import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET — all sellers or pending sellers
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // ?status=pending

  try {
    let query = `SELECT id, name, email, status, created_at FROM users WHERE role = 'seller'`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const [sellers] = await db.query(query, params);
    return NextResponse.json(sellers);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}