import {Connection, PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {getPositionPda} from "../../types/account/pdas";
import {accountExists} from "../../utils";
import {PositionAccountSolend} from "../../types/account";

export async function fetchSinglePositionSolend(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number
): Promise<PositionAccountSolend | null> {
    console.log("#fetchSinglePosition()");
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("(2) portfolio PDA: ", positionPDA, typeof positionPDA);
    let positionContent = null;
    if (await accountExists(connection, positionPDA)) {
        let response = await solbondProgram.account.positionAccountSolend.fetch(positionPDA);
        positionContent = response as PositionAccountSolend;
    }
    console.log("##fetchSinglePosition()");
    return positionContent;
}