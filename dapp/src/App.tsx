/**
 * Incredibly good tutorial to copy and paste lol
 * https://blog.prototypr.io/design-a-landing-page-using-tailwind-css-3a1a68166c47
 */
import React, {useEffect, useState} from 'react';
import './App.css';
import { SocialIcon } from 'react-social-icons';
import {Connection, PublicKey, SystemProgram, clusterApiUrl, Keypair} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor'
//@ts-ignore
import _idl from './idl.json';
//@ts-ignore
import _kp from './keypair.json';
import VariableStakeForm from "./components/VariableStakeForm";
import {getPhantomWallet} from "@solana/wallet-adapter-wallets";
import {useWallet} from "@solana/wallet-adapter-react";

const idl: any = _idl;
const kp: any = _kp;

const arr: any = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount: Keypair = web3.Keypair.fromSecretKey(secret);

console.log("Imported keypair is: ", baseAccount.publicKey.toBase58());
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts: any = { preflightCommitment: "processed" };
const wallets = [getPhantomWallet()];

function App() {

    const [inputValue, setInputValue] = useState('');
    const [gifList, setGifList] = useState<any[] | null>([]);
    const [walletAddress, setWalletAddress] = useState(null);

    const walletContext: any = useWallet();

    const connectWallet = async () => {
        const { solana }: any = window;

        if (solana) {
            const response = await solana.connect();
            console.log('Connected with Public Key:', response.publicKey.toString());
            setWalletAddress(response.publicKey.toString());
        }
    };

    function getProvider() {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        // TODO Remove this hardcoded network if you want to use proiders as is the case below
        // const network = "http://127.0.0.1:8899";
        // TODO: Introduce environment variable
        const network = "https://api.devnet.solana.com";
        const connection = new Connection(network, opts.preflightCommitment);

        // TODO: Extract Wallet somehow! anchor.Provider.defaultOptions()
        const provider = new Provider(connection, walletContext, opts.preflightCommitment);

        return provider;
    }

    const provider = getProvider();

    const renderNotConnectedContainer = () => (
        <button
            className="cta-button connect-wallet-button"
            onClick={connectWallet}
        >
            Connect to Wallet
        </button>
    );

    const initializeRpcCall = async () => {



    }


    return (
        <div className="App mx-auto bg-gray-400">

            {/*<NavbarHeader />*/}

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
                                    {renderNotConnectedContainer()}
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
                            initializeRpcCall={initializeRpcCall}
                        />
                    </div>

                {/* Replace this by Twitter, Discord, Telegram */}
                <footer className="absolute right-0 bottom-0 p-3 lg:p-10">
                    <p>
                        <SocialIcon url={"https://twitter.com/chain_crunch"}></SocialIcon>
                    </p>
                </footer>

            </div>



            {/*<div className={'container mx-auto bg-gray-400'}>*/}
            {/*    <div className="header-container mx-auto bg-gray-400">*/}
            {/*        <p className="header">*/}
            {/*            Builspace Quickrun lol 🖼 GIF Portal*/}
            {/*        </p>*/}
            {/*        <p className="sub-text">*/}
            {/*            Change loll. View your GIF collection in the metaverse ✨*/}
            {/*        </p>*/}
            {/*        {renderConnectedContainer()}*/}
            {/*    </div>*/}
            {/*</div>*/}



        </div>
    );
}

export default App;
