import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      async authorize(credentials) {
        // check DB here
        if (
          credentials.email === "admin@test.com" &&
          credentials.password === "1234"
        ) {
          return { id: 1, name: "Admin" };
        }
        return null;
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };