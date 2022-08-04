import { MediaType } from "@prisma/client";
import { prisma } from "../server/db/client";
import { UpdatedMedia, updateGorseMedia, updateGorseUser } from "./gorse";
import got from "got";
import {
  TraktApiWatchedMovie,
  TraktApiWatchedMovieFull,
  TraktApiWatchedShow,
  TraktApiWatchedShowFull,
} from "./traktTypes";

export async function getWatchlist(id: string) {
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

  await updateGorseUser(id, "Trakt");
}

interface MediaSpecificItems {
  tagline: string | null;
  released: Date | null;
  firstAired: Date | null;
  airsDay: string | null;
  airsTime: string | null;
  airsTimezone: string | null;
  airedEpisodes: number | null;
  network: string | null;
}

/**
 * Checks if object is TraktApiWatchedMovie
 * @param obj
 * @returns
 */
export function isMovie(obj: any): obj is TraktApiWatchedMovie {
  return "movie" in obj;
}

export function isFullMovie(obj: any): obj is TraktApiWatchedMovieFull {
  return "tagline" in obj;
}

export async function processTraktMedia(
  mediaList: TraktApiWatchedMovie[] | TraktApiWatchedShow[],
  mediaType: MediaType
) {
  let count = 0;
  const updatedMedia: UpdatedMedia[] = [];

  for (let i = 0; i < mediaList.length; i++) {
    const rawMedia = mediaList[i];

    if (rawMedia === undefined) continue;

    // could use mediaType here but ts doesn't like that
    const mediaBase = isMovie(rawMedia) ? rawMedia.movie : rawMedia.show;
    const media = await fetchTraktMedia(mediaBase.ids.trakt, mediaType);

    // if (i === 0) console.log({ media });

    const stdData = {
      title: media.title,
      year: media.year,
      overview: media.overview,
      runtime: media.runtime,
      trailer: media.trailer,
      homepage: media.trailer,
      status: media.status,
      rating: media.rating,
      votes: media.votes,
      commentCount: media.comment_count,
      language: media.language,
      availableTranslations: media.available_translations,
      genres: media.genres,
      country: media.country,
      certification: media.certification,
    };

    const stdIds = {
      trakt: mediaBase.ids.trakt,
      tvdb: mediaBase.ids.tvdb,
      imdb: mediaBase.ids.imdb,
      tmdb: mediaBase.ids.tmdb,
      mediaType: mediaType,
    };

    const mediaSpecific: MediaSpecificItems = {
      tagline: null,
      released: null,
      firstAired: null,
      airsDay: null,
      airsTime: null,
      airsTimezone: null,
      airedEpisodes: null,
      network: null,
    };

    if (isFullMovie(media)) {
      mediaSpecific.tagline = media.tagline;
      mediaSpecific.released = new Date(media.released);
    } else {
      mediaSpecific.firstAired = new Date(media.first_aired);
      mediaSpecific.airedEpisodes = media.aired_episodes;
      mediaSpecific.network = media.network;
    }

    await prisma.media.upsert({
      where: {
        title_year: {
          title: media.title,
          year: media.year,
        },
      },
      create: {
        ...stdData,
        ...mediaSpecific,
        mediaIds: {
          connectOrCreate: {
            where: {
              trakt_mediaType: {
                trakt: media.ids.trakt,
                mediaType: mediaType,
              },
            },
            create: { ...stdIds },
          },
        },
      },
      update: {
        ...stdData,
        ...mediaSpecific,
        mediaIds: {
          update: {
            ...stdIds,
          },
        },
      },
    });

    updatedMedia.push({ title: mediaBase.title, year: mediaBase.year });
    count++;
  }

  console.log(`Added ${count} ${mediaType} to db`);

  updateGorseMedia(updatedMedia);
}

async function fetchTraktMedia(
  id: number,
  type: MediaType
): Promise<TraktApiWatchedMovieFull | TraktApiWatchedShowFull> {
  const media = await got.get(
    `https://api.trakt.tv/${type.toLowerCase()}s/${id}?extended=full`,
    {
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": process.env.TRAKT_ID || "",
      },
    }
  );

  const full = JSON.parse(media.body) as TraktApiWatchedMovieFull;

  return full;
}
