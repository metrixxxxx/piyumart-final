"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">PIYUMART</h1>
      <div className="space-x-4 flex items-center">
        <Link href="/" className="hover:text-blue-400">Home</Link>
        <Link href="/cart" className="hover:text-blue-400">Cart</Link>

        {session ? (
          <>
            <span className="text-gray-400 text-sm">Hi, {session.user.name}!</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })} // 👈 logout then go to home
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:text-blue-400">Login</Link>
        )}
      </div>
    </nav>
  );
}