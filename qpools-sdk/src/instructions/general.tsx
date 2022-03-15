import {getPortfolioPda} from "../types/account/portfolioAccount";
import {accountExists} from "../utils";
import {Connection, PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";

export async function portfolioExists(
    connection: Connection,
    owner: PublicKey,
    solbondProgram: Program
): Promise<boolean> {
    console.log("#portfolioExists");
    let out: boolean
    let [portfolioPda, _] = await getPortfolioPda(owner, solbondProgram);
    if (connection) {
        out = await accountExists(connection, portfolioPda);
    } else {
        // Maybe let it rerun after a second again ...
        out = false;
    }
    console.log("##portfolioExists");
    return out;
}