import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";

// Not sure if this import is allowed...
//@ts-ignore
import _invariant_idl from '../../solbond/deps/protocol/target/idl/amm.json';
const invariant_idl: any = _invariant_idl;

export const getInvariantProgram = (connection: Connection, provider: Provider) => {

    const programId = new anchor.web3.PublicKey("77yFpTqxesQNz7Styk6yTRBaEcW9LxDKPvA46HfuA77z");
    const program = new anchor.Program(
        invariant_idl,
        programId,
        provider,
    );

    return program;
}
