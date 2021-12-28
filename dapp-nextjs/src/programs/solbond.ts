import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";
import {useWallet} from "@solana/wallet-adapter-react";

// // @ts-ignore
// import _idl from './solbondIdl';
import {Provider} from "@project-serum/anchor";
import {SolbondIdl} from "./solbondIdl";

export const solbondProgram = (connection: Connection, provider: Provider) => {

    console.log("Solbond Program ID is: ", String(process.env.NEXT_PUBLIC_PROGRAM_ID));
    const programId = new anchor.web3.PublicKey(String(process.env.NEXT_PUBLIC_PROGRAM_ID));
    const program = new anchor.Program(
        SolbondIdl,
        programId,
        provider,
    );


    return program;

}