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
import _idl from './idl.json';
//@ts-ignore
import _kp from './keypair.json';
import VariableStakeForm from "./components/VariableStakeForm";
import {getPhantomWallet} from "@solana/wallet-adapter-wallets";
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {useWallet, WalletProvider, ConnectionProvider} from '@solana/wallet-adapter-react';

const idl: any = _idl;
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

            <WalletMultiButton className="cta-button connect-wallet-button px-20" onClick={() => {
                console.log("click")
            }}/>

            <div className={"h-full flex items-center px-6 lg:px-32 bg-purple-900 text-white relative"}>

                <header className="w-full absolute left-0 top-0 p-6 lg:p-28 lg:pt-12">
                    <div className="flex justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                                ChainBonds
                            </h1>
                            {/*<span>*/}
                            {/*    Diamond Hands Forever*/}
                            {/*</span>*/}
                        </div>


                        <div>

                            <ul className="flex">

                                <li className="ml-24">

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
                    <VariableStakeForm
                        idl={idl}
                        // initializeRpcCall={initializeRpcCall}
                    />
                </div>

                {/* Replace this by Twitter, Discord, Telegram */}
                <footer className="absolute right-0 bottom-0 p-3 lg:p-10">
                    {/*<p>*/}
                    <SocialIcon url={"https://twitter.com/chain_crunch"}></SocialIcon>
                    {/*</p>*/}
                </footer>

            </div>

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
