import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("admin_session");

    if (!adminCookie) {
      return Response.json({ admin: null });
    }

    const admin = JSON.parse(adminCookie.value);
    return Response.json({ admin });
  } catch (err) {
    return Response.json({ admin: null });
  }
}