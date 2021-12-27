import React, {FC} from "react";
import {SocialIcon} from 'react-social-icons';

export const Footer: FC = ({}) => {

    return (
        <>
            {/*  items-end content-end bottom-0 */}
            <div
                className="w-full flex flex-row justify-center lg:justify-end pt-10 lg:p-20 pb-10 mt-auto"
                style={{ backgroundColor: "#1a202c" }}
            >
                <SocialIcon
                    url={"https://discord.gg/ThFgTPs6t3"}
                    className={"mx-5"}
                />
                <SocialIcon
                    url={"https://twitter.com/qpoolsfinance"}
                    className={"mx-5"}
                />
                <SocialIcon
                    url={"/whitepaper.pdf"}
                    className={"mx-5"}
                    bgColor="#ff5a01"
                />
            </div>
        </>
    );

}