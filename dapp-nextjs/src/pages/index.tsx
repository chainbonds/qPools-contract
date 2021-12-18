import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div className={"h-screen w-screen"}>
      <Head>
        <title>qPools | Passive Income - Stay Liquid</title>
        <meta
          name="description"
          content="qPools | Passive Income - Stay Liquid"
        />
      </Head>
        <HomeView />
    </div>
  );
};

export default Home;
