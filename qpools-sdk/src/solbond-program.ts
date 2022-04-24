import * as anchor from "@project-serum/anchor";
import {Connection} from "@solana/web3.js";
import {Provider} from "@project-serum/anchor";
import {IDL} from "./idl/solbond";
import {Cluster} from "./network";

export const getSolbondProgram = (connection: Connection, provider: Provider, network: Cluster = Cluster.DEVNET) => {

    // Have a list of all addresses, based on DEVNET, MAINNET, ETC.
    let programAddress;

    if (network == Cluster.DEVNET) {
        programAddress = "FAFYPjvceW8PsAgbaxT84CizUM6zV7hosbhgiCm2fkng";
    } else if (network == Cluster.MAINNET) {
        programAddress = "FAFYPjvceW8PsAgbaxT84CizUM6zV7hosbhgiCm2fkng";

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
