import got from "got";
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
          processTraktMovies(content as TraktApiWatchedMovie[]);
        else processTraktShows(content as TraktApiWatchedShow[]);
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

async function processTraktMovies(movies: TraktApiWatchedMovie[]) {
  let count = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    if (movie === undefined) continue;

    await prisma.media.upsert({
      where: {
        title_year: {
          title: movie.movie.title,
          year: movie.movie.year,
        },
      },
      create: {
        title: movie.movie.title,
        year: movie.movie.year,
        mediaIds: {
          connectOrCreate: {
            where: {
              trakt_mediaType: {
                trakt: movie.movie.ids.trakt,
                mediaType: "MOVIE",
              },
            },
            create: {
              trakt: movie.movie.ids.trakt,
              tvdb: movie.movie.ids.tvdb,
              imdb: movie.movie.ids.imdb,
              tmdb: movie.movie.ids.tmdb,
              mediaType: "MOVIE",
            },
          },
        },
      },
      update: {
        mediaIds: {
          update: {
            trakt: movie.movie.ids.trakt,
            tvdb: movie.movie.ids.tvdb,
            imdb: movie.movie.ids.imdb,
            tmdb: movie.movie.ids.tmdb,
            mediaType: "MOVIE",
          },
        },
      },
    });

    count++;
  }

  console.log(`Added ${count} movies`);
}

async function processTraktShows(shows: TraktApiWatchedShow[]) {
  let count = 0;

  for (let i = 0; i < shows.length; i++) {
    const show = shows[i];

    if (show === undefined) continue;

    await prisma.media.upsert({
      where: {
        title_year: {
          title: show.show.title,
          year: show.show.year,
        },
      },
      create: {
        title: show.show.title,
        year: show.show.year,
        mediaIds: {
          connectOrCreate: {
            where: {
              trakt_mediaType: {
                trakt: show.show.ids.trakt,
                mediaType: "SHOW",
              },
            },
            create: {
              trakt: show.show.ids.trakt,
              tvdb: show.show.ids.tvdb,
              imdb: show.show.ids.imdb,
              tmdb: show.show.ids.tmdb,
              mediaType: "SHOW",
            },
          },
        },
      },
      update: {
        mediaIds: {
          update: {
            trakt: show.show.ids.trakt,
            tvdb: show.show.ids.tvdb,
            imdb: show.show.ids.imdb,
            tmdb: show.show.ids.tmdb,
            mediaType: "SHOW",
          },
        },
      },
    });

    count++;
  }

  console.log(`Added ${count} shows`);
}
