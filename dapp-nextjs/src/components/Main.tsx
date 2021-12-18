import React, {FC} from "react";
import {LogoWithTitle} from "./LogoWithTitle";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {HeroLeft} from "./HeroLeft";

export const Main: FC = ({}) => {

    return (
        <div className={"flex flex-col justify-center h-full px-2 md:px-12"}>
            <HeroLeft />
        </div>
    );

}