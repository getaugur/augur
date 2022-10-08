import type { GetServerSideProps } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import Navbar from "../components/navbar";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import MediaCard from "../components/media/media-card";

const Dashboard = () => {
  // const hello = trpc.example.hello.useQuery({ text: "from tRPC" });

  // const popular = trpc.gorse.popular.useQuery();
  const popular = trpc.media.popular.useQuery();

  // const { data, isLoading } = trpc.useQuery([
  //   "example.hello",
  //   { text: "from tRPC" },
  // ]);

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <div className="px-8 pt-8">
        <div className="prose">
          <h1>Popular</h1>
        </div>

        <div className="pt-8">
          <div className="carousel-center carousel rounded-box space-x-4 bg-neutral p-4">
            {popular.data?.map((item, i) => {
              return (
                <div key={i} className="carousel-item">
                  <MediaCard
                    title={item.Media?.title || item.traktSlug}
                    tags={[
                      item.mediaType.toLowerCase(),
                      ...(item.Media?.genres || []),
                    ]}
                    image="https://placeimg.com/400/225/arch"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};

export default Dashboard;
