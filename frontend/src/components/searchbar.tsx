import { MeiliSearch, Hits, SearchResponse } from "meilisearch";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function Component() {
  const [media, setMedia] = useState<SearchResponse<Record<string, any>>>();
  const [search, setSearch] = useState("");

  const client = useMemo(
    () =>
      new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: "MASTER_KEY",
      }),
    []
  );

  useEffect(() => {
    //search movie index based on search value
    client
      .index("media")
      .search(search, {
        limit: 5,
      })
      .then((results) => {
        setMedia(results);
      });
  }, [client, search]);

  return (
    <div className="dropdown dropdown-end">
      <div className="form-control">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52 mt-4"
      >
        {search.length > 0 &&
          media?.hits.map((value) => (
            <li key={value.id}>
              <Link href={`/${value.categories[0].toLowerCase()}/${value.id}`}>
                <a>{value.title}</a>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
