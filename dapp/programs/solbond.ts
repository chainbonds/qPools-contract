import * as anchor from "@project-serum/anchor";
import {PROGRAM_ID_SOLBOND} from "../const";
import {clusterApiUrl, Connection} from "@solana/web3.js";
import {useWallet} from "@solana/wallet-adapter-react";

//@ts-ignore
import _idl from './../idl/solbond.json';
import {Provider} from "@project-serum/anchor";
const idl: any = _idl;

export const solbondProgram = (connection: Connection, provider: Provider) => {

    const programId = new anchor.web3.PublicKey(PROGRAM_ID_SOLBOND);
    const program = new anchor.Program(
        idl,
        programId,
        provider,
    );

    return program;

}