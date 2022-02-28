import {u64} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";

// weight1: u64,
//     weight2: u64,
//     weight3: u64,
// weights: u64[]
// let u64Arr: [u64, u64, u64];

export interface PortfolioAccount {
    weights: [u64, u64, u64],
    owner: PublicKey,
    bump: number,
    initialAmountUsdc: u64,
}

// export interface PortfolioAccount {
//     weights: u64[],
//     owner: PublicKey,
//     bump: number,
//     initialAmountUsdc: u64,
// }

// pub weights: [u64; 3],
// pub owner: Pubkey,
//     pub bump: u8,

