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
        await qPoolContext.qPoolsUser!.loadExistingQPTReserve(qPoolContext.currencyMint!.publicKey!);
        await qPoolContext.qPoolsUser!.registerAccount();
        console.log(airdropAdmin);

        ///////////////////////////
        // Create an associated token account for the currency if it doesn't exist yet
        console.log("QPool context is: ", qPoolContext);
        console.log("Currency mint is: ", qPoolContext.currencyMint);
        // TODO: Might have to bundle this with the transaction below
        console.log("Inputs are: ");
        console.log({
            "1": qPoolContext.connection!,
            "2": qPoolContext.currencyMint!.publicKey,
            "3": qPoolContext.provider!.wallet.publicKey,
            "4": qPoolContext.provider!.wallet
        })
        const currencyMintUserAccount = await createAssociatedTokenAccountSendUnsigned(
            qPoolContext.connection!,
            qPoolContext.currencyMint!.publicKey,
            qPoolContext.provider!.wallet.publicKey,
            qPoolContext.provider!.wallet
        );
        console.log("Currency Mint User Account: ", currencyMintUserAccount.toString());

        // TODO:
        console.log("Working");
        let transaction = new Transaction();
        let mintToInstruction = Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            MOCK.SOL,
            currencyMintUserAccount,
            airdropAdmin.publicKey,
            [],
            airdropAmount.toNumber()
        )
        transaction.add(mintToInstruction);
        const blockhash = await qPoolContext.connection!.getRecentBlockhash();
        transaction.recentBlockhash = blockhash.blockhash;
        let connection: Connection = qPoolContext.connection!;
        const tx1 = await connection.sendTransaction(
            transaction,
            [airdropAdmin]
        );
        await connection.confirmTransaction(tx1);
        console.log("Should have received: ", airdropAmount.toNumber());
        console.log("Airdropped tokens! ", airdropAmount.toString());
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
