/**
 * Incredibly good tutorial to copy and paste lol
 * https://blog.prototypr.io/design-a-landing-page-using-tailwind-css-3a1a68166c47
 */
import React, {useEffect, useState} from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { SocialIcon } from 'react-social-icons';
import {Connection, PublicKey, SystemProgram, clusterApiUrl, Keypair} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor'
//@ts-ignore
import _idl from './idl.json';
//@ts-ignore
import _kp from './keypair.json';
import NavbarHeader from "./components/NavbarHeader";
import VariableStakeForm from "./components/VariableStakeForm";
import ConnectWalletButton from "./components/ConnectWalletButton";

const idl: any = _idl;
const kp: any = _kp;

// let baseAccount = Keypair.generate();
const arr: any = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount: Keypair = web3.Keypair.fromSecretKey(secret);

console.log("Imported keypair is: ", baseAccount.publicKey.toBase58());
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts: any = { preflightCommitment: "processed" };

function App() {

    const [inputValue, setInputValue] = useState('');
    const [gifList, setGifList] = useState<any[] | null>([]);

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const { solana }: any = window;

        const provider = new Provider(
            connection, solana, opts.preflightCommitment,
        );
        return provider;
    }

    const createGifAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            console.log("ping");
            await program.rpc.startStuffOff({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount]
            });
            console.log("Created a new BaseAccount w/ address: ", baseAccount.publicKey.toString())
            await getGifList();
        } catch (error) {
            console.log("Error creating BaseAccount account: ", error)
        }

    }

    const getGifList = async() => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
            console.log("RPC Call");
            console.log("gif list is: ", account, account.gifList);
            setGifList(account.gifList);

        } catch (error) {
            console.log("Error in getGifs: ", error);
            setGifList(null);
        }
    }

    // const checkIfWalletIsConnected = async () => {
    //     try {
    //         const {solana}: any = window;
    //
    //         if (solana) {
    //             if (solana.isPhantom) {
    //                 console.log('Phantom wallet found!');
    //
    //                 const response = await solana.connect({onlyIfTrusted: true});
    //                 console.log(
    //                     'Connected with Public Key:',
    //                     response.publicKey.toString()
    //                 );
    //
    //                 setWalletAddress(response.publicKey.toString());
    //
    //             }
    //         } else {
    //             alert('Solana object not found! Get a Phantom Wallet 👻');
    //         }
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

    const onInputChange = (event: any) => {
        const { value }: any = event.target;
        setInputValue(value);
    };

    const sendGif = async () => {
        if (inputValue.length === 0) {
            console.log("No gif link given!")
            return
        }
        console.log('Gif link:', inputValue);

        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            await program.rpc.addGif(inputValue, {
                accounts: {
                    baseAccount: baseAccount.publicKey,
                },
            });
            console.log("GIF sucessfully sent to program", inputValue)

            await getGifList();
        } catch (error) {
            console.log("Error sending GIF:", error)
        }

    };

    const renderConnectedContainer = () => {
        // If we hit this, it means the program account hasn't be initialized.
        if (gifList === null) {
            return (
                <div className="connected-container">
                    <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                        Do One-Time Initialization For GIF Program Account
                    </button>
                </div>
            )
        }
        // Otherwise, we're good! Account exists. User can submit GIFs.
        else {
            return(
                <div className="connected-container">
                    <input
                        type="text"
                        placeholder="Enter gif link!"
                        value={inputValue}
                        onChange={onInputChange}
                    />
                    <button className="cta-button submit-gif-button" onClick={sendGif}>
                        Submit
                    </button>
                    <div className="gif-grid">
                        {/* We use index as the key instead, also, the src is now item.gifLink */}
                        {gifList.map((item: any, index) => (
                            <div className="gif-item" key={index}>
                                <img src={item.gifLink} alt={item.gifLink} />
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
    }

    // useEffect(() => {
    //     window.addEventListener('load', async (event) => {
    //         await checkIfWalletIsConnected();
    //     });
    // }, []);

    // useEffect(() => {
    //     if (walletAddress) {
    //         console.log("Fetching GIF list...");
    //         getGifList();
    //     }
    // }, [walletAddress]);

    return (
        <div className="App mx-auto bg-gray-400">

            {/*<NavbarHeader />*/}

            <div className={"h-full flex items-center px-6 lg:px-32 bg-purple-900 text-white relative"}>

                <header className="w-full absolute left-0 top-0 p-6 lg:p-28 lg:pt-12">
                    <div className="flex justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                                SOLBond
                            </h1>
                            {/*<span>*/}
                            {/*    Diamond Hands Forever*/}
                            {/*</span>*/}
                        </div>

                        <div>
                            <ul className="flex">

                                {/*<li className="ml-24">*/}
                                {/*    <a href="">*/}
                                {/*        <div className="flex items-center justify-end">*/}
                                {/*            <div className="w-10 border-b border-solid border-white"></div>*/}
                                {/*            <h1 className="ml-3 text-3xl font-bold">1</h1>*/}
                                {/*        </div>*/}
                                {/*        <div className="text-right">Connect your Wallet to Stake</div>*/}
                                {/*    </a>*/}
                                {/*</li>*/}

                                {/*<li className="ml-24">*/}
                                {/*    <a href="">*/}
                                {/*        <div className="flex items-center justify-end">*/}
                                {/*            <div className="w-10 border-b border-solid border-white"></div>*/}
                                {/*            <h1 className="ml-3 text-3xl font-bold">2</h1>*/}
                                {/*        </div>*/}
                                {/*        <div className="text-right">Components</div>*/}
                                {/*    </a>*/}
                                {/*</li>*/}
                                {/*<li className="ml-24">*/}
                                {/*    <a href="">*/}
                                {/*        <div className="flex items-center justify-end">*/}
                                {/*            <div className="w-10 border-b border-solid border-white"></div>*/}
                                {/*            <h1 className="ml-3 text-3xl font-bold">3</h1>*/}
                                {/*        </div>*/}
                                {/*        <div className="text-right">CSS Modules</div>*/}
                                {/*    </a>*/}
                                {/*</li>*/}

                                {/*<li className="ml-24">*/}
                                {/*    <a href="">*/}
                                {/*        <div className="flex items-center justify-end">*/}
                                {/*            <div className="w-10 border-b border-solid border-white"></div>*/}
                                {/*            <h1 className="ml-3 text-3xl font-bold">4</h1>*/}
                                {/*        </div>*/}
                                {/*        <div className="text-right">Build & Deploy</div>*/}
                                {/*    </a>*/}
                                {/*</li>*/}

                                <li className="ml-24">
                                    <ConnectWalletButton />
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
                        <VariableStakeForm />
                    </div>

                {/* Replace this by Twitter, Discord, Telegram */}
                <footer className="absolute right-0 bottom-0 p-3 lg:p-10">
                    {/*<p className="font-bold mb-1">*/}
                    {/*    Follow Us*/}
                    {/*</p>*/}
                    <p>
                        <SocialIcon url={"https://twitter.com/chain_crunch"}></SocialIcon>
                        {/*Chigozie Orunta (Full Stack Engineer)*/}
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
