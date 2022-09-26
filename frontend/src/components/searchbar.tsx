import { MeiliSearch, Hits } from "meilisearch";
import { useEffect, useMemo, useState } from "react";

export default function Component() {
  const [movies, setMovies] = useState<Hits<Record<string, any>>>([]);
  const [search, setSearch] = useState("");

  const client = useMemo(
    () =>
      new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: "MASTER_KEY",
      }),
    []
  );

  //   useEffect(() => {
  //     //search movie index based on search value
  //     client
  //       .index("media")
  //       .search(search, {
  //         limit: 5,
  //       })
  //       .then((results) => {
  //         setMovies(results.hits);
  //       });
  //   }, [client, search]);

  return (
    <div className="form-control">
      <input
        type="text"
        placeholder="Search"
        className="input input-bordered"
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
