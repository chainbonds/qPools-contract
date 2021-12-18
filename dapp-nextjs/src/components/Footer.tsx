import React, {FC} from "react";
import {SocialIcon} from 'react-social-icons';

export const Footer: FC = ({}) => {

    return (
        <>
            {/*  items-end content-end bottom-0 */}
            <div className="flex flex-row justify-center md:justify-end pt-20 lg:p-20 pb-10 bg-gray-800">
                <SocialIcon url={"https://discord.gg/ThFgTPs6t3"} className={"mx-5"}/>
                <SocialIcon url={"https://twitter.com/chainbonds"} className={"mx-5"} />
                <SocialIcon url={"/whitepaper.pdf"} className={"mx-5"} bgColor="#ff5a01"/>
            </div>
        </>
    );

}