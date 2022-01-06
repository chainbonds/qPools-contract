import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, Provider, Wallet } from "@project-serum/anchor";
import { Market, Pair } from "@invariant-labs/sdk";
import { FeeTier } from "@invariant-labs/sdk/lib/market";
import { Token } from "@solana/spl-token";
import { PoolStructure } from "@invariant-labs/sdk/lib/market";
import { QPair } from "./q-pair";
export declare class QPoolsAdmin {
    connection: Connection;
    solbondProgram: Program;
    invariantProgram: Program;
    provider: Provider;
    wallet: Keypair;
    currencyMint: Token;
    qPoolAccount: PublicKey | null;
    bumpQPoolAccount: number | null;
    QPTokenMint: Token | undefined;
    qPoolQPAccount: PublicKey | undefined;
    qPoolCurrencyAccount: PublicKey | undefined;
    pairs: QPair[] | undefined;
    mockMarket: Market | undefined;
    feeTier: FeeTier;
    QPReserveTokens: Record<string, PublicKey>;
    constructor(connection: Connection, provider: Provider, currencyMint: PublicKey);
    prettyPrintAccounts(): void;
    loadExistingQPTReserve(): Promise<boolean>;
    initializeQPTReserve(): Promise<void>;
    /**
     *
     * @param currencyMint: Will be provided, is the currency that will be used
     */
    get(pair: Pair): Promise<PoolStructure>;
    createQPTReservePoolAccounts(positionOwner: Keypair, payer: Wallet): Promise<void>;
    setPairs(pairs: QPair[]): Promise<void>;
    /**
     * The admin user is making these transactions
     *
     * For every pair in our token account, we need to
     * Get the oracle price for every pair
     * Get the ratio for each pair
     * Check how much was swapped already
     * Swap the rest / difference of this
     * Rename `mockMarket` with `market` everywhere
     *
     * @param initializer
     */
    swapReserveToAllAssetPairs(amount: number, backToCurrency?: boolean): Promise<void>;
    /**
     * Swap assets back from the liquidity-pool assets
     * back to the currency asset
     * @param amount
     */
    swapAllAssetPairsToReserve(amount: number): Promise<void>;
    getPositionListSeeds(owner: PublicKey): Promise<{
        positionListAddress: PublicKey;
        positionListBump: number;
    }>;
    createPositionList(): Promise<void>;
    createPositions(): Promise<void>;
}
