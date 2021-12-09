import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";

//@ts-ignore
import {Provider} from "@project-serum/anchor";
import {Idl_amm, IDL} from "./idl_amm";

export const invariantAmmProgram = (connection: Connection, provider: Provider, programId: PublicKey) => {

    // TODO: Include this as an environment variable
    const program = new anchor.Program(
        IDL,
        programId,  // The programId is hard-coded in the genesis block
        provider,
    );

    return program;

}