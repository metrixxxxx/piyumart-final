"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path) =>
    pathname === path || pathname.startsWith(path + "/");

  const linkStyle = (path) =>
    `hover:text-blue-400 transition ${
      isActive(path) ? "text-blue-400 font-semibold" : "text-white"
    }`;

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">PIYUMART</h1>

      <div className="space-x-4 flex items-center">
        <Link href="/" className={linkStyle("/")}>Home</Link>
        <Link href="/cart" className={linkStyle("/cart")}>Cart</Link>
        <Link href="/my-orders" className={linkStyle("/my-orders")}>My Orders</Link>

        {session ? (
          <>
            <Link href="/sell" className={linkStyle("/sell")}>
              Sell
            </Link>

            <span className="text-gray-400 text-sm">
              Hi, {session.user.name}!
            </span>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className={linkStyle("/login")}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}