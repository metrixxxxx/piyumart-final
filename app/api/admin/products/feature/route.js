import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const { id } = await req.json();

    // toggle featured ON/OFF
    await db.query(
      "UPDATE products SET is_featured = IF(is_featured = 1, 0, 1) WHERE id = ?",
      [id]
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false }, { status: 500 });
  }
}