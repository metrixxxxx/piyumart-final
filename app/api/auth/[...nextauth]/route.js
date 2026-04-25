// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@/lib/db"; // your MySQL connection

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();

        // 1. Check domain
        if (!email.endsWith("@lspu.edu.ph")) {
          throw new Error("Only LSPU email allowed");
        }

        // 2. Find user in MySQL
        const [rows] = await db.query(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );

        if (rows.length === 0) return null; // user not found

        const user = rows[0];

        // 3. Compare password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 4. Return user
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub; // 👈 makes user.id available in session
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login", // your login page path
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };