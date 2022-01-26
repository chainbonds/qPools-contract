import {BN} from "@project-serum/anchor";
import {PublicKey} from "@solana/web3.js";

export interface TvlInUsdc {
    tvlMint: PublicKey,
    tvlInUsdc: BN,
    decimals: number
}