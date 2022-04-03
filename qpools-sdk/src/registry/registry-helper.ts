// Static class to help with common functionality around registry, etc.
// Could also be implemented as individual functions,
// but it's nice to have some unified accessor
/**
 * This should probably be a class, for the sake of lazy-loading ...
 */
import {PublicKey} from "@solana/web3.js";
import {DEV_PORTFOLIOID_TO_TOKEN} from "./devnet/portfolio-to-pool.devnet";
import {Protocol} from "../types/positionInfo";
import {DEV_WHITELIST_TOKENS} from "./devnet/whitelist-tokens.devnet";
import {getSaberPools, getSaberTokens} from "../instructions/api/saber";
import {getMarinadePools, getMarinadeTokens} from "../instructions/api/marinade";
import {getSolendPools, getSolendTokens} from "../instructions/api/solend";
import {getSplTokenList} from "../instructions/api/spl-token-registry";
import {ExplicitToken} from "../types/ExplicitToken";
import {ExplicitPool} from "../types/ExplicitPool";

// Create interfaces for all getters here for now


/**
 * Fetches everything from the local files. Does not fetch anything from GET requests / online
 */

// Depending on devnet / mainnet, gotta modify these object!
// This is a good function to do it from
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
async function getPortfolioToTokenDict(): Promise<any> {
    return DEV_PORTFOLIOID_TO_TOKEN;
}

export function getWhitelistTokens(): string[] {
    return DEV_WHITELIST_TOKENS;
}

export async function getLogoFromMint(mint: PublicKey): Promise<string> {
    let splTokenList: ExplicitToken[] = await getSplTokenList();
    return splTokenList.filter((x: ExplicitToken) => x.address === mint.toString())[0].logoURI;
}

// Also create one where you get the Logo from the symbol, definitely much more error-prone, but useful when on devnet
export async function getLogoFromSymbol(symbol: string): Promise<string> {
    let splTokenList: ExplicitToken[] = await getSplTokenList();
    return splTokenList.filter((x: ExplicitToken) => x.symbol === symbol)[0].logoURI;
}

// Write a function here which applies the pyth oracle ...
// TODO: Replace this by a proper Pyth Provider, or pyth function ...
export const multiplyAmountByPythprice = async (x: number, mint: PublicKey) => {
    let out: number;
    console.log("Mint is: ", mint.toString());
    console.log("Number in: ", x);
    if (mint.equals(new PublicKey("NativeSo11111111111111111111111111111111111"))) {
        console.log("Assuming SOL...");
        out = x * 120.00;
    } else if (mint.equals(new PublicKey("So11111111111111111111111111111111111111112"))) {
        console.log("Assuming wrapped SOL...");
        out = x * 115.49;
    } else if (mint.equals(new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"))) {
        console.log("Assuming mSOL...");
        out = x * 115.49;
    } else {
        console.log("Assuming USDC...");
        out = x;
    }
    console.log("Number out is: ", out);
    return out
}


/**
 * An artificial Address created by us, which maps to native SOL
 * Whenever you come across this address as a mint, you must create a case-distinction, and send actual SOL
 *
 * This address is identical in devnet, as well as mainnet
 */
export function getNativeSolMint(): PublicKey {
    return new PublicKey("NativeSo11111111111111111111111111111111111");
}

// TODO: Replace by Registry Class
export function getMarinadeSolMint(): PublicKey {
    return new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
}

// TODO: Replace by Registry Class
export function getWrappedSolMint(): PublicKey {
    return new PublicKey("So11111111111111111111111111111111111111112");
}

// TODO: Replace by registry class
async function getAllTokens(): Promise<ExplicitToken[]> {
    let saberTokenList: ExplicitToken[] = await getSaberTokens();
    let marinadeTokenList: ExplicitToken[] = await getMarinadeTokens();
    let solendTokenList: ExplicitToken[] = await getSolendTokens();
    return [
        ...saberTokenList,
        ...marinadeTokenList,
        ...solendTokenList
    ]
}

// TODO: Replace by registry class
async function getAllPools(): Promise<any> {
    let saberPoolList: ExplicitPool[] = await getSaberPools();
    let marinadePoolList: ExplicitPool[] = await getMarinadePools();
    let solendPoolList: ExplicitPool[] = await getSolendPools();
    return [
        ...saberPoolList,
        ...marinadePoolList,
        ...solendPoolList
    ];
}


export function getSaberStableSwapProgramId(): PublicKey {
    // Probably also replace this with a hardcode.
    // We should aim to remove all occurrences of MOCK.DEV to this file, and then delete them indefinitely
    // return new PublicKey(MOCK.DEV.stableSwapProgramId);
    return new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
}

/**
 * From a public key representing the Token's Mint, retrieve the Token Object
 * @param tokenMint
 */
// Replaced by registry function
export async function getToken(tokenMint: PublicKey): Promise<ExplicitToken | null> {
    let out: ExplicitToken | null = null;
    (await getAllTokens()).map((x: ExplicitToken) => {
        if (x.address === tokenMint.toString()) {
            out = x;
        }
    })
    return out;
}

// Already replaced as well ... getPoolByLpToken
export async function getPoolFromLpMint(lpMint: PublicKey): Promise<ExplicitPool> {
    let out: ExplicitPool | null = null;
    console.log("All pools are: ", getAllPools(), lpMint.toString());
    (await getAllPools()).map((x: ExplicitPool) => {
        console.log("x.lpToken.address is: ", x.lpToken.address, lpMint);
        if (x.lpToken.address === lpMint.toString()) {
            out = x;
        }
    });
    if (!out) {
        throw Error("Explicit Pool is Zero " + lpMint)
    }
    return out;
}

// TODO: Replace this file by a function that translates serpius id's to pools in this registry ...
export async function getPoolFromSplStringId(splStringId: string): Promise<ExplicitPool> {
    let out: ExplicitPool | null = null;
    console.log("All pools are: ", await getAllPools(), splStringId);
    (await getAllPools()).map((x: ExplicitPool) => {
        console.log("x.name is: ", x.name, splStringId);
        if (x.name === splStringId) {
            out = x;
        }
    });
    if (!out) {
        throw Error("Explicit Pool is Zero " + splStringId)
    }
    return out;
}

/**
 * Get a list of all pools that is working with a mint of the provided token
 * @param tokenMint
 */
// TODO: Should be replaced by getPoolByInputTokens in the Registry ...
export async function getPoolsContainingToken(tokenMint: PublicKey) {
    let allPools: ExplicitPool[] = [];
    (await getAllPools()).map((pool: ExplicitPool) => {
        pool.tokens.map((poolToken: ExplicitToken) => {
            if (tokenMint.toString() === poolToken.address.toString()) {
                allPools.push(pool);
            }
        })
    })
    return allPools;
}


// TODO: Replace this by the Registry class
export function getSerpiusEndpoint(): string {
    // "https://qpools.serpius.com/weight_status.json";
    // return "https://qpools.serpius.com/weight_status_devnet.json";
    // return "https://qpools.serpius.com/weight_status_devnet_v2.json";
    return "https://qpools.serpius.com/weight_status_devnet_solend_v2.json";
}

// TODO: Replace this by the Registry class
export async function getSaberPoolsContainingLpToken(lpTokenMint: PublicKey): Promise<ExplicitPool[]> {
    let allPools: ExplicitPool[] = [];
    (await getAllPools()).map((x: ExplicitPool) => {
        // These are not explicit token types, these are saber token types
        if (
            lpTokenMint.toString() === x.lpToken.address.toString() &&
            x.protocol === Protocol.saber
        ) {
            allPools.push(x);
        }
    })
    return allPools;
}

// TODO: Replace this by the Registry class
export async function saberPoolLpToken2poolAddress(poolMint: PublicKey): Promise<PublicKey> {
    let all: any[] = await getSaberPoolsContainingLpToken(poolMint);
    console.assert(all.length > 0);
    return new PublicKey(all[0].swap.config.swapAccount);
}

// TODO: Write batch functions for all these
// TODO: Replace this by the Registry class
export async function getIconFromToken(tokenMint: PublicKey) {

    let out: string = "";
    console.log("All tokens: ", await getAllTokens(), tokenMint.toString());
    (await getAllTokens()).map((x: ExplicitToken) => {
        if (x.address === tokenMint.toString()) {
            out = x.logoURI
        }
    })
    if (!out) {
        console.log("WARNING: URI does not exist!");
    }
    return out;
}
