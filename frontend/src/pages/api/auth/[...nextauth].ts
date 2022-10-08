import NextAuth, { type NextAuthOptions } from "next-auth";
import TraktProvider from "next-auth/providers/trakt";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../server/db/client";
import { getWatchlist } from "../../../utils/trakt";

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    TraktProvider({
      clientId: process.env.TRAKT_ID || "",
      clientSecret: process.env.TRAKT_SECRET || "",
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  events: {
    async signIn(message) {
      // console.log({ message });
      console.log(`User signed in`);
      getWatchlist(message.account.providerAccountId);
    },
  },
};

export default NextAuth(authOptions);
