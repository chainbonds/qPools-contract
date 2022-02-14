import {u64} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";

export interface PortfolioAccount {
    weights: u64[],
    owner: PublicKey,
    bump: number
}
