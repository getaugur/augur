import got from "got";
import NextAuth, { type NextAuthOptions } from "next-auth";
import TraktProvider from "next-auth/providers/trakt";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../server/db/client";
import { MediaType } from "@prisma/client";

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

interface TraktApiWatchedBase {
  plays: number;
  last_watched_at: string;
  last_updated_at: string;
}

interface TraktApiIds {
  trakt: number;
  slug: string;
  imdb?: string;
  tmdb?: number;
  tvdb?: number;
}

interface TraptApiContent {
  title: string;
  year: number;
  ids: TraktApiIds;
}

interface TraktApiWatchedMovie extends TraktApiWatchedBase {
  movie: TraptApiContent;
}

interface TraktApiShowEpisode {
  number: number;
  plays: number;
  last_watched_at: string;
}
interface TraktApiShowSeason {
  number: number;
  episodes: TraktApiShowEpisode[];
}

interface TraktApiWatchedShow extends TraktApiWatchedBase {
  show: TraptApiContent;
  seasons?: TraktApiShowSeason[];
}

/**
 * Checks if object is TraktApiWatchedMovie
 * @param obj
 * @returns
 */
function isMovie(obj: any): obj is TraktApiWatchedMovie {
  return "movie" in obj;
}

async function processTraktMedia(
  mediaList: TraktApiWatchedMovie[] | TraktApiWatchedShow[],
  mediaType: MediaType
) {
  let count = 0;

  for (let i = 0; i < mediaList.length; i++) {
    const media = mediaList[i];

    if (media === undefined) continue;

    // could use mediaType here but ts doesn't like that
    const mediaBase = isMovie(media) ? media.movie : media.show;

    await prisma.media.upsert({
      where: {
        title_year: {
          title: mediaBase.title,
          year: mediaBase.year,
        },
      },
      create: {
        title: mediaBase.title,
        year: mediaBase.year,
        mediaIds: {
          connectOrCreate: {
            where: {
              trakt_mediaType: {
                trakt: mediaBase.ids.trakt,
                mediaType: mediaType,
              },
            },
            create: {
              trakt: mediaBase.ids.trakt,
              tvdb: mediaBase.ids.tvdb,
              imdb: mediaBase.ids.imdb,
              tmdb: mediaBase.ids.tmdb,
              mediaType: mediaType,
            },
          },
        },
      },
      update: {
        mediaIds: {
          update: {
            trakt: mediaBase.ids.trakt,
            tvdb: mediaBase.ids.tvdb,
            imdb: mediaBase.ids.imdb,
            tmdb: mediaBase.ids.tmdb,
            mediaType: mediaType,
          },
        },
      },
    });

    count++;
  }

  console.log(`Added ${count} ${mediaType}`);
}
