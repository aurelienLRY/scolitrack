import { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/schemas/LoginSchema";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const validatedCredentials = await LoginSchema.validate(credentials);
        if (!validatedCredentials) return null;

        /* search user */
        const user = await prisma.user.findUnique({
          where: { email: validatedCredentials.email },
        });

        /* if user not found */
        if (!user || !user.password) return null;

        /* check password */
        const passwordsMatch = await bcrypt.compare(
          validatedCredentials.password,
          user.password as string
        );

        /* if password is incorrect */
        if (!passwordsMatch) return null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
