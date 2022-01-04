/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {Cluster, clusterApiUrl, Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
// web3, Wallet as AnchorWallet
// import {BN} from "@project-serum/anchor";
// import {solbondProgram} from "../../programs/solbond";
// import {getTokenList} from "../../const";
import {AiOutlineArrowDown} from "react-icons/ai";
import Image from "next/image";
import InputFieldWithLogo from "../InputFieldWithLogo";
import CallToActionButton from "../CallToActionButton";
import {BN, Provider, web3} from "@project-serum/anchor";
import {WalletI} from "../../qpools-sdk/splpasta/types";
import React, {useEffect, useState} from "react";
import {IQPool, useQPoolUserTool} from "../../contexts/QPoolsProvider";
import {Token} from "@solana/spl-token";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Mint, Wallet} from "../../qpools-sdk/splpasta";
import {mintToTx} from "../../qpools-sdk/splpasta/tx/mint";
import {NodeWallet} from "@project-serum/anchor/src/provider";
import {createAssociatedTokenAccountSendUnsigned} from "../../qpools-sdk/splpasta/tx/associated-token-account";
import {tou64} from "@invariant-labs/sdk";
import * as util from "../../qpools-sdk/splpasta/util";

export default function StakeForm() {

    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();
    const qPoolContext: IQPool = useQPoolUserTool();

    const [valueInSol, setValueInSol] = useState<number>(0.0);
    const [valueInQPT, setValueInQpt] = useState<number>(0.0);

    // useEffect(() => {
    //
    //     // User should connect wallet first ...
    //
    //
    // }, []);

    useEffect(() => {
        setValueInQpt((_: number) => {
            return valueInSol * 1.;
        });
    }, [valueInSol]);

    const submitToContract = async (d: any) => {

        // TODO: Implement RPC Call
        console.log(JSON.stringify(d));

        const sendAmount: BN = new BN(d["amount"]);
        console.log("send amount is: ", sendAmount.toString());
        console.log("Will implement this stuff");

        if (!qPoolContext.userAccount.publicKey) {
            alert("Please connect your wallet first!");
            return
        }
        // Initialize if not initialized yet
        await qPoolContext.initializeQPoolsUserTool(walletContext);
        // Register accounts for this user then
        // Do some airdrop first I guess
        // there sohuld be a button or wallet that we can request an airdrop from ...

        // Generate the mint authority
        console.log("Creating WalletI");
        // const uintarray: Uint8Array = Uint8Array.from([
        //     149,226,18,86,166,52,2,141,172,220,209,227,65,254,79,35,131,85,164,23,25,8,248,223,90,167,172,144,133,236,229,146,188,230,180,3,5,118,190,238,157,122,51,60,83,186,124,199,151,67,175,226,211,199,1,115,177,75,72,51,82,16,255,4
        // ])
        // TODO: Just request an airdrop for now,
        // Add a button to do so
        // Assume we only provide qSOL for now

        // const uintarray: Uint8Array = Buffer.from([
        //     149,226,18,86,166,52,2,141,172,220,209,227,65,254,79,35,131,85,164,23,25,8,248,223,90,167,172,144,133,236,229,146,188,230,180,3,5,118,190,238,157,122,51,60,83,186,124,199,151,67,175,226,211,199,1,115,177,75,72,51,82,16,255,4
        // ])
        // console.log("Uintarray is: ", uintarray);
        // const mintAuthorityKeypair: Keypair = Keypair.fromSecretKey(uintarray);

        // // const mint = new Mint(qPoolContext.connection, mintAuthorityKeypair.publicKey);
        // const tx = await mintToTx(
        //     qPoolContext.connection,
        //     mintAuthorityKeypair.publicKey,
        //     walletContext.userAccount,
        //     mintAuthorityKeypair.publicKey,
        //     sendAmount.toNumber()
        // );
        // console.log("tx is: ", tx);
        // const signature = await web3.sendAndConfirmTransaction(
        //     qPoolContext.connection,
        //     tx,
        //     [mintAuthorityKeypair],
        // );
        // console.log('SIGNATURE', signature);
        // await mintAuthorityKeypair.signTransaction(tx)

        // const wallet: NodeWallet = new NodeWallet(mintAuthorityKeypair);
        // const mintWallet: WalletI = new anchor.Wallet(mintAuthorityKeypair);
        // console.log("MintWallet are: ", mintWallet.publicKey.toString());
        //
        // console.log("Provider and wallet are: ");
        // console.log(qPoolContext.provider);
        // console.log(qPoolContext.provider.wallet);
        //
        // console.log("Generating mint");
        // const currencyMint: Token = new Token(
        //     qPoolContext.connection,
        //     new PublicKey("So11111111111111111111111111111111111111112"), // mintWallet.publicKey,
        //     qPoolContext._solbondProgram.programId,
        //     qPoolContext.provider.wallet as Signer
        // );
        const currencyMint: Mint = new Mint(
            qPoolContext.connection,
            new PublicKey("So11111111111111111111111111111111111111112")
        );
        // const mint = new Mint(qPoolContext.connection, mintWallet.publicKey);
        console.log("Airdropping some tokens to the user ...");
        // mint.mintTo();

        // Wrap SOL in this currency Mint

        // Create an associated token account if it is not there yet!
        console.log("Public key is: ", qPoolContext.provider.wallet.publicKey);
        console.log("Public key is: ", qPoolContext.provider.wallet.publicKey.toString());

        // const currencyMintUserAccount = await createAssociatedTokenAccountSendUnsigned(
        //     qPoolContext.connection,
        //     currencyMint.key,
        //     qPoolContext.provider.wallet.publicKey,
        //     qPoolContext.provider.wallet
        // );
        // const currencyMintUserAccount = await currencyMint.createAssociatedTokenAccount(qPoolContext.provider.wallet.publicKey);
        // console.log("Currency mint user account is: ", currencyMintUserAccount.toString());
        // const tx = await mintToTx(
        //     qPoolContext.connection,
        //     currencyMint.key,
        //     qPoolContext.provider.wallet.publicKey,
        //     mintAuthorityKeypair.publicKey,
        //     sendAmount.toNumber()
        // );
        // const txSigner = await mintWallet.signTransaction(tx);
        // await util.sendAndConfirm(qPoolContext.connection, txSigner);

        // const tx = await currencyMint.mintTo(
        //     currencyMintUserAccount,
        //     mintAuthorityKeypair.publicKey,
        //     [mintAuthorityKeypair as Signer],
        //     sendAmount
        // );

        // Should probably print the amount of tokens
        const response = await qPoolContext.qPoolsUser.buyQPT(sendAmount.toNumber());
        if (!response) {
            alert("Not enough balance!");
        }

        // Assert that there is some wallet registered
        // Modify button accordingly (in a context state or so)

        // console.log("Phantom user account is: ", userAccount.publicKey.toString());

        // Calculate the conversation ratio
        // Assume a simple multiplication with a constant (market rate)
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
                                <div className={"ml-5"}>
                                    <AiOutlineArrowDown size={24}/>
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/Light 2 Square.png"}
                                    displayText={"QPT"}
                                    registerFunction={() => register("qpt_amount")}
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
