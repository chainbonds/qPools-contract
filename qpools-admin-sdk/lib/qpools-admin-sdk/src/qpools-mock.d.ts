/// <reference types="bn.js" />
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { IWallet, Network } from "@invariant-labs/sdk";
import { Decimal } from "@invariant-labs/sdk/lib/market";
import { Token } from "@solana/spl-token";
import { Position, PositionList } from "@invariant-labs/sdk/lib/market";
import { QPoolsAdmin } from "./qpools-admin";
export declare class MockQPools extends QPoolsAdmin {
    tokens: Token[];
    protocolFee: Decimal;
    createTokens(number_pools: number, mintAuthority: Keypair): Promise<void>;
    createPairs(): Promise<void>;
    createState(admin: Keypair): Promise<void>;
    createFeeTier(admin: Keypair): Promise<void>;
    getPositionAddress(owner: PublicKey, index: number): Promise<{
        positionAddress: PublicKey;
        positionBump: number;
    }>;
    getPositionListAddress(owner: PublicKey): Promise<{
        positionListAddress: PublicKey;
        positionListBump: number;
    }>;
    getPositionList(owner: PublicKey): Promise<PositionList>;
    getPosition(owner: PublicKey, index: number): Promise<Position>;
    getTickAddress(pair: any, index: number): Promise<{
        tickAddress: PublicKey;
        tickBump: number;
    }>;
    createMockMarket(network: Network, marketAuthority: IWallet, ammProgramId: PublicKey): Promise<void>;
    creatMarketsFromPairs(admin: Keypair): Promise<void>;
    provideThirdPartyLiquidityToAllPairs(liquidityProvider: Keypair, tokenMintAuthority: Keypair, airdropAmountX: BN): Promise<void>;
}
