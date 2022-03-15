import {PublicKey} from "@solana/web3.js";
import {BN, Program} from "@project-serum/anchor";
import {u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../../seeds";

export async function getPortfolioPda(owner: PublicKey, solbondProgram: Program) {
    return PublicKey.findProgramAddress(
        [owner.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
        solbondProgram.programId
    )
}

export interface PortfolioAccount {
    owner: PublicKey,
    bump: number,

    toBeRedeemed: boolean,
    fullyCreated: boolean,
    //pub all_positions_redeemed: bool,

    initialAmountUSDC: u64,
    withdrawAmountUSDC: u64,

    numRedeemed: number,
    numPositions: number,

    // time when portfolio signed
    startTimestamp: BN,

    // time when portfolio is fulfilled
    fulfilledTimestamp: BN,
}
