import {useEffect, useState} from "react";
import {IQPool, useQPoolUserTool} from "../contexts/QPoolsProvider";

export default function Statistics(props: any) {

    // Just run a lop where you update TVL every couple times
    const qPoolContext: IQPool = useQPoolUserTool();
    const [tvl, setTvl] = useState<number>(0.);

    useEffect(() => {
        console.log("Loaded qpoolsuser");
        // Initialize the qpoolStats
        qPoolContext.initializeQPoolsStatsTool();

        // Do a periodic fetching of the data
        setInterval(() => {
            console.log("Should have loaded qpoolstats!", qPoolContext.qPoolsStats);
            if (
                qPoolContext.qPoolsStats &&
                qPoolContext.qPoolsStats!.currencyMint &&
                qPoolContext.qPoolsStats!.qPoolCurrencyAccount
            ) {
                qPoolContext.qPoolsStats!.calculateTVL().then(out => {
                    setTvl((_) => out.tvl);
                })
            } else {
                console.log("One of the three doesn't exist yet");
                console.log(qPoolContext.qPoolsStats);
                console.log(qPoolContext.qPoolsStats && qPoolContext.qPoolsStats.currencyMint);
                console.log(qPoolContext.qPoolsStats && qPoolContext.qPoolsStats.qPoolCurrencyAccount);
            }
        }, 2000);

    }, []);


    // useEffect(() => {
    //     // let tvl = qPoolContext.qPoolsStats?.calculateTVL();
    //     // console.log("TVL is: ", tvl);
    //     if (
    //         qPoolContext.qPoolsStats &&
    //         qPoolContext.qPoolsStats!.currencyMint &&
    //         qPoolContext.qPoolsStats!.qPoolCurrencyAccount
    //     ) {
    //         qPoolContext.initializeQPoolsStatsTool().then(() => {
    //             qPoolContext.qPoolsStats!.calculateTVL().then(_tvl => {
    //                 setTvl((_) => _tvl);
    //             })
    //         })
    //     }
    // }, [qPoolContext.qPoolsStats, qPoolContext.qPoolsStats?.currencyMint])

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
                {singleBox("Total Value Locked", "$" + String((tvl / 1000).toFixed(3) ) + "M USD")}
                {singleBox("Total QTP Minted", "712.03 QTP")}
                {singleBox("7 Day APY", "8.02%")}
            </div>
        </>
    )

}