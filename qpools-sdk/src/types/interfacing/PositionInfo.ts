import {PublicKey, TokenAmount} from "@solana/web3.js";

export enum ProtocolType {
    Staking,
    DEXLP,
    Lending
}

export enum Protocol {
    saber,
    marinade,
    solend
}

export interface PositionInfo {
    protocolType: ProtocolType,
    protocol: Protocol,
    index: number,
    poolAddress?: PublicKey,
    portfolio: PublicKey,
    mintA: PublicKey,
    ataA: PublicKey,
    amountA: TokenAmount,
    usdcValueA: number,
    mintB?: PublicKey,
    ataB?: PublicKey,
    amountB?: TokenAmount,
    usdcValueB: number,
    mintLp: PublicKey,
    ataLp: PublicKey,
    amountLp: TokenAmount,
    usdcValueLP: number,
    totalPositionValue: number
}
