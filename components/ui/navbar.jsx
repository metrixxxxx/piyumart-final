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
        <Link href="/my-orders" className="hover:text-blue-400">My Orders</Link>

        {session ? (
          <>
            <Link href="/sell" className="hover:text-blue-400">Sell</Link> {/* 👈 add this */}
            <span className="text-gray-400 text-sm">Hi, {session.user.name}!</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
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
