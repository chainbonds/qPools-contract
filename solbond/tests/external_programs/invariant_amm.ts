import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";

//@ts-ignore
import {Provider} from "@project-serum/anchor";
import {Idl_amm, IDL} from "./idl_amm";

export const invariantAmmProgram = (connection: Connection, provider: Provider) => {

    // TODO: Include this as an environment variable
    const programId = new anchor.web3.PublicKey("3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY");
    const program = new anchor.Program(
        IDL,
        programId,  // The programId is hard-coded in the genesis block
        provider,
    );

    return program;

}