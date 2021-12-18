import React, {FC} from "react";
import {LogoWithTitle} from "./LogoWithTitle";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import Statistics from "../../src/components/Statistics";

export const HeroLeft: FC = ({}) => {

    return (
        <>
            <div className={"px-1"}>
                {/*<h1 className='absolute'>TEST TEXT</h1>*/}
                {/*<h1 className='text-pink-500 transform translate-x-1 translate-y-1'>*/}
                {/*    TEST TEXT*/}
                {/*</h1>*/}
                <h1 className="absolute text-3xl lg:text-7xl font-bold red-text-shadow transform -translate-x-1 -translate-y-1">
                    {/*pink-500*/}
                    {/*Provide liquidity*/}
                    Passive Income
                    <br/>
                    Staying Liquid
                </h1>
                <h1 className="text-3xl lg:text-7xl font-bold text-pink-500 red-text-shadow">
                    {/*pink-500*/}
                    Passive Income
                    <br/>
                    Staying Liquid
                </h1>
            </div>
            <br />
            <div>
                <p className="mb-1 text-2xl text-gray-100 leading-10">
                    {/*Predictable and sustainable income streams while making sure you dimaond-hand your investment.*/}
                    {/*or USDC*/}
                    <div>
                        qPools generates passive yields, all while staying liquid.
                    </div>
                    <div>
                        Optimize for yield while adjusting for risk.
                    </div>
                    {/*<div>*/}
                    {/*    /!*You enjoy being able to spend your funds elsewhere.*!/*/}
                    {/*    /!*qPools is risk-adjusted in a highly volatile DeFi space.*!/*/}
                    {/*</div>*/}
                </p>
            </div>
            <div className={"mt-10"}>
                <Statistics />
            </div>
        </>
    );

}