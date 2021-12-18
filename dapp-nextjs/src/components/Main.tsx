import React, {FC} from "react";
import {HeroLeft} from "./HeroLeft";
import HeroForm from "./HeroForm";

export const Main: FC = ({}) => {

    return (
        <div className={"flex flex-col md:flex-row justify-center md:justify-start md:pt-20 px-2 md:px-6 bg-gray-800 md:px-16 2xl:px-54"}>
            <HeroLeft />
            <div className={"md:hidden"}>
                <div className={"mt-5"}/>
            </div>
            <HeroForm />
        </div>
    );

}