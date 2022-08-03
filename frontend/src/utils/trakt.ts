import { MediaType } from "@prisma/client";
import { prisma } from "../server/db/client";

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

export interface TraptApiContent {
  title: string;
  year: number;
  ids: TraktApiIds;
}

export interface TraktApiWatchedMovie extends TraktApiWatchedBase {
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

export interface TraktApiWatchedShow extends TraktApiWatchedBase {
  show: TraptApiContent;
  seasons?: TraktApiShowSeason[];
}

/**
 * Checks if object is TraktApiWatchedMovie
 * @param obj
 * @returns
 */
export function isMovie(obj: any): obj is TraktApiWatchedMovie {
  return "movie" in obj;
}

export async function processTraktMedia(
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
