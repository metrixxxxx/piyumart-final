// lib/admin.js
import { cookies } from "next/headers";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_session");
  
  if (!adminCookie) return null;
  
  const admin = JSON.parse(adminCookie.value);
  if (admin.role !== "admin") return null;
  
  return admin;
}