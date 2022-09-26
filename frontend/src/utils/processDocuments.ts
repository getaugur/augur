import { Media, MediaIds } from "@prisma/client";
import { prisma } from "../server/db/client";
import { updateGorseMedia } from "./gorse";

export type MediaWithIDs = Media & {
  mediaIds: MediaIds;
};

export interface UpdatedMedia {
  title: string;
  year: number;
}

export async function processDocuments(
  updatedMedia: UpdatedMedia[]
): Promise<void> {
  const items: MediaWithIDs[] = [];

  for (let i = 0; i < updatedMedia.length; i++) {
    const mediaObj = updatedMedia[i];

    if (mediaObj === undefined) continue;

    const media = await prisma.media.findUnique({
      where: {
        title_year: {
          title: mediaObj.title,
          year: mediaObj.year,
        },
      },
      include: {
        mediaIds: true,
      },
    });

    if (media !== undefined && media !== null) items.push(media);
  }

  updateGorseMedia(items);
}
