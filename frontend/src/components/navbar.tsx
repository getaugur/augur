import ProfileLogin from "./profile-login";
import SearchBar from "./searchbar";

export default function Component() {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">Augur</a>
      </div>
      <div className="flex-none">
        <SearchBar />
        <ProfileLogin />
      </div>
    </div>
  );
}
