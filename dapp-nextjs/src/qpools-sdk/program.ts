import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";

// Not sure if this import is allowed...
//@ts-ignore
import _invariant_idl from './../../../solbond/deps/protocol/target/idl/amm.json';
const invariant_idl: any = _invariant_idl;
//@ts-ignore
import _solana_idl from './../../../solbond/target/idl/solbond.json';
const solana_idl: any = _solana_idl;

export const getSolbondProgram = (connection: Connection, provider: Provider) => {

    const programId = new anchor.web3.PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E");
    const program = new anchor.Program(
        solana_idl,
        programId,
        provider,
    );

    return program;
}

export const getInvariantProgram = (connection: Connection, provider: Provider) => {

    const programId = new anchor.web3.PublicKey("77yFpTqxesQNz7Styk6yTRBaEcW9LxDKPvA46HfuA77z");
    const program = new anchor.Program(
        invariant_idl,
        programId,
        provider,
    );

    return program;
}
