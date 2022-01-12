import React, {FC} from "react";
import {FaFly} from "react-icons/fa";
import {useWallet} from "@solana/wallet-adapter-react";
import {BN} from "@project-serum/anchor";
import {IQPool, useQPoolUserTool} from "../contexts/QPoolsProvider";
import airdropAdmin from "@qpools/sdk/lib/airdropAdmin";
import {createAssociatedTokenAccountSendUnsigned, MOCK} from "@qpools/sdk";
import {Connection, Transaction} from "@solana/web3.js";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";

export const TransparentButton: FC = ({}) => {

    // TODO Implement logic to airdrop some currency ...
    const walletContext: any = useWallet();
    const qPoolContext: IQPool = useQPoolUserTool();

    // Onclick, alert that the user must connect his wallet first!
    const airdropCurrency = async () => {
        console.log("Requesting airdrop...");

        // Let's airdrop 3 SOL to the user
        let _airdropAmount: number = 3;
        let airdropAmount: BN = new BN(_airdropAmount).mul(new BN(1e9));
        if (!qPoolContext.userAccount || !qPoolContext.userAccount!.publicKey) {
            alert("Please connect your wallet first!");
            return
        }

        await qPoolContext.initializeQPoolsUserTool(walletContext);
        await qPoolContext.qPoolsUser!.airdropTo(airdropAmount, qPoolContext.currencyMint!.publicKey!);

    };

    return (
        <>
            <button
                style={{ backgroundColor: "#1a202c" }}
                className="border border-gray-500 text-white font-bold py-3 px-7 rounded "
                onClick={() => airdropCurrency()}
            >
                <div className={"flex flex-row"}>
                    <div className={"py-auto my-auto pr-3"}>
                        <FaFly />
                    </div>
                    AIRDROP
                </div>
            </button>
        </>
    );
};
