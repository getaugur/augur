import { Media, MediaIds } from "@prisma/client";
import { prisma } from "../server/db/client";
import { updateGorseMedia } from "./gorse";
import { updateMeiliMedia } from "./meili";

export interface UpdatedMediaData {
  id: string;
  title: string;
  timestamp: Date;
  categories: string[];
  labels: string[];
}

export interface UpdatedMedia {
  title: string;
  year: number;
}

export async function processDocuments(
  updatedMedia: UpdatedMedia[],
  username?: string
): Promise<void> {
  const items: UpdatedMediaData[] = [];

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

    if (media === undefined || media === null) continue;

    items.push({
      id: media.mediaIds.traktSlug,
      title: media.title,
      timestamp: new Date(media.firstAired || media.released || ""),
      categories: [media.mediaIds.mediaType, ...media.genres],
      labels: [...media.genres, ...extractLabels(media), ...media.people],
    });
  }

  updateGorseMedia(items, username);
  updateMeiliMedia(items);
}

export function extractLabels(media: Media): string[] {
  const labels: string[] = [];

  // media.availableTranslations.forEach((item) => {
  //   labels.push(`Translation: ${item}`);
  // });

  if (media.certification !== null)
    labels.push(`Certification: ${media.certification}`);

  if (media.country !== null) labels.push(`Country: ${media.country}`);

  labels.push(`Language: ${media.language}`);

  if (media.network !== null) labels.push(`Network: ${media.network}`);

  labels.push(`Rating: ${media.rating.toFixed(2)}`);

  labels.push(`Status: ${media.status}`);

  if (media.trailer !== null) labels.push("Trailer");

  labels.push(`Year: ${media.year}`);

  if (media.firstAired !== null || media.released !== null)
    labels.push("Released");

  return labels;
}
