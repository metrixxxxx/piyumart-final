"use client";
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); // 👈 add this

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@lspu.edu.ph")) {
      setError("Use your LSPU email only");
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      // 👇 Get session to check role, then redirect accordingly
      const session = await getSession();
      if (session?.user?.role === "admin") {
        router.push("/admin/dashboard"); // admin goes to admin panel
      } else {
        router.push("/");               // everyone else goes to shop
      }
    }
  };

  return (
    <div className="bg-blue-100 min-h-screen flex items-center justify-center p-4 md:w-4xl border rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login to your account
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="yourname@lspu.edu.ph"
              className="w-full px-4 py-2 border-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          no account yet? {" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}