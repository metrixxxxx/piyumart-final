import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Helper — saves a file to /public/uploads and returns its public URL
async function saveFile(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const [rows] = await db.query(
      `SELECT p.*, p.STOCK as stock, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ?`,
      [session.user.id]
    );

    const productsWithDetails = await Promise.all(
      rows.map(async (product) => {
        const [attrs] = await db.query(
          `SELECT pa.value, ad.name, ad.label, ad.type
           FROM product_attributes pa
           JOIN attribute_definitions ad ON pa.attribute_definition_id = ad.id
           WHERE pa.product_id = ?`,
          [product.id]
        );

        const [images] = await db.query(
          `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
          [product.id]
        );

        const [variants] = await db.query(
          `SELECT label, image_url FROM product_variants WHERE product_id = ? ORDER BY id ASC`,
          [product.id]
        );

        return {
          ...product,
          attributes: attrs,
          images: images.map((r) => r.image_url),
          variants,
        };
      })
    );

    return Response.json(productsWithDetails);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });

    const formData = await req.formData();

    const name        = formData.get("name");
    const description = formData.get("description");
    const price       = formData.get("price");
    const category_id = formData.get("category_id");
    const stock       = parseInt(formData.get("stock")) || 0;
    const is_visible  = parseInt(formData.get("is_visible")) ?? 1;
    const attributes  = JSON.parse(formData.get("attributes") || "[]");
    const variantCount = parseInt(formData.get("variant_count")) || 0;

    // Save main images
    const imageFiles = formData.getAll("images");
    const imageUrls = [];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const url = await saveFile(file);
        imageUrls.push(url);
      }
    }

    // Use first image as the legacy image_url for backwards compatibility
    const image_url = imageUrls[0] || null;

    const [result] = await db.query(
      "INSERT INTO products (name, description, price, image_url, seller_id, seller_name, category_id, stock, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, description, price, image_url, session.user.id, session.user.name, category_id, stock, is_visible]
    );

    const product_id = result.insertId;

    // Save all images to product_images table
    if (imageUrls.length > 0) {
      await Promise.all(
        imageUrls.map((url, i) =>
          db.query(
            "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
            [product_id, url, i]
          )
        )
      );
    }

    // Save variants
    for (let i = 0; i < variantCount; i++) {
      const label = formData.get(`variant_label_${i}`);
      const variantFile = formData.get(`variant_image_${i}`);
      let variantImageUrl = null;
      if (variantFile && variantFile.size > 0) {
        variantImageUrl = await saveFile(variantFile);
      }
      if (label) {
        await db.query(
          "INSERT INTO product_variants (product_id, label, image_url) VALUES (?, ?, ?)",
          [product_id, label, variantImageUrl]
        );
      }
    }

    // Save attributes
    if (attributes.length > 0) {
      await Promise.all(
        attributes.map(({ attribute_definition_id, value }) => {
          if (!value) return;
          return db.query(
            "INSERT INTO product_attributes (product_id, attribute_definition_id, value) VALUES (?, ?, ?)",
            [product_id, attribute_definition_id, value]
          );
        })
      );
    }

    if (global.io) {
      global.io.emit("products:new", {
        id: product_id, name, description, price, image_url,
        images: imageUrls, category_id, stock,
        seller_id: session.user.id,
        seller_name: session.user.name,
        is_visible,
      });
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

    const formData = await req.formData();

    const id          = formData.get("id");
    const name        = formData.get("name");
    const description = formData.get("description");
    const price       = formData.get("price");
    const category_id = formData.get("category_id");
    const stock       = parseInt(formData.get("stock")) || 0;
    const is_visible  = parseInt(formData.get("is_visible")) ?? 1;
    const attributes  = JSON.parse(formData.get("attributes") || "[]");
    const variantCount = parseInt(formData.get("variant_count")) || 0;

    // Save new main images (if any new files uploaded)
    const imageFiles = formData.getAll("images");
    const newImageUrls = [];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const url = await saveFile(file);
        newImageUrls.push(url);
      }
    }

    // Determine image_url — use first new upload, or keep existing
    let image_url = formData.get("existing_image_url") || null;
    if (newImageUrls.length > 0) image_url = newImageUrls[0];

    await db.query(
      "UPDATE products SET name=?, description=?, price=?, image_url=?, category_id=?, stock=?, is_visible=? WHERE id=? AND seller_id=?",
      [name, description, price, image_url, category_id, stock, is_visible, id, session.user.id]
    );

    // Replace images if new ones were uploaded
    if (newImageUrls.length > 0) {
      await db.query("DELETE FROM product_images WHERE product_id = ?", [id]);
      await Promise.all(
        newImageUrls.map((url, i) =>
          db.query(
            "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
            [id, url, i]
          )
        )
      );
    }

    // Replace variants
    await db.query("DELETE FROM product_variants WHERE product_id = ?", [id]);
    for (let i = 0; i < variantCount; i++) {
      const label = formData.get(`variant_label_${i}`);
      const variantFile = formData.get(`variant_image_${i}`);
      let variantImageUrl = formData.get(`variant_existing_image_${i}`) || null;
      if (variantFile && variantFile.size > 0) {
        variantImageUrl = await saveFile(variantFile);
      }
      if (label) {
        await db.query(
          "INSERT INTO product_variants (product_id, label, image_url) VALUES (?, ?, ?)",
          [id, label, variantImageUrl]
        );
      }
    }

    // Replace attributes
    await db.query("DELETE FROM product_attributes WHERE product_id = ?", [id]);
    if (attributes.length > 0) {
      await Promise.all(
        attributes.map(({ attribute_definition_id, value }) => {
          if (!value) return;
          return db.query(
            "INSERT INTO product_attributes (product_id, attribute_definition_id, value) VALUES (?, ?, ?)",
            [id, attribute_definition_id, value]
          );
        })
      );
    }

    if (global.io) {
      global.io.emit("products:updated", {
        id, name, description, price, image_url,
        category_id, stock, is_visible,
      });
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

    await db.query("DELETE FROM product_attributes WHERE product_id = ?", [id]);
    await db.query("DELETE FROM product_images WHERE product_id = ?", [id]);
    await db.query("DELETE FROM product_variants WHERE product_id = ?", [id]);
    await db.query("DELETE FROM products WHERE id=? AND seller_id=?", [id, session.user.id]);

    if (global.io) {
      global.io.emit("products:deleted", { id });
    }

    return Response.json({ success: true });
  } catch (err) {
  console.error("❌ API Error:", err.message, err.stack);
  return Response.json({ error: err.message }, { status: 500 });
}
}