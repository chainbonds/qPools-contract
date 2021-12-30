/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {Cluster, clusterApiUrl, Connection, Keypair} from "@solana/web3.js";
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
import {WalletI} from "../../splpasta/types";
import React, {useEffect, useState} from "react";
import {IQPool, useQPoolUserTool} from "../../contexts/QPoolsProvider";
import {Token} from "@solana/spl-token";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Mint, Wallet} from "../../qpools-sdk/splpasta";
import NodeWallet from "@project-serum/anchor/src/nodewallet";
import {mintToTx} from "../../qpools-sdk/splpasta/tx/mint";

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
        qPoolContext.initializeQPoolsUserTool(walletContext);
        // Register accounts for this user then
        // Do some airdrop first I guess
        // there sohuld be a button or wallet that we can request an airdrop from ...

        // Generate the mint authority
        console.log("Creating WalletI");
        // const uintarray: Uint8Array = Uint8Array.from([
        //     149,226,18,86,166,52,2,141,172,220,209,227,65,254,79,35,131,85,164,23,25,8,248,223,90,167,172,144,133,236,229,146,188,230,180,3,5,118,190,238,157,122,51,60,83,186,124,199,151,67,175,226,211,199,1,115,177,75,72,51,82,16,255,4
        // ])
        const uintarray: Uint8Array = Buffer.from([
            149,226,18,86,166,52,2,141,172,220,209,227,65,254,79,35,131,85,164,23,25,8,248,223,90,167,172,144,133,236,229,146,188,230,180,3,5,118,190,238,157,122,51,60,83,186,124,199,151,67,175,226,211,199,1,115,177,75,72,51,82,16,255,4
        ])
        console.log("Uintarray is: ", uintarray);
        const mintAuthorityKeypair: Keypair = Keypair.fromSecretKey(uintarray);

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


        // const mintAuthority: Wallet = Wallet.fromKeypair(qPoolContext.connection, mintAuthorityKeypair);
        // // @ts-ignore
        // const mintAuthority = anchor.Wallet();
        // anchor.Wallet(mintAuthorityKeypair);

        // console.log("Mint authority Keypair is: ", mintAuthorityKeypair.publicKey);
        // console.log("Second mint authority: ", mintAuthority);
        // const mintAuthority = Wallet.fromKeypair(qPoolContext.connection, mintAuthorityKeypair);
        // @ts-ignore
        // const mintAuthority = new anchor.Wallet(mintAuthorityKeypair);
        // const mintAuthority = Wallet.fromKeypair(qPoolContext.connection, mintAuthorityKeypair);
        // console.log("Mint authority is: ", mintAuthority);
        // // Get mint authority from the token
        // console.log("Generating mint");
        // const mint = new Mint(qPoolContext.connection, mintAuthority.publicKey);
        // console.log("Airdropping some tokens to the user ...");
        // const tx = await mint.mintTo(
        //     qPoolContext.userAccount.publicKey,
        //     mintAuthority,
        //     sendAmount.toNumber()
        // );
        // console.log("Confirming transaction");
        // await qPoolContext.connection.confirmTransaction(tx);

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
