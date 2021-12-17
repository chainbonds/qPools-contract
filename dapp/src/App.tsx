/**
 * Incredibly good tutorial to copy and paste lol
 * https://blog.prototypr.io/design-a-landing-page-using-tailwind-css-3a1a68166c47
 */
import React, {useEffect} from 'react';
import './App.css';
import {SocialIcon} from 'react-social-icons';
import {clusterApiUrl, Keypair} from '@solana/web3.js';
import {web3} from '@project-serum/anchor'
//@ts-ignore
import _kp from './keypair.json';
import StakeForm from "./components/swap/StakeForm";
import {getPhantomWallet} from "@solana/wallet-adapter-wallets";
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {WalletProvider, ConnectionProvider} from '@solana/wallet-adapter-react';
import HeroForm from "./components/HeroForm";
import Statistics from "./components/Statistics";

const kp: any = _kp;

const arr: any = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount: Keypair = web3.Keypair.fromSecretKey(secret);

console.log("Imported keypair is: ", baseAccount.publicKey.toBase58());
const network = clusterApiUrl("devnet");
const wallets = [getPhantomWallet()];

// Define which items can be displayed lol
function App() {

    return (
        <div className="App mx-auto bg-gray-400">

            <div className={"min-h-full flex items-center px-6 lg:px-32 bg-slate-800 text-white relative"}>

                <header id={"idBuyBonds"} className="w-full absolute left-0 top-0 p-6 lg:p-28 lg:pt-12">
                    <div className="flex justify-between">
                        <div>
                            <div>
                                <svg width="187" height="118" viewBox="0 0 287 218" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="15.9251" y="131.362" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 15.9251 131.362)" stroke="#FF3CD4" stroke-width="14"/>
                                    <rect x="14.855" y="118.406" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 14.855 118.406)" stroke="white" stroke-width="14"/>
                                    <rect x="90.5575" y="131.294" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 90.5575 131.294)" stroke="#FF3CD4" stroke-width="14"/>
                                    <rect x="89.4873" y="118.338" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 89.4873 118.338)" stroke="white" stroke-width="14"/>
                                    <rect x="177.292" y="52.1972" width="13.3387" height="14.0282" transform="rotate(51.6441 177.292 52.1972)" fill="white"/>
                                    <rect x="158.018" y="50.905" width="16.6419" height="7.38514" transform="rotate(50.5467 158.018 50.905)" fill="#FF3CD4"/>
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold">
                                qPools
                            </h1>
                            {/*<span>*/}
                            {/*    Diamond Hands Forever*/}
                            {/*</span>*/}
                        </div>


                        <div>

                            <ul className="flex">

                                <li className="ml-24">
                                    <a href={"#idBuyBonds"}>
                                        <div className="flex items-center justify-end">
                                            <div className="w-10 border-b border-solid border-white"></div>
                                            <h1 className="ml-3 text-3xl font-bold">1</h1>
                                        </div>
                                        <div className="text-right">Buy</div>
                                    </a>
                                </li>

                                <li className="ml-24">
                                    <a href={"#idPoolList"}>
                                        <div className="flex items-center justify-end">
                                            <div className="w-10 border-b border-solid border-white"></div>
                                            <h1 className="ml-3 text-3xl font-bold">2</h1>
                                        </div>
                                        <div className="text-right">Redeem</div>
                                    </a>
                                </li>

                                <li className="ml-24">
                                    <a href="">
                                        <div className="flex items-center justify-end">
                                            <div className="w-10 border-b border-solid border-white"></div>
                                            <h1 className="ml-3 text-3xl font-bold">3</h1>
                                        </div>
                                        <div className="text-right">Whitepaper</div>
                                    </a>
                                </li>

                                <li className="ml-24">

                                    <WalletMultiButton className="cta-button connect-wallet-button px-20"
                                                       onClick={() => {
                                                           console.log("click")
                                                       }}/>

                                </li>
                            </ul>
                        </div>

                    </div>
                </header>

                <section className="text-left mt-52 w-full h-full md:w-8/12 xl:w-7/12 mt-10">
                    {/*<span className="font-bold uppercase tracking-widest">ChainBonds</span>*/}
                    <div className={"px-1"}>
                        {/*<h1 className='absolute'>TEST TEXT</h1>*/}
                        {/*<h1 className='text-pink-500 transform translate-x-1 translate-y-1'>*/}
                        {/*    TEST TEXT*/}
                        {/*</h1>*/}
                        <h1 className="absolute text-3xl lg:text-7xl font-bold red-text-shadow transform -translate-x-1 -translate-y-1">
                            {/*pink-500*/}
                            {/*Provide liquidity*/}
                            Passive Income
                            <br/>
                            Staying Liquid
                        </h1>
                        <h1 className="text-3xl lg:text-7xl font-bold text-pink-500 red-text-shadow">
                            {/*pink-500*/}
                            Passive Income
                            <br/>
                            Staying Liquid
                        </h1>
                    </div>
                    <br />
                    <p className="mb-1 text-2xl text-gray-100 leading-10">
                        {/*Predictable and sustainable income streams while making sure you dimaond-hand your investment.*/}
                        {/*or USDC*/}
                        <div>
                            qPools generates passive yields, all while staying liquid.
                        </div>
                        <div>
                            We optimize for yield while adjusting for risk.
                        </div>
                        {/*<div>*/}
                        {/*    /!*You enjoy being able to spend your funds elsewhere.*!/*/}
                        {/*    /!*qPools is risk-adjusted in a highly volatile DeFi space.*!/*/}
                        {/*</div>*/}
                    </p>
                    <div className={"mt-10"}>
                        <Statistics />
                    </div>
                    {/*<p>*/}
                    {/*    Our algorithms are optimized to minimize risk exposure to stable-coins.*/}
                    {/*    so you can lean back, and make money even during your sleep.*/}
                    {/*    /!*SolBond is the first and largest provider of Bonds on Solana.*!/*/}
                    {/*</p>*/}
                </section>

                <div className={"m-auto w-4/12"}>
                    {/*<div className={"text-left"}>*/}
                    {/*    /!* TODO: We gotta have a section which covers some basic statics (how much is staked, etc.)*!/*/}
                    {/*    <p className="align-bottom mb-0 text-pink-500 mb-1 text-2xl leading-10 font-bold">*/}
                    {/*        /!*Predictable and sustainable income streams while making sure you dimaond-hand your investment.*!/*/}
                    {/*        /!*or USDC*!/*/}
                    {/*        Last week's APR: 6.5%*/}
                    {/*    </p>*/}
                    {/*    <p className="align-bottom mb-0 text-pink-500 mb-1 text-2xl leading-10 font-bold">*/}
                    {/*        /!*Predictable and sustainable income streams while making sure you dimaond-hand your investment.*!/*/}
                    {/*        /!*or USDC*!/*/}
                    {/*        TVL: 13,000.00 USDC*/}
                    {/*    </p>*/}
                    {/*</div>*/}

                    <div className="mt-10 sm:mt-0">
                        <br />
                        <HeroForm />
                    </div>

                </div>

            </div>


            {/* Replace this by Twitter, Discord, Telegram */}
            <footer>
                {/*className="absolute right-0 bottom-0 p-3 lg:p-10"*/}
                {/*<div className="absolute px-auto mx-auto bottom-0">*/}
                {/*    Hello*/}
                {/*</div>*/}
                <div className="absolute right-0 bottom-0 p-3 lg:p-10">
                    {/*<p>*/}
                    <SocialIcon url={"https://discord.gg/ThFgTPs6t3"} className={"mx-5"}/>
                    <SocialIcon url={"https://twitter.com/chainbonds"} className={"mx-5"} />
                    {/*</p>*/}
                </div>
            </footer>

        </div>
    );
}

const AppWithProvider = () => (
    <ConnectionProvider endpoint={network}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <App/>
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default AppWithProvider;
