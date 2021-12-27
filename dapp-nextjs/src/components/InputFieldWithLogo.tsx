import React, {FC} from "react";
import {HeroLeft} from "./HeroLeft";
import HeroForm from "./HeroForm";
import Image from "next/image";

export default function InputFieldWithLogo(props: any) {

    return (
        <>
            <div className={"flex relative"}>
                <div className={"flex m-2 h-max w-max bg-gray-800 rounded-xl p-1"}>
                    <Image alt={props.displayText} src={props.logoPath} height={80} width={80}/>
                    <text className={"my-auto mx-2"}>
                        {props.displayText}
                    </text>
                </div>
                <input
                    className="rounded-xl w-full w-full px-5 bg-gray-900 items-end text-right"
                    type="number"
                    id="stake_amount"
                    {...props.registerFunction()}
                    autoComplete="stake_amount"
                    placeholder="0.0"
                />
            </div>
        </>
    );

}