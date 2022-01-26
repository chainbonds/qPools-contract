import React, {FC} from "react";
import {FaFly} from "react-icons/fa";
import {useWallet} from "@solana/wallet-adapter-react";
import {BN} from "@project-serum/anchor";
import {IQPool, useQPoolUserTool} from "../contexts/QPoolsProvider";
import airdropAdmin from "@qpools/sdk/src/airdropAdmin";
import {Connection, Transaction} from "@solana/web3.js";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {useLoad} from "../contexts/LoadingContext";
import {createAssociatedTokenAccountSendUnsigned, getAssociatedTokenAddressOffCurve, MOCK} from "@qpools/sdk";

export const AirdropButton: FC = ({}) => {

    // TODO Implement logic to airdrop some currency ...
    const walletContext: any = useWallet();
    const qPoolContext: IQPool = useQPoolUserTool();
    const loadContext = useLoad();

    // Onclick, alert that the user must connect his wallet first!
    const airdropCurrency = async () => {
        console.log("Requesting airdrop...");

        // Let's airdrop 3 SOL to the user
        let _airdropAmount: number = 5;
        // TODO: USDC has 6 decimal items, gotta consider this!
        let airdropAmount: BN = new BN(_airdropAmount).mul(new BN(10 ** MOCK.DEV.SABER_USDC_DECIMALS));
        if (!qPoolContext.userAccount || !qPoolContext.userAccount!.publicKey) {
            alert("Please connect your wallet first!");
            return
        }

        await loadContext.increaseCounter();

        await qPoolContext.initializeQPoolsUserTool(walletContext);
        await qPoolContext.qPoolsUser!.loadExistingQPTReserve(qPoolContext.currencyMint!.publicKey!);
        await qPoolContext.qPoolsUser!.registerAccount();
        console.log(airdropAdmin);

        console.log("Currency mint is: ", qPoolContext.currencyMint!.publicKey.toString());

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

        const currencyAdminAccount = await createAssociatedTokenAccountSendUnsigned(
            qPoolContext.connection!,
            qPoolContext.currencyMint!.publicKey,
            airdropAdmin.publicKey,
            qPoolContext.provider!.wallet
        );
        // const currencyAdminAccount = await getAssociatedTokenAddressOffCurve(
        //     qPoolContext.currencyMint!.publicKey,
        //     airdropAdmin.publicKey
        // );
        console.log("Currency admin account is: ", currencyAdminAccount.toString());

        // TODO: Replace this with "transfer-to" instructions
        console.log("Working");
        let transaction = new Transaction();
        // let mintToInstruction = Token.createMintToInstruction(
        //     TOKEN_PROGRAM_ID,
        //     MOCK.DEV.SABER_USDC,
        //     currencyMintUserAccount,
        //     airdropAdmin.publicKey,
        //     [],
        //     airdropAmount.toNumber()
        // )
        console.log("All items: ",
            {
                "1": TOKEN_PROGRAM_ID.toString(),
                "2": currencyAdminAccount.toString(),
                "3": qPoolContext!.currencyMint!.publicKey.toString(),
                "4": currencyMintUserAccount.toString(),
                "5": airdropAdmin.publicKey.toString(),
                "6": [],
                "7": airdropAmount.toNumber(),
                "8": 6
            }
        )
        let transferToInstruction = Token.createTransferCheckedInstruction(
            TOKEN_PROGRAM_ID,
            currencyAdminAccount,
            qPoolContext!.currencyMint!.publicKey,
            currencyMintUserAccount,
            airdropAdmin.publicKey,
            [],
            airdropAmount.toNumber(),
            6
        );
        console.log("Created instruction");
        transaction.add(transferToInstruction);
        console.log("Added tx");
        const blockhash = await qPoolContext.connection!.getRecentBlockhash();
        console.log("Added blockhash");
        transaction.recentBlockhash = blockhash.blockhash;
        let connection: Connection = qPoolContext.connection!;
        console.log("Added connection");
        const tx1 = await connection.sendTransaction(
            transaction,
            [airdropAdmin]
        );
        console.log("Added transaction");
        await connection.confirmTransaction(tx1);
        console.log("Should have received: ", airdropAmount.toNumber());
        console.log("Airdropped tokens! ", airdropAmount.toString());

        await loadContext.decreaseCounter();
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
