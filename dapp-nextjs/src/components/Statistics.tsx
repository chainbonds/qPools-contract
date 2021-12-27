
export default function Statistics(props: any) {

    const singleBox = (title: String, value: String) => {

        return (
            <div className={"m-5 md:mt-0 md:ml-0 rounded-lg border-2 border-gray-200 p-5 w-56 h-30"}>
                <h2 className="left-0 top-0 mb-1 text-xl text-gray-300">
                    {title}
                </h2>
                <br />
                <h2 className="left-0 bottom-0 mb-1 text-2xl">
                    {value}
                </h2>
            </div>
        )

    }

    return (
        <>
            <div className={"flex flex-col md:flex-row items-center md:items-begin"}>
                {singleBox("Total Value Locked", "$147.84M USD")}
                {singleBox("Total QTP Minted", "712.03 QTP")}
                {singleBox("7 Day APY", "8.02%")}
            </div>
        </>
    )

}