import React, {FC} from "react";
import {LogoWithTitle} from "./LogoWithTitle";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";

export const Header: FC = ({}) => {

    return (
        <>
            <div className="navbar pb-2 px-2 md:pr-12 md:pl-10 pt-6 text-neutral-content rounded-box">
                <div className="flex-none">
                    <LogoWithTitle />
                </div>
                <div className="flex-1 px-2 mx-2">
                    {/*<span className="text-lg font-bold">Caw Caw</span>*/}
                </div>
                <div className="flex-none">
                    <WalletMultiButton className="btn btn-ghost" />
                </div>
            </div>
        </>
    );

}