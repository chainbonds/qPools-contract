import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";

// Not sure if this import is allowed...
//@ts-ignore
import _invariant_idl from '../../solbond/deps/protocol/target/idl/amm.json';
import {NETWORK} from "@qpools/sdk/lib/cluster";
const invariant_idl: any = _invariant_idl;

export const getInvariantProgram = (connection: Connection, provider: Provider, network: NETWORK = NETWORK.LOCALNET) => {

    let programAddress;
    if (network == NETWORK.LOCALNET) {
        programAddress = "77yFpTqxesQNz7Styk6yTRBaEcW9LxDKPvA46HfuA77z";
    } else if (network == NETWORK.DEVNET) {
        programAddress = "5W8cgQkGhjniKuVikNyVq6Nh5mWVzHawRnXkWhL7risj";
    } else if (network == NETWORK.TESTNET) {
        programAddress = "5W8cgQkGhjniKuVikNyVq6Nh5mWVzHawRnXkWhL7risj";
    } else if (network == NETWORK.MAINNET) {
        programAddress = "5W8cgQkGhjniKuVikNyVq6Nh5mWVzHawRnXkWhL7risj";
    } else {
        throw Error("Solana Cluster not specified!" + String(network));
    }

    const programId = new anchor.web3.PublicKey(programAddress);
    const program = new anchor.Program(
        invariant_idl,
        programId,
        provider,
    );

    return program;
}
