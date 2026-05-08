"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

  const linkStyle = (path) =>
    `hover:text-blue-400 transition ${
      isActive(path) ? "text-blue-400 font-semibold" : "text-white"
    }`;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">PIYUMART</h1>

      <div className="flex items-center gap-4">
        <Link href="/" className={linkStyle("/")}>Home</Link>
        <Link href="/cart" className={linkStyle("/cart")}>Cart</Link>
        <Link href="/my-orders" className={linkStyle("/my-orders")}>My Orders</Link>

        {session && <NotificationBell />}

        {session ? (
          <div className="relative" ref={dropdownRef}>
            {/* Avatar button */}
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-300">{session.user.name}</span>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-50">
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>

                  <Link
                    href="/sell"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Sell a Product
                  </Link>

                  <Link
                    href="/my-listings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    My Listings
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-700 py-1">
                  <button
                    onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={linkStyle("/login")}>Login</Link>
        )}
      </div>
    </nav>
  );
}