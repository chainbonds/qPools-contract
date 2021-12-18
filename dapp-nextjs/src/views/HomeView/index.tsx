import {FC} from "react";
import {useWallet} from "@solana/wallet-adapter-react";
import {Header} from "../../components/Header";
import {Footer} from "../../components/Footer";
import {Main} from "../../components/Main";

export const HomeView: FC = ({}) => {
    const {publicKey} = useWallet();

    const onClick = () => {};

    return (
        <div className={"bg-gray-800 h-full w-full space-y-between flex flex-col"}>
            <Header/>
            <Main/>
            <Footer/>
        </div>
    );
};