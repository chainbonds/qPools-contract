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

    const devnetBanner = () => {
        return (
            <>
                <div className={"flex w-full bg-pink-400"}>
                    <div className={"mx-auto py-2 text-gray-900"}>
                        We are on devnet! TVL Values are made up! Send any inquiries to contact@qpools.finance
                    </div>
                </div>
            </>
        )
    };

    return (
        <div
            className="h-screen h-full w-full w-screen flex text-white flex-col"
            style={{ backgroundColor: "#1a202c" }}
        >
            {devnetBanner()}
            <Header />
            <Main/>
            <Footer/>
        </div>
    );
};
