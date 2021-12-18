import React, {FC} from "react";
import {HeroLeft} from "./HeroLeft";
import HeroForm from "./HeroForm";

export const Main: FC = ({}) => {

    return (
        <div className={"flex flex-col md:flex-row justify-center md:justify-start md:mt-20 h-full px-2 md:px-12 bg-gray-800"}>
            <HeroLeft />
            <HeroForm />
        </div>
    );

}