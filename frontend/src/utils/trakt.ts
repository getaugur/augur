import { MediaType } from "@prisma/client";
import { prisma } from "../server/db/client";
import { UpdatedMedia, updateGorseMedia, updateGorseUser } from "./gorse";
import got from "got";
import {
  Trakt,
  WatchedShow,
  WatchedMovie,
  ShowSummary_Full,
  MovieSummary_Full,
  MoviePeople,
  ShowPeople,
  ShowCrewMember,
  MovieCrewMember,
  MovieCrew,
  ShowCrew,
} from "better-trakt";

const traktClient = new Trakt({
  cliendId: process.env.TRAKT_ID || "",
  clientSecret: process.env.TRAKT_SECRET || "",
});

export async function getWatchlist(id: string) {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        providerAccountId: id,
        provider: "trakt",
      },
    },
  });

  const watchedMovies = await traktClient.users.watched.movies(
    id,
    account?.access_token || undefined
  );
  processTraktMovie(watchedMovies);

  const watchedShows = await traktClient.users.watched.shows(
    id,
    account?.access_token || undefined
  );
  processTraktShow(watchedShows);

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
export function isMovie(obj: any): obj is WatchedMovie {
  return "movie" in obj;
}

async function extractStdData(
  media: ShowSummary_Full | MovieSummary_Full,
  mediaType: MediaType
) {
  const people = await processTraktMediaPeople(
    mediaType === "MOVIE"
      ? await traktClient.movies.people(media.ids.slug)
      : await traktClient.shows.people(media.ids.slug)
  );

  return {
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
    people: people,
  };
}

function extractStdIds(
  media: ShowSummary_Full | MovieSummary_Full,
  mediaType: MediaType
) {
  return {
    trakt: media.ids.trakt,
    traktSlug: media.ids.slug,
    tvdb: media.ids.tvdb,
    imdb: media.ids.imdb,
    tmdb: media.ids.tmdb,
    mediaType: mediaType,
  };
}

async function saveMedia(
  media: ShowSummary_Full | MovieSummary_Full,
  mediaType: MediaType,
  mediaSpecific: MediaSpecificItems
) {
  const stdData = await extractStdData(media, mediaType);

  const stdIds = extractStdIds(media, mediaType);

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
}

export async function processTraktShow(mediaList: WatchedShow[]) {
  let count = 0;
  const updatedMedia: UpdatedMedia[] = [];
  const mediaType = "SHOW";

  for (let i = 0; i < mediaList.length; i++) {
    const rawMedia = mediaList[i];

    if (rawMedia === undefined) continue;

    // could use mediaType here but ts doesn't like that
    const mediaBase = rawMedia.show;
    const media = await traktClient.shows.summary(mediaBase.ids.slug);

    // if (i === 0) console.log({ media });

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

    // because its a show
    mediaSpecific.firstAired = new Date(media.first_aired);
    mediaSpecific.airedEpisodes = media.aired_episodes;
    mediaSpecific.network = media.network;

    await saveMedia(media, mediaType, mediaSpecific);

    updatedMedia.push({ title: mediaBase.title, year: mediaBase.year });
    count++;
  }

  console.log(`Added ${count} ${mediaType} to db`);

  updateGorseMedia(updatedMedia);
}

export async function processTraktMovie(mediaList: WatchedMovie[]) {
  let count = 0;
  const updatedMedia: UpdatedMedia[] = [];
  const mediaType = "MOVIE";

  for (let i = 0; i < mediaList.length; i++) {
    const rawMedia = mediaList[i];

    if (rawMedia === undefined) continue;

    // could use mediaType here but ts doesn't like that
    const mediaBase = rawMedia.movie;
    const media = await traktClient.movies.summary(mediaBase.ids.slug);

    // if (i === 0) console.log({ media });

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

    // its a movie
    mediaSpecific.tagline = media.tagline;
    mediaSpecific.released = new Date(media.released);

    await saveMedia(media, mediaType, mediaSpecific);

    updatedMedia.push({ title: mediaBase.title, year: mediaBase.year });
    count++;
  }

  console.log(`Added ${count} ${mediaType} to db`);

  updateGorseMedia(updatedMedia);
}

export function isShowCrew(obj: MovieCrew | ShowCrew): obj is ShowCrew {
  return "created by" in obj;
}

function processTraktMediaPeople(people: MoviePeople | ShowPeople): string[] {
  const processedPeople: string[] = [];

  function existsThenProcess(
    job: ShowCrewMember[] | MovieCrewMember[] | undefined
  ) {
    if (job !== undefined)
      job.forEach((person) => {
        processedPeople.push(person.person.name);
      });
  }

  if (people?.cast !== undefined) {
    people.cast.forEach((person) => {
      processedPeople.push(person.person.name);
    });
  }

  if (people?.crew !== undefined) {
    existsThenProcess(people.crew?.art);
    existsThenProcess(people.crew?.production);
    existsThenProcess(people.crew?.sound);
    existsThenProcess(people.crew?.["visual effects"]);
    existsThenProcess(people.crew?.["costume & make-up"]);
    existsThenProcess(people.crew?.writing);
    existsThenProcess(people.crew?.directing);
    existsThenProcess(people.crew?.lighting);
    existsThenProcess(people.crew?.editing);

    if (isShowCrew(people.crew)) existsThenProcess(people.crew["created by"]);
  }

  return processedPeople;
}
