import React, {FC} from "react";
import {HeroLeft} from "./HeroLeft";
import HeroForm from "./HeroForm";
import Statistics from "./Statistics";

export const Main: FC = ({}) => {

    const title = () => {
        return (
            <div
                id="slogan-wrapper"
                className="w-full h-full flex"
                style={{ backgroundColor: "#1a202c" }}
            >
                <div className={"relative text-center lg:text-left mx-auto lg:mx-0"}>
                    <h1 className="absolute text-4xl lg:text-7xl font-bold transform -translate-x-1 -translate-y-1">
                        Generate Yields
                        <br/>
                        Stay Liquid
                    </h1>
                    <h1 className="text-4xl lg:text-7xl font-bold text-pink-500">
                        Generate Yields
                        <br/>
                        Stay Liquid
                    </h1>
                </div>
            </div>
        )
    }

    return (
        <div
            id="content"
            className={"w-full flex flex-col grow my-auto px-6 lg:px-24"}
            style={{ backgroundColor: "#1a202c" }}
        >
            {/*flex-none*/}
            <div className={"flex flex-row"}>
                {title()}
            </div>
            {/*className={"flex flex-col md:flex-row   "}*/}
            <div className={"flex flex-col lg:flex-row grow w-full justify-center lg:justify-start my-auto"}>
                {/*className={"flex grow my-auto"}*/}

                <div className={"flex flex-col"}>

                    <div className="pt-8 pb-1 text-2xl text-gray-100 leading-10 text-center lg:text-left">
                        <p>
                            The most convenient way to generate passive income
                        </p>
                        <p>
                            without locking in liquidity. Risk-adjusted for your favorite asset.
                        </p>
                    </div>
                    <div className={"py-8 mx-0 md:mx-auto"}>
                        <Statistics />
                    </div>

                </div>
                {/*<div className={"flex grow"}>*/}
                {/*    <div className={"py-2 grow w-24"}/>*/}
                {/*</div>*/}
                {/*/!*flex grow*!/*/}
                {/*flex-none*/}
                <div className={"my-auto"}>
                    <HeroForm />
                </div>
            </div>
        </div>
    );

}