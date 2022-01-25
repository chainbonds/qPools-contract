import {useEffect, useState} from "react";
import {IQPool, useQPoolUserTool} from "../contexts/QPoolsProvider";
import {delay} from "@qpools/sdk/lib/utils";

export default function Statistics(props: any) {

    // Just run a lop where you update TVL every couple times
    const qPoolContext: IQPool = useQPoolUserTool();
    const [tvl, setTvl] = useState<number>(0.);
    const [totalQPT, setTotalQPT] = useState<number>(0.);

    const initializeQPoolsAndCalculateTVL = async () => {
        console.log("Loaded qpoolsuser");
        await qPoolContext.initializeQPoolsStatsTool();
        await delay(5000);
    }

    useEffect(() => {
        initializeQPoolsAndCalculateTVL();
    }, []);

    const updateStatistics = () => {
        if (qPoolContext && qPoolContext.qPoolsStats) {

            // if (!qPoolContext.qPoolsStats) {
            //     throw Error("Something went wrong loading qPoolsStats!");
            // }

            if (qPoolContext.qPoolsStats) {

                qPoolContext.qPoolsStats.collectPriceFeed().then(() => {
                    qPoolContext.qPoolsStats!.fetchTVL().then(out => {
                        setTvl((_) => out.tvl.toNumber());
                        setTotalQPT((_) => out.totalQPT);
                    })
                });

            } else {
                console.log("Stats now loaded yet!", qPoolContext, qPoolContext.qPoolsStats)
            }

        }
    }

    useEffect(() => {
        updateStatistics();
        setInterval(() => {
            updateStatistics();
        }, 5000);

    }, [qPoolContext, qPoolContext.qPoolsStats])

    const singleBox = (title: String, value: String) => {

        return (
            <div className={"m-5 lg:mt-0 lg:ml-0 rounded-lg border-2 border-gray-200 p-5 w-56 h-30"}>
                <h2 className="justify-center text-center lg:left-0 lg:bottom-0 mb-1 text-lg lg:text-2xl">
                    {value}
                </h2>
                <br />
                <h2 className="justify-center text-center lg:left-0 lg:top-0 mb-1 text-lg lg:text-xl text-gray-300">
                    {title}
                </h2>
            </div>
        )

    }

    return (
        <>
            <div className={"flex flex-col md:flex-row items-center lg:items-begin"}>
                {singleBox("Total Value Locked", "$ " + String((tvl).toFixed(2) ) + " USD")}
                {singleBox("Total QPT Minted", String(totalQPT.toFixed(0)) + " QPT")}
                {singleBox("7 Day APY", "Coming Soon")}
                {/*8.02%*/}
            </div>
        </>
    )

}