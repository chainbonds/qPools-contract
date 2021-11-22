/**
 * Incredibly good tutorial to copy and paste lol
 * https://blog.prototypr.io/design-a-landing-page-using-tailwind-css-3a1a68166c47
 */
import React, {useEffect, useState} from 'react';
import './App.css';
import {SocialIcon} from 'react-social-icons';
import {Connection, PublicKey, SystemProgram, clusterApiUrl, Keypair} from '@solana/web3.js';
import {Program, Provider, web3} from '@project-serum/anchor'
//@ts-ignore
import _kp from './keypair.json';
import VariableStakeForm from "./components/VariableStakeForm";
import {getPhantomWallet} from "@solana/wallet-adapter-wallets";
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {useWallet, WalletProvider, ConnectionProvider} from '@solana/wallet-adapter-react';
import ListPools from "./components/ListPools";

const kp: any = _kp;

const arr: any = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount: Keypair = web3.Keypair.fromSecretKey(secret);

console.log("Imported keypair is: ", baseAccount.publicKey.toBase58());
const network = clusterApiUrl("devnet");
const wallets = [getPhantomWallet()];

function App() {

    return (
        <div className="App mx-auto bg-gray-400">

            <div className={"min-h-full flex items-center px-6 lg:px-32 bg-purple-900 text-white relative"}>

                <header id={"idBuyBonds"} className="w-full absolute left-0 top-0 p-6 lg:p-28 lg:pt-12">
                    <div className="flex justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                            <svg width="143.5" height="109" viewBox="0 0 287 218" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="15.9251" y="131.362" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 15.9251 131.362)" stroke="#FF3CD4" stroke-width="14"/>
                                    <rect x="14.855" y="118.406" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 14.855 118.406)" stroke="black" stroke-width="14"/>
                                    <rect x="90.5575" y="131.294" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 90.5575 131.294)" stroke="#FF3CD4" stroke-width="14"/>
                                    <rect x="89.4873" y="118.338" width="160.413" height="89.7648" rx="28" transform="rotate(-39.4745 89.4873 118.338)" stroke="black" stroke-width="14"/>
                                    <rect x="177.292" y="52.1972" width="13.3387" height="14.0282" transform="rotate(51.6441 177.292 52.1972)" fill="black"/>
                                    <rect x="158.019" y="50.905" width="16.6419" height="7.38514" transform="rotate(50.5467 158.019 50.905)" fill="#FF3CD4"/>
                            </svg>
                                ChainBonds
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
                                        <div className="text-right">Buy Bonds</div>
                                    </a>
                                </li>

                                <li className="ml-24">
                                    <a href={"#idPoolList"}>
                                        <div className="flex items-center justify-end">
                                            <div className="w-10 border-b border-solid border-white"></div>
                                            <h1 className="ml-3 text-3xl font-bold">2</h1>
                                        </div>
                                        <div className="text-right">Redeem Bonds</div>
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

                <section className="text-left w-full md:w-7/12 xl:w-6/12">
                    <span className="font-bold uppercase tracking-widest">Solana</span>
                    <h1 className="text-3xl lg:text-7xl font-bold text-pink-500">
                        Bonds On
                        <br/>
                        Solana
                    </h1>
                    <p className="font-bold mb-1 text-xl">
                        Predictable and sustainable income streams while making sure you dimaond-hand your investment.
                    </p>
                    <p>
                        SolBond is the first and largest provider of Bonds on Solana.
                    </p>
                </section>

                <div className={"m-auto w-4/12"}>

                    <div className="mt-10 sm:mt-0">
                        <VariableStakeForm />
                    </div>

                    {/*<VariableStakeForm*/}
                    {/*    // initializeRpcCall={initializeRpcCall}*/}
                    {/*/>*/}
                </div>

                {/* Replace this by Twitter, Discord, Telegram */}
                <footer className="absolute right-0 bottom-0 p-3 lg:p-10">
                    {/*<p>*/}
                    <SocialIcon url={"https://twitter.com/chain_crunch"}></SocialIcon>
                    {/*</p>*/}
                </footer>

            </div>

            <div id={"idPoolList"} className={"min-h-full px-6 lg:px-32 bg-purple-900"}>
                <ListPools />
            </div>

            {/*<div className={"flex mx-auto items-center px-6 lg:px-32 bg-purple-900 text-white"}>*/}
            {/*</div>*/}

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
