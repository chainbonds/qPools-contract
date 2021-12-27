import React, {FC} from "react";
import {LogoWithTitle} from "./LogoWithTitle";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

export const Header: FC = ({}) => {

    return (
        <>
            <div
                id={"header-buy-bonds"}
                className="w-full left-0 top-0 py-6 px-6 md:px-14 md:py-12"
            >
                <div className="flex flex-row justify-between">
                    <div className={"my-auto py-auto"}>
                        <LogoWithTitle />
                    </div>
                    <div className={"flex-1 px-2 mx-2"}>
                        {/*<span className="text-lg font-bold">Caw Caw</span>*/}
                    </div>
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