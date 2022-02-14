import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";

export interface TwoWayPoolAccount {
    generator: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    mintLp: PublicKey,
    poolTokenAccountA: PublicKey,
    poolTokenAccountB: PublicKey,
    bump: number,
    totalAmountInA: u64,
    totalAmountInB: u64,
}
