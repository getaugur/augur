import { authedProcedure, t } from "../trpc";
import { date, z } from "zod";
import { gorseClient } from "../../../utils/gorse";
import { prisma } from "../../db/client";
import { MediaIds, Media } from "@prisma/client";

export const mediaRouter = t.router({
  popular: authedProcedure.query(async () => {
    const [popularShows, popularMovies] = await Promise.all([
      gorseClient.getPopular({ category: "SHOW" }),
      gorseClient.getPopular({ category: "MOVIE" }),
    ]);

    const media: (MediaIds & {
      Media: Media | null;
    })[] = [];

    for (let i = 0; i < popularShows.length; i++) {
      const show = popularShows[i];
      if (show == undefined) continue;

      const result = await prisma.mediaIds.findUnique({
        where: {
          traktSlug_mediaType: {
            traktSlug: show.Id,
            mediaType: "SHOW",
          },
        },
        include: {
          Media: true,
        },
      });

      if (result) media.push(result);
    }

    for (let i = 0; i < popularMovies.length; i++) {
      const movie = popularMovies[i];
      if (movie == undefined) continue;

      const result = await prisma.mediaIds.findUnique({
        where: {
          traktSlug_mediaType: {
            traktSlug: movie.Id,
            mediaType: "MOVIE",
          },
        },
        include: {
          Media: true,
        },
      });

      if (result) media.push(result);
    }

    return media;
  }),
});
