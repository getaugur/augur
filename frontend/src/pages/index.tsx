import type { NextPage, NextPageContext } from "next";
import Head from "next/head";
import Image from "next/image";
import { trpc } from "../utils/trpc";
import LoginButton from "../components/login-button";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

const Home: NextPage = () => {
  const { data, isLoading } = trpc.useQuery([
    "example.hello",
    { text: "from tRPC" },
  ]);

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content flex-col lg:flex-row">
          <Image
            src="/augur-logo.png"
            className="max-w-sm rounded-lg shadow-2xl"
            alt="augur logo"
            width={256}
            height={256}
          />
          <div>
            <h1 className="text-5xl font-bold">Augur</h1>
            <p className="py-6">
              A volunteer-built recommendation solution to finding your next TV
              show and movie. Crowdsourced recommendations mixed with best in
              class AI provide highly relevent recommendations.
            </p>
            <button className="btn btn-primary" onClick={() => signIn("trakt")}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// export async function getServerSideProps(context: NextPageContext) {
//   const session = await unstable_getServerSession(
//     context.req,
//     context.res,
//     authOptions
//   );

//   if (!session) {
//     return {
//       redirect: {
//         destination: "/",
//         permanent: false,
//       },
//     };
//   }

//   return {
//     props: {
//       session,
//     },
//   };
// }

export default Home;
