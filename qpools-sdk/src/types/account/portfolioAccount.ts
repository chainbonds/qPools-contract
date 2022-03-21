import {PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";

export interface PortfolioAccount {
    owner: PublicKey,
    bump: number,

    toBeRedeemed: boolean,
    fullyCreated: boolean,

    sum_of_weights: BN,
    numRedeemed: number,
    numPositions: number,
    numCreated: number,

    // time when portfolio signed
    startTimestamp: BN,

    // time when portfolio is fulfilled
    fulfilledTimestamp: BN,
}
