import {PublicKey} from "@solana/web3.js";

export interface PositionAccount {
    owner: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    mintLp: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    ownerTokenAccountLp: PublicKey,
    poolPda: PublicKey,
    bump: number,
}
