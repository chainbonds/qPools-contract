import React, {FC} from "react";
import {HeroLeft} from "./HeroLeft";
import HeroForm from "./HeroForm";

export const Main: FC = ({}) => {

    return (
        // md:pt-20
        // 2xl:px-54
        <div className={"flex flex-col md:flex-row w-full justify-center md:justify-start px-2 md:px-6 bg-gray-800 md:px-16 my-auto"}>
            <div className={"flex grow"}>
                <HeroLeft />
            </div>
            {/*<div className={"flex grow"}>*/}
            {/*    <div className={"pt-5 grow w-24"}/>*/}
            {/*</div>*/}
            {/*flex grow*/}
            <div className={"px-10 flex-none align-middle my-auto"}>
                <HeroForm />
            </div>
        </div>
    );

}