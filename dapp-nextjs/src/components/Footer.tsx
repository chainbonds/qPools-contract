import React, {FC} from "react";
import {SocialIcon} from 'react-social-icons';

export const Footer: FC = ({}) => {

    return (
        <>
            <div className=" md:mt-0 w-full flex justify-center md:justify-end py-20 lg:p-20 bg-gray-800">
                <SocialIcon url={"https://discord.gg/ThFgTPs6t3"} className={"mx-5"}/>
                <SocialIcon url={"https://twitter.com/chainbonds"} className={"mx-5"} />
                <SocialIcon url={"/whitepaper.pdf"} className={"mx-5"} bgColor="#ff5a01"/>
            </div>
        </>
    );

}