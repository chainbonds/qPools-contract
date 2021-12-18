/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {clusterApiUrl, Connection} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
// web3, Wallet as AnchorWallet
// import {BN} from "@project-serum/anchor";
import {Wallet} from "../../splpasta";
// import {solbondProgram} from "../../programs/solbond";
// import {getTokenList} from "../../const";
import {AiOutlineArrowDown} from "react-icons/ai";

export default function UnstakeForm() {

    // TODO: Implement Solana input field
    const {register, handleSubmit} = useForm();
    const walletContext: any = useWallet();

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
        // const programSolbond: any = solbondProgram(connection, provider);
        // const programMarinade: any = marinadeProgram(connection, provider);

        console.log("Submitting logs");

        // TODO: Implement RPC Call
        console.log(JSON.stringify(d));

        const userAccount: Wallet = new Wallet(connection, provider.wallet);
        console.log("Phantom user account is: ", userAccount);
        console.log("Provider is: ", provider);

        // const sendAmount: BN = new BN(d["amount"]);

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
            <div className="">
                <div className="">

                    {/*<Swap provider={provider} tokenList={getTokenList()} />*/}

                    <form action="#" method="POST" onSubmit={handleSubmit(submitToContract)}>
                        <div className="overflow-hidden sm:rounded-md">
                            <div className="px-4 py-5 bg-slate-800 bg-gray sm:p-6">
                                <div>
                                    <div>
                                        <div>
                                            <div className={"absolute"}>
                                                <div className={"flex m-2 ml-2 absolute h-max w-max bg-gray-800 rounded-xl p-1"}>
                                                    <img alt={"QPT Logo"} className={"my-1"} height={50} width={46} src={"./Light 2.png"} />
                                                    <text className={"my-auto text-xl mx-2"}>QPT</text>
                                                </div>
                                            </div>
                                            <input
                                                readOnly={true}
                                                className="rounded w-full py-5 px-5 bg-gray-900 items-end text-right"
                                                type="number"
                                                {...register("stake_amount")}
                                                id="stake_amount"
                                                autoComplete="stake_amount"
                                                placeholder="0.0"
                                            />
                                        </div>

                                        <div className={"w-full flex justify-center"}>
                                            <AiOutlineArrowDown size={28} />
                                        </div>

                                        <div className={"bg-gray-900"}>
                                            <div>
                                                <div className={"absolute"}>
                                                    <div className={"flex m-2 ml-2 absolute h-max w-max bg-gray-800 rounded-xl p-1"}>
                                                        <img alt={"Solana Logo"} className={""} height={42} width={42} src={"./solana-logo.png"} />
                                                        <text className={"my-auto text-xl mx-2"}>SOL</text>
                                                    </div>
                                                </div>
                                                <input
                                                    className="rounded w-full py-5 px-5 bg-gray-900 items-end text-right"
                                                    type="number"
                                                    {...register("stake_amount")}
                                                    id="stake_amount"
                                                    autoComplete="stake_amount"
                                                    placeholder="0.0"
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-3 bg-slate-800 text-right sm:px-6">
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
