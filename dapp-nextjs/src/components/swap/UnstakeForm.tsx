/* This example requires Tailwind CSS v2.0+ */
import {useForm} from "react-hook-form";
import {useWallet} from '@solana/wallet-adapter-react';
import {clusterApiUrl, Connection} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
// web3, Wallet as AnchorWallet
// import {BN} from "@project-serum/anchor";
// import {solbondProgram} from "../../programs/solbond";
// import {getTokenList} from "../../const";
import {AiOutlineArrowDown} from "react-icons/ai";
import InputFieldWithLogo from "../InputFieldWithLogo";
import CallToActionButton from "../CallToActionButton";
import {useEffect, useState} from "react";

export default function UnstakeForm() {

    const {register, handleSubmit} = useForm();

    const [valueInSol, setValueInSol] = useState<number>(0.0);
    const [valueInQPT, setValueInQpt] = useState<number>(0.0);

    useEffect(() => {
        setValueInSol((_: number) => {
            return valueInQPT * 1.;
        });
    }, [valueInQPT]);

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
                                    modifiable={true}
                                    setNewValue={setValueInQpt}
                                />
                                <div className={"ml-5"}>
                                    <AiOutlineArrowDown size={24}/>
                                </div>
                                <InputFieldWithLogo
                                    logoPath={"/solana-logo.png"}
                                    displayText={"SOL"}
                                    registerFunction={() => register("solana_amount")}
                                    modifiable={false}
                                    value={valueInSol}
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
