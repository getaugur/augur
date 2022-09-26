import { MeiliSearch } from "meilisearch";
import { UpdatedMediaData } from "./processDocuments";

export const client = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "MASTER_KEY",
});

const index = client.index("media");

export async function updateMeiliMedia(updatedMedia: UpdatedMediaData[]) {
  const response = await index.addDocuments(updatedMedia);
}
