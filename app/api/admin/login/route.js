import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // 1. Find user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?", [email]
    );

    if (rows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 401 });
    }

    const user = rows[0];

    // 2. Check if admin
    if (user.role !== "admin") {
      return Response.json({ error: "Access denied — not an admin" }, { status: 403 });
    }

    // 3. Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json({ error: "Wrong password" }, { status: 401 });
    }

    // 4. Set admin cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}