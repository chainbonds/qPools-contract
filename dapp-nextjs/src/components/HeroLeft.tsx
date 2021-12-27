import React, {FC} from "react";
import Statistics from "../../src/components/Statistics";

export const HeroLeft: FC = ({}) => {

    return (
        <div className={"2xl:ml-40"}>
            {/*md:pt-0*/}
            {/*2xl:pt-44*/}
            <br />
            <div>
                <p className="pb-1 text-2xl text-gray-100 leading-10 text-center md:text-left">
                    <p>
                        The most convenient way to generate passive income
                    </p>
                    <p>
                        without locking in liquidity. Risk-adjusted for your favorite asset.
                    </p>
                </p>
            </div>
            <div className={"md:pt-10"}>
                <Statistics />
            </div>
        </div>
    );

}