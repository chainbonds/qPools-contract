import React, {FC} from "react";
import {LogoWithTitle} from "./LogoWithTitle";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

export const Header: FC = ({}) => {

    return (
        <>
            <div
                id={"header-buy-bonds"}
                className="w-full left-0 top-0 py-6 px-6 lg:px-20 lg:py-12"
            >
                <div className="flex flex-row justify-between">
                    <div className={"my-auto py-auto"}>
                        <LogoWithTitle/>
                    </div>
                    <div className={"flex-1 px-2 mx-2"}>
                        {/*<span className="text-lg font-bold">Caw Caw</span>*/}
                    </div>
                    {/*TODO Implement Devnet show (and also faucet maybe)*/}
                    <div className={"my-auto py-auto"}>
                        <WalletMultiButton
                            className={"btn btn-ghost"}
                            onClick={() => {
                                console.log("click");
                            }}
                        />
                    </div>

                </div>
            </div>
        </>
    );

}