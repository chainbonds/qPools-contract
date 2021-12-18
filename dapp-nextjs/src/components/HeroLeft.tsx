import React, {FC} from "react";
import Statistics from "../../src/components/Statistics";

export const HeroLeft: FC = ({}) => {

    return (
        <div className={"xl:ml-28"}>
            <div className={"px-1 md:mt-56 pt-8"}>
                <div>
                    <h1 className="absolute text-5xl lg:text-7xl font-bold red-text-shadow transform -translate-x-1 -translate-y-1">
                        Passive Income
                        <br/>
                        Staying Liquid
                    </h1>
                    <h1 className="text-5xl lg:text-7xl font-bold text-pink-500 red-text-shadow">
                        Passive Income
                        <br/>
                        Staying Liquid
                    </h1>
                </div>
            </div>
            <br />
            <div>
                <p className="mb-1 text-2xl text-gray-100 leading-10 text-center md:text-left">
                    <p>
                        qPools generates passive yields, all while staying liquid.
                    </p>
                    <p>
                        Optimize for yield while adjusting for risk.
                    </p>
                </p>
            </div>
            <div className={"pt-10"}>
                <Statistics />
            </div>
        </div>
    );

}