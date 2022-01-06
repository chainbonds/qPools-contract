import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import { Market, Position } from '@invariant-labs/sdk/lib/market';
import { Decimal } from '@invariant-labs/sdk/src/market';
import { Pair } from '@invariant-labs/sdk';
import { BN } from "@project-serum/anchor";
export declare function assertThrowsAsync(fn: Promise<any>, word?: string): Promise<void>;
export declare const eqDecimal: (x: Decimal, y: Decimal) => boolean;
export declare const createToken: (connection: Connection, payer: Keypair, mintAuthority: Keypair, decimals?: number) => Promise<Token>;
export declare const positionEquals: (a: Position, b: Position) => boolean;
export declare const positionWithoutOwnerEquals: (a: Position, b: Position) => boolean;
export declare const createStandardFeeTiers: (market: Market, payer: Keypair) => Promise<void>;
export declare const createTokensAndPool: (market: Market, connection: Connection, payer: Keypair, initTick?: number, fee?: BN, tickSpacing?: number) => Promise<{
    tokenX: Token;
    tokenY: Token;
    pair: Pair;
    mintAuthority: Keypair;
}>;
export declare const createUserWithTokens: (pair: Pair, connection: Connection, mintAuthority: Keypair, mintAmount?: BN) => Promise<{
    owner: Keypair;
    userAccountX: PublicKey;
    userAccountY: PublicKey;
}>;
export declare const createPoolWithLiquidity: (market: Market, connection: Connection, payer: Keypair, liquidity?: Decimal, initialTick?: number, lowerTick?: number, upperTick?: number) => Promise<{
    pair: Pair;
    mintAuthority: Keypair;
}>;
export declare const setInitialized: (bitmap: number[], index: number) => void;
