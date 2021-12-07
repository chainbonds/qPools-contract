/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {clusterApiUrl, Connection,} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {BN, web3, Wallet as AnchorWallet} from "@project-serum/anchor";
import {Wallet} from "../splpasta";
import {useState} from "react";
import {solbondProgram} from "../programs/solbond";
import {getTokenList} from "../const";

export default function StakeForm(props: any) {

    // TODO: Implement Solana input field
    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();
    const [accountInfo, setAccountInfo] = useState({});

    const submitToContract = async (d: any) => {

        // Create a new marina program

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const provider = new anchor.Provider(connection, walletContext, anchor.Provider.defaultOptions());
        anchor.setProvider(provider);

        /**
         * TODO: Rewrite all the solbond program code
         */

            // (1) Generate the solbond provider
            // Will send some instructions to our smart contract from here
        const programSolbond: any = solbondProgram(connection, provider);
        // const programMarinade: any = marinadeProgram(connection, provider);

        console.log("Submitting logs");

        // TODO: Implement RPC Call
        console.log(JSON.stringify(d));

        const userAccount: Wallet = new Wallet(connection, provider.wallet);
        console.log("Phantom user account is: ", userAccount);
        console.log("Provider is: ", provider);

        const sendAmount: BN = new BN(d["amount"]);

        /**
         * Fetch the wallet user
         */
        const _userAccount: Wallet = new Wallet(connection, provider.wallet);
        console.log("Phantom user account is: ", _userAccount);
        const purchaser: Wallet = _userAccount;

        if (!purchaser.publicKey) {
            alert("Please connect your wallet first!");
            return
        }

        // TODO: All these depend on the RPC call to be yet defined by the backend
        // We might also use USDC, in which case some swapping might be necessary to do beforehand
        // You can infer this right from the test

        console.log("TODO: Implement the RPC endpoint!");

    }

    return (
        <>
            <div className="md:grid md:grid-cols-2 md:gap-6">
                <div className="mt-5 md:mt-0 md:col-span-2">

                    {/*<Swap provider={provider} tokenList={getTokenList()} />*/}

                    <form action="#" method="POST" onSubmit={handleSubmit(submitToContract)}>
                        <div className="shadow overflow-hidden sm:rounded-md">
                            <div className="px-4 py-5 bg-pink-600 bg-gray sm:p-6">

                                {/*<h2 className="text-2xl lg:text-2xl font-bold text-white pb-5 border-b border-white">*/}
                                {/*    Buy Your Bonds*/}
                                {/*</h2>*/}

                                <div className="grid grid-cols-6 gap-6 pt-5">

                                    <div className="col-span-6 sm:col-span-6">

                                        <label htmlFor="stake_amount" className="
                                            text-left text-sm font-medium text-gray-100 mx-autoblock text-xl font-medium text-white mx-auto pl-0 ml-0
                                        ">
                                            Stake Amount in SOL
                                        </label>
                                        <input
                                            type="number"
                                            {...register("stake_amount")}
                                            id="stake_amount"
                                            autoComplete="stake_amount"
                                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm text-gray-700 sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>

                                    {/*<div className="col-span-6 sm:col-span-6">*/}
                                    {/*    <label htmlFor="timeInSeconds"*/}
                                    {/*           className="block text-xl font-medium text-white">*/}
                                    {/*        Duration (in Seconds)*/}
                                    {/*    </label>*/}
                                    {/*    <input*/}
                                    {/*        type="number"*/}
                                    {/*        {...register("timeInSeconds")}*/}
                                    {/*        id="timeInSeconds"*/}
                                    {/*        autoComplete="timeInSeconds"*/}
                                    {/*        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm text-gray-700 sm:text-sm border-gray-300 rounded-md"*/}
                                    {/*    />*/}
                                    {/*</div>*/}

                                </div>
                            </div>
                            <div className="px-4 py-3 bg-pink-600 text-right sm:px-6">
                                <button
                                    type="submit"
                                    // className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    className={"cta-button shadow-sm bg-purple-600 hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"}
                                >
                                    Purchase Bond
                                </button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </>
    );
}
