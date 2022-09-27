import { Feedback, Gorse, Item } from "gorsejs";
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

export async function updateGorseMedia(
  updatedMedia: UpdatedMediaData[],
  username?: string
) {
  const items: Item[] = [];
  const feedback: Feedback<string>[] = [];

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

    if (username !== undefined) {
      feedback.push({
        FeedbackType: "watched",
        ItemId: media.id,
        UserId: username,
        Timestamp: new Date(),
      });
    }
  }

  gorseClient.upsertItems(items);
  gorseClient.upsertFeedbacks(feedback);

  console.log(`Added ${items.length} items to gorse`);
}
