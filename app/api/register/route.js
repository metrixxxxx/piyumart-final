import bcrypt from "bcrypt";
import { db } from "@/lib/db";

export async function POST(req) {
  const { firstName, lastName, email, password, contactNumber, address } = await req.json();

  if (!email.endsWith("@lspu.edu.ph")) {
    return Response.json({ message: "Only LSPU email allowed" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.query(
      "INSERT INTO users (name, last_name, email, password, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, hashedPassword, contactNumber, address]
    );

    return Response.json({ message: "User created" });
  } catch (err) {
    return Response.json({ message: "Email already exists" }, { status: 400 });
  }
}