/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {AiOutlineArrowDown} from "react-icons/ai";
import InputFieldWithLogo from "../InputFieldWithLogo";
import CallToActionButton from "../CallToActionButton";
import {BN} from "@project-serum/anchor";
import React, {useEffect, useState} from "react";
import {IQPool, useQPoolUserTool} from "../../contexts/QPoolsProvider";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Mint} from "easy-spl";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import airdropAdmin from "@qpools/sdk/src/airdropAdmin";
import {createAssociatedTokenAccountSendUnsigned} from "@qpools/sdk/src/utils";
import {MOCK} from "@qpools/sdk/src/const";

export default function StakeForm() {

    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();
    const qPoolContext: IQPool = useQPoolUserTool();

    const [valueInSol, setValueInSol] = useState<number>(0.0);
    const [valueInQPT, setValueInQpt] = useState<number>(0.0);

    useEffect(() => {
        setValueInQpt((_: number) => {
            return valueInSol * 1.;
        });
    }, [valueInSol]);

    const submitToContract = async (d: any) => {

        console.log(JSON.stringify(d));

        // TODO: All decimals should be registered somewhere!
        const sendAmount: BN = new BN(valueInSol).mul(new BN(1e9));
        console.log("send amount is: ", sendAmount.toString());

        if (!qPoolContext.userAccount!.publicKey) {
            alert("Please connect your wallet first!");
            return
        }
        // Initialize if not initialized yet
        await qPoolContext.initializeQPoolsUserTool(walletContext);
        await qPoolContext.qPoolsUser!.loadExistingQPTReserve(qPoolContext.currencyMint!.publicKey!);
        await qPoolContext.qPoolsUser!.registerAccount();

        // ///////////////////////////
        // // Create an associated token account for the currency if it doesn't exist yet
        // console.log("QPool context is: ", qPoolContext);
        // console.log("Currency mint is: ", qPoolContext.currencyMint);
        // const currencyMintUserAccount = await createAssociatedTokenAccountSendUnsigned(
        //     qPoolContext.connection!,
        //     qPoolContext.currencyMint!.publicKey,
        //     qPoolContext.provider!.wallet.publicKey,
        //     qPoolContext.provider!.wallet
        // );
        // console.log("Currency Mint User Account: ", currencyMintUserAccount.toString());
        //
        // // TODO: Should delete this and turn this into the button
        // let transaction = new Transaction();
        // let mintToInstruction = Token.createMintToInstruction(
        //     TOKEN_PROGRAM_ID,
        //     MOCK.SOL,
        //     currencyMintUserAccount,
        //     airdropAdmin.publicKey,
        //     [],
        //     sendAmount.toNumber()
        // )
        // transaction.add(mintToInstruction);
        // const blockhash = await qPoolContext.connection!.getRecentBlockhash();
        // transaction.recentBlockhash = blockhash.blockhash;
        // let connection: Connection = qPoolContext.connection!;
        // const tx1 = await connection.sendTransaction(
        //     transaction,
        //     [airdropAdmin]
        // );
        // await connection.confirmTransaction(tx1);
        // console.log("Should have received: ", sendAmount.toNumber());

        console.log("qPoolContext.qPoolsUser", qPoolContext.qPoolsUser);
        const success = await qPoolContext.qPoolsUser!.buyQPT(sendAmount.toNumber(), true);
        if (!success) {
            console.log("Something went wrong! Check logs.");
        }

        console.log("Bought tokens! ", sendAmount.toString());
    }

    useEffect(() => {
        if (walletContext.publicKey) {
            console.log("Wallet pubkey wallet is:", walletContext.publicKey.toString());
            qPoolContext.initializeQPoolsUserTool(walletContext);
        }
        // initializeQPoolsUserTool
    }, [walletContext.publicKey]);

    return (
        <>
            <div className="">
                <div className="">
                    <form action="#" method="POST" onSubmit={handleSubmit(submitToContract)}>
                        <div className="py-5 bg-slate-800 bg-gray">
                            <div>
                                <InputFieldWithLogo
                                    logoPath={"/solana-logo.png"}
                                    displayText={"SOL"}
                                    registerFunction={() => register("solana_amount")}
                                    modifiable={true}
                                    setNewValue={setValueInSol}
                                />
                                <div className={"ml-4"}>
                                    <AiOutlineArrowDown size={24}/>
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/Light 2 Square.png"}
                                    // QPT
                                    displayText={"qSOL"}
                                    registerFunction={() => {}}
                                    modifiable={false}
                                    value={valueInQPT}
                                />
                            </div>
                        </div>
                        {qPoolContext.qPoolsUser &&
                            <CallToActionButton
                                type={"submit"}
                                text={"EARN"}
                            />
                        }
                        {!qPoolContext.qPoolsUser &&
                            <div className={"flex w-full justify-center"}>
                                <WalletMultiButton
                                    className={"btn btn-ghost"}
                                    onClick={() => {
                                        console.log("click");
                                    }}
                                />
                            </div>
                        }
                    </form>
                </div>
            </div>
        </>
    );
}
