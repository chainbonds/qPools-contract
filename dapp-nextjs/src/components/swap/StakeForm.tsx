/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {Cluster, clusterApiUrl, Connection} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
// web3, Wallet as AnchorWallet
// import {BN} from "@project-serum/anchor";
// import {solbondProgram} from "../../programs/solbond";
// import {getTokenList} from "../../const";
import {AiOutlineArrowDown} from "react-icons/ai";
import Image from "next/image";
import InputFieldWithLogo from "../InputFieldWithLogo";
import CallToActionButton from "../CallToActionButton";
import {solbondProgram} from "../../programs/solbond";
import {BN} from "@project-serum/anchor";
import {WalletI} from "../../splpasta/types";
import {useEffect, useState} from "react";

export default function StakeForm() {

    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();

    const [valueInSol, setValueInSol] = useState<number>(0.0);
    const [valueInQPT, setValueInQpt] = useState<number>(0.0);

    useEffect(() => {
        setValueInQpt((_: number) => {
            return valueInSol * 1.;
        });
    }, [valueInSol]);

    const submitToContract = async (d: any) => {
        console.log("Cluster URL is: ", String(process.env.NEXT_PUBLIC_CLUSTER_URL));

        let connection;
        let clusterName = String(process.env.NEXT_PUBLIC_CLUSTER_NAME);
        if (clusterName === "localnet") {
            let localClusterUrl = String(process.env.NEXT_PUBLIC_CLUSTER_URL);
            connection = new Connection(localClusterUrl, 'confirmed');
        } else if (clusterName === "devnet") {
            connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        } else if (clusterName === "testnet") {
            connection = new Connection(clusterApiUrl('testnet'), 'confirmed');
        } else if (clusterName === "mainnet") {
            connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
        } else {
            throw Error("Cluster is not defined properly! {$clusterName}");
        }

        const provider = new anchor.Provider(connection, walletContext, anchor.Provider.defaultOptions());
        anchor.setProvider(provider);

        const programSolbond: any = solbondProgram(connection, provider);
        console.log("Solbond ProgramId is: ", programSolbond.programId.toString());

        // TODO: Implement RPC Call
        console.log(JSON.stringify(d));

        // Assert that there is some wallet registered
        // Modify button accordingly (in a context state or so)

        const userAccount: WalletI = provider.wallet;
        if (!userAccount.publicKey) {
            alert("Please connect your wallet first!");
            return
        }
        console.log("Phantom user account is: ", userAccount.publicKey.toString());
        console.log("Provider is: ", provider);

        const sendAmount: BN = new BN(d["amount"]);
        console.log("send amount is: ", sendAmount.toString());

        console.log("Will implement this stuff");

        // Calculate the conversation ratio
        // Assume a simple multiplication with a constant (market rate)

    }

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
                        <CallToActionButton
                            type={"submit"}
                            text={"EARN"}
                        />
                    </form>
                </div>
            </div>
        </>
    );
}
