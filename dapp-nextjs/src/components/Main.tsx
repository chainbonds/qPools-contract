import React, {FC} from "react";
import {HeroLeft} from "./HeroLeft";
import HeroForm from "./HeroForm";

export const Main: FC = ({}) => {

    const title = () => {
        return (
            <div
                id="slogan-wrapper"
                className="w-full h-full flex items-center px-6 md:px-12"
                style={{ backgroundColor: "#1a202c" }}
            >
                <div className={"relative text-center md:text-left mx-auto"}>
                    <h1 className="absolute text-4xl lg:text-7xl font-bold transform -translate-x-1 -translate-y-1">
                        Generate Yields
                        <br/>
                        Stay Liquid
                    </h1>
                    <h1 className="text-4xl lg:text-7xl font-bold text-pink-500">
                        Generate Yields
                        <br/>
                        Stay Liquid
                    </h1>
                </div>
            </div>
        )
    }

    return (
        // md:pt-20
        // 2xl:px-54
        <div
            id="content"
            className={"flex flex-col md:flex-row w-full grow my-auto"}
            style={{ backgroundColor: "#1a202c" }}
        >
            <div className={"flex-none 2xl:ml-40 md:px-16 inset-x-0 bottom-0"}>
                {title()}
            </div>
            <div className={"flex flex-col md:flex-row w-full justify-center md:justify-start px-2 md:px-6 md:px-16 my-auto"}>
                {/*<div className={"flex grow my-auto"}>*/}
                {/*    <HeroLeft />*/}
                {/*</div>*/}
                {/*<div className={"flex grow"}>*/}
                {/*    <div className={"py-2 grow w-24"}/>*/}
                {/*</div>*/}
                {/*/!*flex grow*!/*/}
                {/*<div className={"px-10 flex-none align-middle my-auto"}>*/}
                {/*    <HeroForm />*/}
                {/*</div>*/}
            </div>
        </div>
    );

}