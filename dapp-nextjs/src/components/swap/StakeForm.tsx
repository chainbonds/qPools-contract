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
import Image from "next/image";
import InputFieldWithLogo from "../InputFieldWithLogo";

export default function StakeForm() {

    const {register, handleSubmit} = useForm();

    const submitToContract = async (d: any) => {
    }

    return (
        <>
            <div className="">
                <div className="">

                    <form action="#" method="POST" onSubmit={handleSubmit(submitToContract)}>
                            <div className="px-4 py-5 bg-slate-800 bg-gray sm:p-6">
                                    <div>
                                        <InputFieldWithLogo
                                            logoPath={"/solana-logo.png"}
                                            displayText={"SOL"}
                                            registerFunction={() => register("solana_amount")}
                                        />
                                        <div className={"ml-10"}>
                                            <AiOutlineArrowDown size={24}/>
                                        </div>
                                        <InputFieldWithLogo
                                            logoPath={"/Light 2 Square.png"}
                                            displayText={"QPT"}
                                            registerFunction={() => register("qpt_amount")}
                                        />
                                </div>
                            </div>
                            <div className="flex w-full bg-slate-800 sm:px-6 justify-end">
                                <button
                                    type="submit"
                                    className={"rounded p-2 text-lg bg-pink-700 hover:bg-pink-900"}
                                >
                                    Purchase Bond
                                </button>
                        </div>
                    </form>

                </div>
            </div>
        </>
    );
}
