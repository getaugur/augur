import ProfileLogin from "./profile-login";
import SearchBar from "./searchbar";
import Link from "next/link";

export default function Component() {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link href={"/"}>
          <a className="btn btn-ghost normal-case text-xl">Augur</a>
        </Link>
      </div>
      <div className="flex-none">
        <SearchBar />
        <ProfileLogin />
      </div>
    </div>
  );
}
