import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import db from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH — accept or reject a seller
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json(); // action = "accept" or "reject"

  if (!["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = action === "accept" ? "active" : "rejected";

  try {
    await db.query(
      `UPDATE users SET status = ? WHERE id = ? AND role = 'seller'`,
      [newStatus, params.id]
    );
    return NextResponse.json({ message: `Seller ${action}ed successfully` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}