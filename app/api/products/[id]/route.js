import db from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = await params; // 👈 await params!
    
    const [rows] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}