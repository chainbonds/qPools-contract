import {u64} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";

export interface PortfolioAccount {
    owner: PublicKey,
    bump: number,

    toBeRedeemed: boolean,
    fullyCreated: boolean,
    //pub all_positions_redeemed: bool,

    initialAmountUSDC: BN,
    withdrawAmountUSDC: BN,

    numRedeemed: BN,
    numPositions: BN,

    // time when portfolio signed
    startTimestamp: BN,

    // time when portfolio is fulfilled
    fulfilledTimestamp: BN,
}
// pub weights: [u64; 3],
// pub owner: Pubkey,
//     pub bump: u8,

