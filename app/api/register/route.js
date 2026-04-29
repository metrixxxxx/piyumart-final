import bcrypt from "bcrypt";
import { db } from "@/lib/db";

export async function POST(req) {
  const { name, email, password } = await req.json();

  // ✅ validate email domain
  if (!email.endsWith("@lspu.edu.ph")) {
    return Response.json(
      { message: "Only LSPU email allowed" },
      { status: 400 }
    );
  }

  // ✅ hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return Response.json({ message: "User created" });
  } catch (err) {
    return Response.json(
      { message: "Email already exists" },
      { status: 400 }
    );
  }
}