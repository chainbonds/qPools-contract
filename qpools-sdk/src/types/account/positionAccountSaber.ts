import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN} from "@project-serum/anchor";

export interface PositionAccountSaber {
    portfolioPda: PublicKey,
    // Pool Address is the Pool's Mint
    poolAddress: PublicKey,
    isFulfilled: boolean,
    isRedeemed: boolean,
    redeemApproved: boolean,
    index: BN,
    weight: u64,
    max_initial_token_a_amount: u64,
    max_initial_token_b_amount: u64,
    min_mint_amount: u64,
    pool_token_amount: u64,
    minimum_token_amount_out: u64,
    bump: number,
    timestamp: BN,
}