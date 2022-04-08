import * as anchor from "@project-serum/anchor";
import {Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";
import {IDL} from "./idl/solbond";
import {NETWORK} from "./types/cluster";

export const getSolbondProgram = (connection: Connection, provider: Provider, network: NETWORK = NETWORK.LOCALNET) => {

    // Have a list of all addresses, based on DEVNET, MAINNET, ETC.
    let programAddress;
    if (network == NETWORK.LOCALNET) {
        programAddress = "CNYbaeQEV1s3TwDXLYyEWCBxp1rC9u1To48WWKDBQzph";
    } else if (network == NETWORK.DEVNET) {
        programAddress = "CNYbaeQEV1s3TwDXLYyEWCBxp1rC9u1To48WWKDBQzph";
    } else if (network == NETWORK.TESTNET) {
        programAddress = "CNYbaeQEV1s3TwDXLYyEWCBxp1rC9u1To48WWKDBQzph";
    } else if (network == NETWORK.MAINNET) {
        programAddress = "CNYbaeQEV1s3TwDXLYyEWCBxp1rC9u1To48WWKDBQzph";
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
