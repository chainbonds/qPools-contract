import * as anchor from "@project-serum/anchor";
import {Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";
import {IDL} from "./idl/solbond";
import {NETWORK} from "./cluster";

export const getSolbondProgram = (connection: Connection, provider: Provider, network: NETWORK = NETWORK.LOCALNET) => {

    // Have a list of all addresses, based on DEVNET, MAINNET, ETC.
    let programAddress;
    if (network == NETWORK.LOCALNET) {
        programAddress = "Bv9aWUSsGfBdkuYG7q4qAWMoYhHKXq4CZpD3rupLEUwf";
    } else if (network == NETWORK.DEVNET) {
        programAddress = "Bv9aWUSsGfBdkuYG7q4qAWMoYhHKXq4CZpD3rupLEUwf";
    } else if (network == NETWORK.TESTNET) {
        programAddress = "3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E";
    } else if (network == NETWORK.MAINNET) {
        programAddress = "3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E";
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
