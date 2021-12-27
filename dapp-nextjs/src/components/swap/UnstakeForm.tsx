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
import InputFieldWithLogo from "../InputFieldWithLogo";
import CallToActionButton from "../CallToActionButton";

export default function UnstakeForm() {

    const {register, handleSubmit} = useForm();

    const submitToContract = async (d: any) => {
    }

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
                                />
                                <div className={"ml-5"}>
                                    <AiOutlineArrowDown size={24}/>
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/solana-logo.png"}
                                    displayText={"SOL"}
                                    registerFunction={() => register("solana_amount")}
                                />
                            </div>
                        </div>
                        <CallToActionButton
                            type={"submit"}
                            text={"REDEEM"}
                        />
                    </form>

                </div>
            </div>
        </>
    );
}
