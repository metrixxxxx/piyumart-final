import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE is_featured = 1 LIMIT 5"
    );

    // ALWAYS return valid JSON array
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("Featured API error:", err);

    // NEVER return undefined or crash response
    return Response.json([]);
  }
}