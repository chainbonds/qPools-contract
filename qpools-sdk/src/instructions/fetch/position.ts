import {Connection, PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {PositionAccountSaber} from "../../types/account/positionAccountSaber";
import {getPositionPda} from "../../types/account/pdas";
import {accountExists} from "../../utils";

// TODO: This position can either be a Marinade Position, or a Saber Position. Make sure to distinguish between the two!
/**
 * Fetch the position account
 * @param index The index at which this position is stored. Be careful not to mix the protocol types with the indecies
 */
export async function fetchSinglePosition(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number
): Promise<PositionAccountSaber | null> {
    console.log("#fetchSinglePosition()");
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("(2) portfolio PDA: ", positionPDA, typeof positionPDA);
    let positionContent = null;
    if (await accountExists(connection, positionPDA)) {
        let response = await solbondProgram.account.positionAccountSaber.fetch(positionPDA);
        positionContent = response as PositionAccountSaber;
    }
    console.log("##fetchSinglePosition()");
    return positionContent;
}
