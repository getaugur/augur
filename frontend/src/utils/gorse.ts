import { Gorse, Item } from "gorsejs";
import { Media } from "@prisma/client";
import { prisma } from "../server/db/client";
import { MediaWithIDs, UpdatedMedia } from "./processDocuments";

export const gorseClient = new Gorse({
  endpoint: process.env.GORSE_ENDPOINT || "",
  secret: process.env.GORSE_SECRET || "",
});

export async function updateGorseUser(userId: string, provider: string) {
  await gorseClient.insertUser({
    UserId: userId,
    Labels: ["user", "registered", provider],
    Comment: `${provider} user ${userId}`,
  });
}

export async function updateGorseMedia(updatedMedia: MediaWithIDs[]) {
  const items: Item[] = [];

  for (let i = 0; i < updatedMedia.length; i++) {
    const media = updatedMedia[i];

    if (media === undefined) continue;

    const labels = extractLabels(media);

    items.push({
      ItemId: `${media.title}-${media.year}`,
      Comment: media.title,
      IsHidden: false,
      Timestamp: new Date(media.firstAired || media.released || ""),
      Categories: [media.mediaIds.mediaType, ...media.genres],
      Labels: [...media.genres, ...labels, ...media.people],
    });
  }

  gorseClient.upsertItems(items);

  console.log(`Added ${items.length} items to gorse`);
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
