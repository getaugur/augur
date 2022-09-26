import { Gorse, Item } from "gorsejs";
import { UpdatedMediaData } from "./processDocuments";

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

export async function updateGorseMedia(updatedMedia: UpdatedMediaData[]) {
  const items: Item[] = [];

  for (let i = 0; i < updatedMedia.length; i++) {
    const media = updatedMedia[i];

    if (media === undefined) continue;

    items.push({
      ItemId: media.id,
      Comment: media.title,
      IsHidden: false,
      Timestamp: media.timestamp,
      Categories: media.categories,
      Labels: media.labels,
    });
  }

  gorseClient.upsertItems(items);

  console.log(`Added ${items.length} items to gorse`);
}
