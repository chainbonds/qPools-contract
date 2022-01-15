import React, {FC} from "react";
import {LogoWithTitle} from "./LogoWithTitle";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {AirdropButton} from "./AirdropButton";

export const Header: FC = ({}) => {

    return (
        <>
            <div
                id={"header-buy-bonds"}
                className="w-full left-0 top-0 py-6 px-6 lg:px-20 lg:py-12"
            >
                <div className="flex flex-col md:flex-row justify-center md:justify-between">
                    <div className={"mx-auto px-auto md:mx-0 md:px-0 md:my-auto md:py-auto"}>
                        <LogoWithTitle/>
                    </div>
                    <div className={"flex-1 px-2 mx-2"}>
                        {/*<span className="text-lg font-bold">Caw Caw</span>*/}
                    </div>
                    {/*TODO Implement Devnet show (and also faucet maybe)*/}
                    {/*<div>*/}
                    {/*    TransparentButton*/}
                    {/*</div>*/}
                    <div className={"flex my-auto py-auto mx-auto md:mx-0"}>
                        <div className={"flex flex-col md:flex-row"}>
                            <div className={"px-2 py-2 mx-auto md:py-0 md:py-auto md:my-auto"}>
                                <AirdropButton />
                            </div>
                            <WalletMultiButton
                                className={"btn btn-ghost"}
                                onClick={() => {
                                    console.log("click");
                                }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );

}