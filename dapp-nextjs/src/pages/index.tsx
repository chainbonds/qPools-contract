import type {NextPage} from "next";
import Head from "next/head";
import {HomeView} from "../views";
import Script from 'next/script';

const Home: NextPage = (props) => {
    return (
        <>
            <Head>
                <title>qPools | Passive Income - Stay Liquid | The most convenient way to generate passive income
                    without locking in liquidity. Built on #Solana</title>
                <meta
                    name="description"
                    content="qPools | Passive Income - Stay Liquid | The most convenient way to generate passive income without locking in liquidity. Built on #Solana"
                />
                {/*// <!-- Global site tag (gtag.js) - Google Analytics -->*/}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-P5225TV5V8"
                    strategy="afterInteractive"
                />
                <Script  id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
    
                        gtag('config', 'G-P5225TV5V8');
                    `}
                </Script>
            </Head>
            <div className={"h-screen w-screen bg-gray-800"}>
                <HomeView/>
            </div>
        </>
    );
};

export default Home;
