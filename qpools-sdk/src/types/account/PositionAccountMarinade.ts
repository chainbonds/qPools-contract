import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN, Program} from "@project-serum/anchor";

// export async function getPositionAccountMarinade(
//     owner: PublicKey,
//     index: number,
//     solbondProgram: Program
// ): Promise<[PublicKey, number]> {
//     throw Error("getPositionAccountMarinade not Implemented Yet!");
// }

// TODO: Perhaps we should think about unifying these as well (?) at least add an ENUM in the beginning of the struct, defining which protocol this belongs to
export interface PositionAccountMarinade {
    portfolioPda: PublicKey,
    isFulfilled: boolean,
    isRedeemed: boolean,
    redeemApproved: boolean,
    index: number,
    weight: u64,
    initialSolAmount: u64,
    msolOutAmount: u64,
    withdrawSolAmount: u64,
    bump: number,
    timestamp: BN,
}
