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
import {MATH_DENOMINATOR, MOCK} from "@qpools/sdk/src/const";
import {useLoad} from "../../contexts/LoadingContext";

export default function StakeForm() {

    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();
    const qPoolContext: IQPool = useQPoolUserTool();
    const loadContext = useLoad();

    const [valueInUsd, setValueInUsd] = useState<number>(0.0);
    const [valueInQPT, setValueInQpt] = useState<number>(0.0);

    const [balanceUsd, setBalanceUsd] = useState<number>(0.0);
    const [balanceQpt, setBalanceQpt] = useState<number>(0.0);

    useEffect(() => {
        qPoolContext.qPoolsStats?.fetchTVL().then(out => {

            if (out.tvl.gt(new BN(0))) {
                // Calculate the conversion rate ...
                let newValueBasedOnConversionRateQptPerUsd = new BN(out.totalQPT).mul(new BN(valueInUsd)).div(out.tvl);
                setValueInQpt((_: number) => {
                    return newValueBasedOnConversionRateQptPerUsd.toNumber();
                });
            } else {
                setValueInQpt(valueInUsd);
            }

        });
    }, [valueInUsd]);

    const submitToContract = async (d: any) => {

        console.log(JSON.stringify(d));

        // TODO: All decimals should be registered somewhere!
        const sendAmount: BN = new BN(valueInUsd).mul(new BN(10**MOCK.DEV.SABER_USDC_DECIMALS));
        console.log("send amount is: ", sendAmount.toString());

        if (!qPoolContext.userAccount!.publicKey) {
            alert("Please connect your wallet first!");
            return
        }

        await loadContext.increaseCounter();

        // Initialize if not initialized yet
        await qPoolContext.initializeQPoolsUserTool(walletContext);
        await qPoolContext.qPoolsUser!.loadExistingQPTReserve(qPoolContext.currencyMint!.publicKey!);
        await qPoolContext.qPoolsUser!.registerAccount();

        // TODO: Double check (1) existence of the token account and (2) balance
        await qPoolContext.initializeQPoolsUserTool(walletContext);
        await qPoolContext.qPoolsUser!.loadExistingQPTReserve(qPoolContext.currencyMint!.publicKey!);
        await qPoolContext.qPoolsUser!.registerAccount();
        console.log(airdropAdmin);

        ///////////////////////////
        // Create an associated token account for the currency if it doesn't exist yet
        console.log("QPool context is: ", qPoolContext);
        console.log("Currency mint is: ", qPoolContext.currencyMint);
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

        // TODO: Check the balance to be non-zero

        console.log("qPoolContext.qPoolsUser", qPoolContext.qPoolsUser);

        let success;
        try {
            success = await qPoolContext.qPoolsUser!.buyQPT(sendAmount.toNumber(), true);
        } catch (error) {
            console.log("Error happened!");
            alert("Error took place, please show post this in the discord or on twitter: " + JSON.stringify(error));
        }

        await loadContext.decreaseCounter();
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
                                <div className={"flex flex-row w-full justify-center"}>
                                    {/*<div className={"flex flew-row w-full px-8 text-gray-400 justify-center"}>*/}
                                    {/*    Balance: */}
                                    {/*</div>*/}
                                    {/*<div className={"flex flew-row w-full px-8 text-gray-400 justify-center"}>*/}
                                    {/*    Balance:*/}
                                    {/*</div>*/}
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/usdc.png"}
                                    displayText={"USDC"}
                                    registerFunction={() => register("solana_amount")}
                                    modifiable={true}
                                    setNewValue={setValueInUsd}
                                />
                                <div className={"ml-4"}>
                                    <AiOutlineArrowDown size={24}/>
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/Light 2 Square.png"}
                                    // QPT
                                    displayText={"estimated QPT"}
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
