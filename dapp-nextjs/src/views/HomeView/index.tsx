import React, {FC} from "react";
import {useWallet} from "@solana/wallet-adapter-react";
import {Header} from "../../components/Header";
import {Footer} from "../../components/Footer";
import {Main} from "../../components/Main";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {LogoWithTitle} from "../../components/LogoWithTitle";
import {SocialIcon} from "react-social-icons";

export const HomeView: FC = ({}) => {
    const {publicKey} = useWallet();

    const onClick = () => {};

    return (
        <div
            className="h-screen h-full w-full w-screen flex text-white flex-col"
            style={{ backgroundColor: "#1a202c" }}
        >
            <Header />
            <Main/>
            {/*<div*/}
            {/*    id="content"*/}
            {/*    className="flex flex-col md:flex-row w-full grow my-auto"*/}
            {/*> </div>*/}
            <Footer/>
        </div>
    );
};
