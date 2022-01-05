import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";
import {IDL} from "./idl/solbond";

export const getSolbondProgram = (connection: Connection, provider: Provider) => {

    const programId = new anchor.web3.PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E");
    const program: any = new anchor.Program(
        IDL,
        programId,
        provider,
    );

    return program;
}
