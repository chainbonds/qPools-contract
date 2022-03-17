import {PublicKey, TokenAmount} from "@solana/web3.js";

export interface PositionInfo {
    protocolType: string,
    index: number,
    poolAddress: PublicKey,
    portfolio: PublicKey,
    mintA: PublicKey,
    ataA: PublicKey,
    amountA: TokenAmount,
    mintB: PublicKey,
    ataB: PublicKey,
    amountB: TokenAmount,
    mintLp: PublicKey,
    ataLp: PublicKey,
    amountLp: TokenAmount,
}
