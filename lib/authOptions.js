import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

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

        if (!email.endsWith("@lspu.edu.ph")) {
          throw new Error("Only LSPU email allowed");
        }

        const [rows] = await db.query(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );

        if (rows.length === 0) return null;

        const user = rows[0];

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // ✅ Added role here
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // 👈 add this
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role; // 👈 add this
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role; // 👈 add this
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};