import * as anchor from "@project-serum/anchor";
import {Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";
import {IDL} from "./idl/solbond";
import {NETWORK} from "./types/cluster";
import {Cluster} from "./network";

export const getSolbondProgram = (connection: Connection, provider: Provider, network: Cluster = Cluster.DEVNET) => {

    // Have a list of all addresses, based on DEVNET, MAINNET, ETC.
    let programAddress;
    if (network == Cluster.DEVNET) {
        programAddress = "EXmu4yEYAs3LtLEGYYdB6Jr19sKhW57HWEaEHgrWmstP";
    } else if (network == Cluster.MAINNET) {
        programAddress = "EXmu4yEYAs3LtLEGYYdB6Jr19sKhW57HWEaEHgrWmstP";
    } else {
        throw Error("Solana Cluster not specified!" + String(network));
    }

    const programId = new anchor.web3.PublicKey(programAddress);
    const program: any = new anchor.Program(
        IDL,
        programId,
        provider,
    );

    return program;
}
