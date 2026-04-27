import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import db from "@/lib/db";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  console.log("SESSION:", session); // 👈 check this

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user?.email !== process.env.ADMIN_EMAIL) {
    return new Response("Forbidden", { status: 403 });
  }

  const [rows] = await db.query("SELECT * FROM products");

  return Response.json(rows);
}
export async function DELETE(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user?.email !== process.env.ADMIN_EMAIL) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await req.json();

  await db.query("DELETE FROM products WHERE id = ?", [id]);

  return Response.json({ success: true });
}