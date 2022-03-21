import {PublicKey, TokenAmount} from "@solana/web3.js";

export enum ProtocolType {
    Staking,
    DEXLP,
    Lending
}

export interface PositionInfo {
    protocolType: ProtocolType,
    index: number,
    poolAddress: PublicKey,
    portfolio: PublicKey,
    mintA: PublicKey,
    ataA: PublicKey,
    amountA: TokenAmount,
    usdcValueA: number,
    mintB: PublicKey,
    ataB: PublicKey,
    amountB: TokenAmount,
    usdcValueB: number,
    mintLp: PublicKey,
    ataLp: PublicKey,
    amountLp: TokenAmount,
    usdcValueLP: number,
    totalPositionValue: number
}
