/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {clusterApiUrl, Connection, PublicKey, Transaction} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
// web3, Wallet as AnchorWallet
// import {BN} from "@project-serum/anchor";
// import {solbondProgram} from "../../programs/solbond";
import {AiOutlineArrowDown} from "react-icons/ai";
import InputFieldWithLogo from "../InputFieldWithLogo";
import CallToActionButton from "../CallToActionButton";
import React, {useEffect, useState} from "react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {IQPool, useQPoolUserTool} from "../../contexts/QPoolsProvider";
import {BN} from "@project-serum/anchor";
import {useLoad} from "../../contexts/LoadingContext";
import {MATH_DENOMINATOR, REDEEMABLES_DECIMALS} from "@qpools/sdk/lib/const";
import {sendAndConfirm} from "easy-spl/dist/util";
import {SEED} from "@qpools/sdk/lib/seeds";

export default function UnstakeForm() {

    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();
    const qPoolContext: IQPool = useQPoolUserTool();
    const loadContext = useLoad();

    const [valueInUsdc, setValueInUsdc] = useState<number>(0.0);
    const [valueInQPT, setValueInQpt] = useState<number>(0.0);

    // useEffect(() => {
    //     setValueInSol((_: number) => {
    //         // Get the exchange rate between QPT and USDC
    //         return valueInQPT * 1.;
    //     });
    // }, [valueInQPT]);

    useEffect(() => {
        qPoolContext.qPoolsStats?.calculateTVL().then(out => {

            // Calculate the conversion rate ...
            // Add this depending on decimals //
            let newValueBasedOnConversionRateUsdcPerQpt = out.tvl.mul(new BN(valueInQPT)).div(new BN(10**out.tvlDecimals)).div(new BN(out.totalQPT));
            setValueInUsdc((_: number) => {
                return newValueBasedOnConversionRateUsdcPerQpt.toNumber();
            });
        });
    }, [valueInQPT]);

    const submitToContract = async (d: any) => {

        console.log(JSON.stringify(d));

        // TODO: All decimals should be registered somewhere!
        const sendAmount: BN = new BN(valueInQPT).mul(new BN(10**REDEEMABLES_DECIMALS));
        console.log("send amount qpt is: ", sendAmount.toString());

        if (!qPoolContext.userAccount!.publicKey) {
            alert("Please connect your wallet first!");
            return
        }

        await loadContext.increaseCounter();

        // Initialize if not initialized yet
        await qPoolContext.initializeQPoolsUserTool(walletContext);
        await qPoolContext.qPoolsUser!.loadExistingQPTReserve(qPoolContext.currencyMint!.publicKey!);
        // Should not have to register any accounts!
        // Do some asserts if no QPT is found
        await qPoolContext.qPoolsUser!.registerAccount();

        // Generate the mint authority
        console.log("Creating Wallet");
        ///////////////////////////
        // Create an associated token account for the currency if it doesn't exist yet
        console.log("QPool context is: ", qPoolContext);
        console.log("Currency mint is: ", qPoolContext.currencyMint);

        // Now we redeem the QPT TOkens
        console.log("qPoolContext.qPoolsUser", qPoolContext.qPoolsUser);
        // Add a try-catch here (prob in the SDK)
        console.log("Before sendAmount is: ", sendAmount.toString());
        console.log("Before sendAmount is: ", sendAmount.toNumber());

        // Calculate TVL
        let out = await qPoolContext.qPoolsStats!.calculateTVL();

        let [tvlAccount, tvlAccountBump] = await PublicKey.findProgramAddress(
            [qPoolContext.qPoolsUser!.qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.TVL_INFO_ACCOUNT))],
            qPoolContext.qPoolsStats!.solbondProgram.programId
        );

        try {

            let tx = new Transaction();
            console.log("Updating TVL");
            let calculateTvlIx = await qPoolContext.qPoolsUser!.updateTvlInstruction(out.tvl.toNumber(), tvlAccountBump);
            console.log("Updating buyQPT");
            tx.add(calculateTvlIx);
            let redeemQPTIx = await qPoolContext.qPoolsUser!.redeemQPTInstruction(sendAmount.toNumber(), true);
            if (!redeemQPTIx) {
                console.log("Bad output..");
                throw Error("Something went wrong creating the buy QPT instruction");
            }
            tx.add(redeemQPTIx);
            console.log("Sending Transactions");

            // Add things like recent blockhash, and payer
            const blockhash = await qPoolContext.connection!.getRecentBlockhash();
            console.log("Added blockhash");
            tx.recentBlockhash = blockhash.blockhash;
            tx.feePayer = qPoolContext.qPoolsUser!.wallet.publicKey;
            await qPoolContext.qPoolsUser!.wallet.signTransaction(tx);
            await sendAndConfirm(qPoolContext.qPoolsUser!.connection, tx);

        } catch (error) {
            console.log("Error happened!");
            alert("Error took place, please show post this in the discord or on twitter: " + JSON.stringify(error));
        }

        await loadContext.decreaseCounter();
        console.log("Redeemed tokens! ", sendAmount.toString());

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
                                    logoPath={"/Light 2 Square.png"}
                                    displayText={"QPT"}
                                    registerFunction={() => register("qpt_amount")}
                                    modifiable={true}
                                    setNewValue={setValueInQpt}
                                />
                                <div className={"ml-5"}>
                                    <AiOutlineArrowDown size={24}/>
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/usdt.png"}
                                    displayText={"estimated USDT"}
                                    registerFunction={() => register("solana_amount")}
                                    modifiable={false}
                                    value={valueInUsdc}
                                />
                            </div>
                        </div>
                        {qPoolContext.qPoolsUser &&
                        <CallToActionButton
                            type={"submit"}
                            text={"REDEEM"}
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
