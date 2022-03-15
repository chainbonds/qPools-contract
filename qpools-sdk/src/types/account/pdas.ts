import {PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../../seeds";

/**
 * A list of PDAs that we don't really have types / accounts for ...
 */
export async function getMarinadeSolPda(
    owner: PublicKey,
    solbondProgram: Program
): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
        [owner.toBuffer(),Buffer.from(anchor.utils.bytes.utf8.encode(SEED.USER_MARINADE_SEED))],
        this.solbondProgram.programId
    );
}