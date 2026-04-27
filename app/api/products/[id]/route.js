import db from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [rows] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const product = rows[0];

    // Fetch attributes
    const [attrs] = await db.query(
      `SELECT pa.value, ad.name, ad.label, ad.type
       FROM product_attributes pa
       JOIN attribute_definitions ad ON pa.attribute_definition_id = ad.id
       WHERE pa.product_id = ?`,
      [id]
    );

    product.attributes = attrs;

    return Response.json(product);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}