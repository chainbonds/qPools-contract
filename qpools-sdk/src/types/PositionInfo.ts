import {PublicKey, TokenAmount} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";

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
    poolAddress: PublicKey,
    portfolio: PublicKey,
    mintA: PublicKey,
    ataA: PublicKey,
    amountA: TokenAmount,
    usdcValueA: BN,
    mintB: PublicKey,
    ataB: PublicKey,
    amountB: TokenAmount,
    usdcValueB: BN,
    mintLp: PublicKey,
    ataLp: PublicKey,
    amountLp: TokenAmount,
    usdcValueLP: BN,
    totalPositionValue: BN
}
