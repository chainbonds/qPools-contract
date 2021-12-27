import React, {FC} from "react";
import {useWallet} from "@solana/wallet-adapter-react";
import {Header} from "../../components/Header";
import {Footer} from "../../components/Footer";
import {Main} from "../../components/Main";

export const HomeView: FC = ({}) => {
    const {publicKey} = useWallet();

    const onClick = () => {};

    return (
        <div className={"bg-gray-800 min-h-full w-full space-y-between flex flex-col mx-auto"}>
            <Header/>
            <Main/>
            <Footer/>
        </div>
    );
};
