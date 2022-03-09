import * as anchor from "@project-serum/anchor";
import {Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";
import {IDL} from "./idl/solbond";
import {NETWORK} from "./cluster";

export const getSolbondProgram = (connection: Connection, provider: Provider, network: NETWORK = NETWORK.LOCALNET) => {

    // Have a list of all addresses, based on DEVNET, MAINNET, ETC.
    let programAddress;
    if (network == NETWORK.LOCALNET) {
        programAddress = "4bLkaDJ2KAcGoo3cvbdhkX87Bc9jZnmDzR9LTn2P48Vw";
    } else if (network == NETWORK.DEVNET) {
        programAddress = "4bLkaDJ2KAcGoo3cvbdhkX87Bc9jZnmDzR9LTn2P48Vw";
    } else if (network == NETWORK.TESTNET) {
        programAddress = "4bLkaDJ2KAcGoo3cvbdhkX87Bc9jZnmDzR9LTn2P48Vw";
    } else if (network == NETWORK.MAINNET) {
        programAddress = "4bLkaDJ2KAcGoo3cvbdhkX87Bc9jZnmDzR9LTn2P48Vw";
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
