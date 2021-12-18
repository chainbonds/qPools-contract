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

export default function StakeForm() {

    const {register, handleSubmit} = useForm();

    const submitToContract = async (d: any) => {
    }

    const inputFieldWithLogo = (logoPath: string, logoAlt: string, registerEntity: string, displayText: string) => {
        return (
            <>
                <div className={"flex"}>
                    <div className={"flex m-2 h-max w-max bg-gray-800 rounded-xl p-1"}>
                        <Image src={logoPath} height={80} width={80}/>
                        <text className={"my-auto mx-2"}>
                            {displayText}
                        </text>
                    </div>
                    <input
                        className="rounded-xl w-full px-5 bg-gray-900 items-end text-right"
                        type="number"
                        id="stake_amount"
                        {...register(registerEntity)}
                        autoComplete="stake_amount"
                        placeholder="0.0"
                    />
                </div>
            </>
        )
    }

    return (
        <>
            <div className="">
                <div className="">

                    <form action="#" method="POST" onSubmit={handleSubmit(submitToContract)}>
                            <div className="px-4 py-5 bg-slate-800 bg-gray sm:p-6">
                                    <div>
                                        {inputFieldWithLogo("/solana-logo.png", "solana logo", "stake_amount", "SOL")}
                                        <div className={"ml-10"}>
                                            <AiOutlineArrowDown size={28}/>
                                        </div>
                                        {inputFieldWithLogo("/Light 2 Square.png", "QPT logo", "qpt_amount", "QPT")}
                                        {/*<div>*/}
                                        {/*    <div className={"flex m-2 ml-2 absolute h-max w-max bg-gray-800 rounded-xl p-1"}>*/}
                                        {/*        <img alt={"QPT Logo"} className={"my-1"} height={50} width={46}*/}
                                        {/*             src={"./Light 2.png"}/>*/}
                                        {/*        <text className={"my-auto mx-2"}>*/}
                                        {/*            QPT*/}
                                        {/*        </text>*/}
                                        {/*    </div>*/}
                                        {/*    <input*/}
                                        {/*        readOnly={true}*/}
                                        {/*        className="rounded-xl w-full py-5 px-5 bg-gray-900 items-end text-right"*/}
                                        {/*        type="number"*/}
                                        {/*        id="stake_amount"*/}
                                        {/*        {...register("stake_amount")}*/}
                                        {/*        autoComplete="stake_amount"*/}
                                        {/*        placeholder="0.0"*/}
                                        {/*    />*/}
                                        {/*</div>*/}

                                </div>
                            </div>
                            <div className="px-4 py-3 bg-slate-800 text-right sm:px-6">
                                <button
                                    type="submit"
                                    className={"cta-button shadow-sm bg-pink-800 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-800"}
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
