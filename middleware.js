import { NextResponse } from "next/server";

export function middleware(req) {
  const adminSession = req.cookies.get("admin_session");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isAdminRoute && !adminSession) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};