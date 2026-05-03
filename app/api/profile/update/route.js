import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const contactNumber = formData.get("contactNumber");
  const address = formData.get("address");
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const imageFile = formData.get("image");

  const userId = session.user.id;

  try {
    // Handle profile picture upload
    let imagePath = null;
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });

      const filename = `avatar_${userId}_${Date.now()}${path.extname(imageFile.name)}`;
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      imagePath = `/uploads/avatars/${filename}`;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
      const user = rows[0];

      if (!user) {
        return Response.json({ message: "User not found" }, { status: 404 });
      }

      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return Response.json({ message: "Current password is incorrect" }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);
    }

    // Build update query dynamically
    const fields = ["name = ?", "last_name = ?", "contact_number = ?", "address = ?"];
    const values = [firstName, lastName, contactNumber, address];

    if (imagePath) {
      fields.push("image = ?");
      values.push(imagePath);
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return Response.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}