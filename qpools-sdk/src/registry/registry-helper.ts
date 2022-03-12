// Static class to help with common functionality around registry, etc.
// Could also be implemented as individual functions,
// but it's nice to have some unified accessor
import {Connection, PublicKey} from "@solana/web3.js";
import {DEV_POOLS_INFO} from "./devnet/pools-info.devnet";
import {DEV_TOKEN_LIST} from "./devnet/token-list.devnet";
import {DEV_PORTFOLIOID_TO_TOKEN} from "./devnet/portfolio-to-pool.devnet";
import {token} from "easy-spl";
import {StableSwap} from "@saberhq/stableswap-sdk";
import {parsePriceData, PriceData} from "@pythnetwork/client";
import {MOCK} from "../const";

// Create interfaces for all getters here for now

export interface PortfolioPair {
    portfolioApiId: string,
    poolAddress: string
}

export interface PythStruct {
    price?: string,
    product?: string
}

export interface SaberToken {
    address: string,
    chainId: number
    decimals: number
    extensions: any,
    logoURI: string
    name: string,
    symbol: string,
}

export interface ExplicitToken {
    address: string,
    chainId: number
    decimals: number
    extensions: any,
    logoURI: string
    name: string,
    symbol: string,
    pyth?: PythStruct
}

export interface ExplicitSaberPool {
    id: string,
    name: string,
    tokens: SaberToken[],  // Should only be used to get the addresses, nothing more // Or we should update it on-the-fly
    currency: string,
    lpToken: ExplicitToken,  // Again, should be updated on the fly
    plotKey: string,
    swap: StableSwap,
    quarry: string,
}

/**
 * Fetches everything from the local files. Does not fetch anything from GET requests / online
 */

// Depending on devnet / mainnet, gotta modify these object!
// This is a good function to do it from
// Make a ternary operator ? : <=> if else
// poolInfo = POOLS_INFO;
// tokenList = TOKEN_LIST;
// portfolioIdTokenDict = PORTFOLIOID_TO_TOKEN;

/*
    Connecting to the Portfolio API
*/
/**
 * Make a case distinction if its a devnet or mainnet token!
 *
 * These functions are not exported for a reason
 */
function getPortfolioToTokenDict(): any {
    return DEV_PORTFOLIOID_TO_TOKEN;
}
function getAllTokens(): any {
    return DEV_TOKEN_LIST;
}
function getAllPools(): any {
    return DEV_POOLS_INFO;
}


export function getSaberStableSwapProgramId(): PublicKey {
    // Probably also replace this with a hardcode.
    // We should aim to remove all occurrences of MOCK.DEV to this file, and then delete them indefinitely
    return new PublicKey(MOCK.DEV.stableSwapProgramId);
}

export function getReferenceCurrencyMint(): PublicKey {
    return new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
}


/**
 * Get all the pools that are using the USDC pool, as specified below.
 */
export function getActivePools(): ExplicitSaberPool[] {
    // Return the pool accounts, that correspond to these tokesn ...
    // Get all pools that have as one component USDC
    let referenceCurrency = getReferenceCurrencyMint();
    // let usdcToken = getToken(new PublicKey(mintUsdc));
    return getPoolsContainingToken(new PublicKey(referenceCurrency));
}

/**
 * Translate the pre-set PortfolioId to the Token Public Key
 * @param portfolioId
 */
export function getTokenFromPortfolioId(portfolioId: String): PublicKey | null {
    let out: PublicKey | null = null;
    getPortfolioToTokenDict()["pairs"].map((x: PortfolioPair) => {
        if (portfolioId === x.portfolioApiId) {
            out = new PublicKey(x.poolAddress);
        }
    })
    return out;
}

/**
 * From a public key representing the Token's Mint, retrieve the Token Object
 * @param tokenMint
 */
export function getToken(tokenMint: PublicKey): ExplicitToken | null {
    let out: ExplicitToken | null = null;
    getAllTokens()["tokens"].map((x: ExplicitToken) => {
        if (x.address === tokenMint.toString()) {
            out = x;
        }
    })
    return out;
}

export function getPoolsFromSplStringIds(splStringId: string[]): Set<ExplicitSaberPool> {
    let out: Set<ExplicitSaberPool> = new Set();
    getAllPools()["saberLiquidityPools"].map((x: ExplicitSaberPool) => {
        if (splStringId.includes(x.name)) {
            out.add(x);
        }
    });
    return out;
}

export function getTokensFromSplStringIds(splStringId: string[]): Set<ExplicitToken> {
    let out: Set<ExplicitToken> = new Set<ExplicitToken>();
    getAllTokens()["tokens"].map((x: ExplicitToken) => {
        if (splStringId.includes(x.name)) {
            out.add(x);
        }
    });
    return out
}

export function getTokenFromSplStringId(splStringId: string): ExplicitToken {
    let out: ExplicitToken | null = null;
    getAllTokens()["tokens"].map((x: ExplicitToken) => {
        if (x.name === splStringId) {
            out = x;
        }
    });
    return out;
}

export function getPoolFromSplStringId(splStringId: string): ExplicitSaberPool {
    let out: ExplicitSaberPool | null = null;
    getAllPools()["saberLiquidityPools"].map((x: ExplicitSaberPool) => {
        if (x.name === splStringId) {
            out = x;
        }
    });
    return out;
}

/**
 * From a public key representing the pool (i.e. liquidity pool, or lending pool),
 * retrieve the Token Object
 * @param poolAddress
 */
export function getPool(poolAddress: PublicKey): ExplicitSaberPool | null {
    let out: ExplicitSaberPool | null = null;
    getAllPools()["saberLiquidityPools"].map((x: ExplicitSaberPool) => {
        if (x.swap.config.swapAccount.equals(poolAddress)) {
            out = x;
        }
    })
    return out;
}

/**
 * Get the Pyth USDC price, given a Token Object (which includes the Pyth price address)
 * @param connection
 * @param token
 */
export async function getTokenPythToUsdcPrice(
    connection: Connection,
    token: ExplicitToken
): Promise<number> {
    // Can do this by making a get request to a pyth object
    // get_account_info then parse that data as a PythPriceAccount
    let priceAccount = new PublicKey(token.pyth.price);
    let priceData: PriceData = parsePriceData((await connection.getAccountInfo(priceAccount)).data);
    console.log("Price data is: ", priceData.price);
    return priceData.price;
}

/**
 * Get a list of all pools that is working with a mint of the provided token
 * @param tokenMint
 */
export function getPoolsContainingToken(tokenMint: PublicKey) {
    let allPools: ExplicitSaberPool[] = [];
    getAllPools()["saberLiquidityPools"].map((x: ExplicitSaberPool) => {
        // These are not explicit token types, these are saber token types
        let tokenA: SaberToken = x.tokens[0];
        let tokenB: SaberToken = x.tokens[1];
        if (
            tokenA.address.toString() === tokenMint.toString() ||
            tokenB.address.toString() === tokenMint.toString()
        ) {
            allPools.push(x)
        }
    })
    return allPools;
}

/**
 * Get the serpius API endpoint. Depending on whether we are on mainnet or devnet,
 * Return the respective variable
 */
export function getSerpiusEndpoint() {
    // "https://qpools.serpius.com/weight_status.json";
    return "https://qpools.serpius.com/weight_status_devnet.json";
}

export function getPoolsContainingLpToken(lpTokenMint: PublicKey) {
    let allPools: ExplicitSaberPool[] = [];
    getAllPools()["saberLiquidityPools"].map((x: ExplicitSaberPool) => {

        // These are not explicit token types, these are saber token types
        if (lpTokenMint.toString() === x.lpToken.address.toString()) {
            allPools.push(x);
        }

    })
    return allPools;
}

export function saberPoolLpToken2poolAddress(poolMint: PublicKey): PublicKey {
    let all = getPoolsContainingLpToken(poolMint);
    // Pick the first instance
    console.assert(all.length == 1);
    return new PublicKey(all[0].swap.config.swapAccount);
    // Take first instance lol
    // Make a simple lookup
}

// TODO: Write batch functions for all these
export function getIconFromToken(tokenMint: PublicKey) {

    let out: string = "";
    getAllTokens()["tokens"].map((x: ExplicitToken) => {
        if (x.address === tokenMint.toString()) {
            out = x.logoURI
        }
    })
    if (!out) {
        console.log("WARNING: URI does not exist!");
    }
    return out;
}
