import React, {FC} from "react";
import {SocialIcon} from 'react-social-icons';


export const Footer: FC = ({}) => {

    return (
        <>
            <footer className={"bg-gray-800"}>
                {/*className="absolute right-0 bottom-0 p-3 lg:p-10"*/}
                {/*<div className="absolute px-auto mx-auto bottom-0">*/}
                {/*    Hello*/}
                {/*</div>*/}
                <div className="w-full flex justify-end p-3 lg:p-10">
                    {/*<p>*/}
                    <SocialIcon url={"https://discord.gg/ThFgTPs6t3"} className={"mx-5"}/>
                    <SocialIcon url={"https://twitter.com/chainbonds"} className={"mx-5"} />
                    <SocialIcon url={"/whitepaper.pdf"} className={"mx-5"} bgColor="#ff5a01"/>
                    {/*</p>*/}
                </div>
            </footer>
        </>
    );

}