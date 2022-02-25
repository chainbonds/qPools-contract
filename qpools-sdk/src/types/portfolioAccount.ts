import {u64} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";

export interface PortfolioAccount {
    weights: Array<BN>,
    owner: PublicKey,
    bump: number,
    initialAmountUsdc: number,
}
// pub weights: [u64; 3],
// pub owner: Pubkey,
//     pub bump: u8,

