import got from "got";
import NextAuth, { type NextAuthOptions } from "next-auth";
import TraktProvider from "next-auth/providers/trakt";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../server/db/client";
import {
  processTraktMedia,
  TraktApiWatchedMovie,
  TraktApiWatchedShow,
} from "../../../utils/trakt";

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    TraktProvider({
      clientId: process.env.TRAKT_ID || "",
      clientSecret: process.env.TRAKT_SECRET || "",
    }),
  ],
  events: {
    async signIn(message) {
      // console.log({ message });
      getWatchlist(message.account.providerAccountId);
    },
  },
};

export default NextAuth(authOptions);

async function getWatchlist(id: string) {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        providerAccountId: id,
        provider: "trakt",
      },
    },
  });

  const types = ["movies", "shows"];

  for (let i = 0; i < types.length; i++) {
    const type = types[i];

    got
      .get(`https://api.trakt.tv/users/${id}/watched/${type}`, {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": process.env.TRAKT_ID || "",
          Authorization: `Bearer ${account?.access_token}`,
        },
      })
      .then((data) => {
        const content = JSON.parse(data.body);

        // movie
        if (type === types[0])
          processTraktMedia(content as TraktApiWatchedMovie[], "MOVIE");
        else processTraktMedia(content as TraktApiWatchedShow[], "SHOW");
      });
  }
}
