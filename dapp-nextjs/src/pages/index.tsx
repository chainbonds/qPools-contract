import type {NextPage} from "next";
import Head from "next/head";
import {HomeView} from "../views";

const Home: NextPage = (props) => {
    return (
        <>
            <Head>
                <title>qPools | Passive Income - Stay Liquid | The most convenient way to generate passive income without locking in liquidity. Built on #Solana</title>
                <meta
                    name="description"
                    content="qPools | Passive Income - Stay Liquid | The most convenient way to generate passive income without locking in liquidity. Built on #Solana"
                />
            </Head>
            <div className={"h-screen w-screen bg-gray-800"}>
                <HomeView/>
            </div>
        </>
    );
};

export default Home;
