import NextAuth, { type NextAuthOptions } from "next-auth";
import TraktProvider from "next-auth/providers/trakt";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../server/db/client";

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    TraktProvider({
      clientId: process.env.TRAKT_ID || "",
      clientSecret: process.env.TRAKT_SECRET || "",
    }),
  ],
};

export default NextAuth(authOptions);
