import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN} from "@project-serum/anchor";

export interface PositionAccountSolend {
    portfolioPda: PublicKey,
    // Pool Address is the Pool's Mint
    currencyMint: PublicKey,
    poolAddress: PublicKey,
    isFulfilled: boolean,
    isRedeemed: boolean,
    redeemApproved: boolean,
    index: number,
    weight: u64,
    initialAmount: u64,
    withdrawAmount: u64,
    bump: number,
    timestamp: BN,
}
