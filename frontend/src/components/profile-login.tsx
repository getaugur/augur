import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Component() {
  const { data: session } = useSession();
  if (session && session.user) {
    return (
      <>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <Image
                src={
                  typeof session.user.image === "string"
                    ? session.user.image
                    : "/augur-logo.png"
                }
                width={80}
                height={80}
                alt="Profile Image"
              />
            </div>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <button onClick={() => signOut()}>Logout</button>
            </li>
          </ul>
        </div>
      </>
    );
  }
  return (
    <>
      <button className="btn btn-ghost" onClick={() => signIn("trakt")}>
        Sign In
      </button>
    </>
  );
}
