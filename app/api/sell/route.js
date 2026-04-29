import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const [rows] = await db.query(
  `SELECT p.*, c.name as category_name 
   FROM products p
   LEFT JOIN categories c ON p.category_id = c.id
   WHERE p.seller_id = ?`,
  [session.user.id]
);

    // Fetch attributes for each product
    const productsWithAttributes = await Promise.all(
      rows.map(async (product) => {
        const [attrs] = await db.query(
          `SELECT pa.value, ad.name, ad.label, ad.type
           FROM product_attributes pa
           JOIN attribute_definitions ad ON pa.attribute_definition_id = ad.id
           WHERE pa.product_id = ?`,
          [product.id]
        );
        return { ...product, attributes: attrs };
      })
    );

    return Response.json(productsWithAttributes);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { name, description, price, image_url, category_id, attributes } = await req.json();

    // Insert product
    const [result] = await db.query(
      "INSERT INTO products (name, description, price, image_url, seller_id, seller_name, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, description, price, image_url, session.user.id, session.user.name, category_id]
    );

    const product_id = result.insertId;

    // Insert attributes
    if (attributes && attributes.length > 0) {
      await Promise.all(
        attributes.map(({ attribute_definition_id, value }) => {
          if (value === "" || value === null || value === undefined) return;
          return db.query(
            "INSERT INTO product_attributes (product_id, attribute_definition_id, value) VALUES (?, ?, ?)",
            [product_id, attribute_definition_id, value]
          );
        })
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { id, name, description, price, image_url, category_id, attributes } = await req.json();

    // Update product
    await db.query(
      "UPDATE products SET name=?, description=?, price=?, image_url=?, category_id=? WHERE id=? AND seller_id=?",
      [name, description, price, image_url, category_id, id, session.user.id]
    );

    // Delete old attributes then re-insert
    await db.query("DELETE FROM product_attributes WHERE product_id = ?", [id]);

    if (attributes && attributes.length > 0) {
      await Promise.all(
        attributes.map(({ attribute_definition_id, value }) => {
          if (value === "" || value === null || value === undefined) return;
          return db.query(
            "INSERT INTO product_attributes (product_id, attribute_definition_id, value) VALUES (?, ?, ?)",
            [id, attribute_definition_id, value]
          );
        })
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { id } = await req.json();

    // Attributes auto-deleted via ON DELETE CASCADE
    await db.query(
      "DELETE FROM products WHERE id=? AND seller_id=?",
      [id, session.user.id]
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}