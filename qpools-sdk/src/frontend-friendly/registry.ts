/**
 * A bunch of logic to make loading objects more efficient
 */
import {PublicKey} from "@solana/web3.js";
import {getSaberPools, getSaberTokens} from "../instructions/api/saber";
import {getMarinadePools, getMarinadeTokens} from "../instructions/api/marinade";
import {getSolendPools, getSolendTokens} from "../instructions/api/solend";
import {getSplTokenList} from "../instructions/api/spl-token-registry";
import {ExplicitPool, ExplicitSaberPool, ExplicitToken, Protocol} from "../types/interfacing";
import {getWrappedSolMint} from "../const";

export class Registry {

    // Could perhaps be a more efficient Data Structure?
    // Better to have some memory instead of computation here
    // splTokenList: ExplicitToken[] = [];
    protocolTokenList: ExplicitToken[] = [];
    protocolPoolList: ExplicitPool[] = [];

    // Maybe we should just have a map indexed by the lp mint address.
    // If the lp mint address does not conform, then we need to search for a separate one.
    poolListIndexedByInputTokenMint: Map<string, ExplicitPool[]> = new Map<string, ExplicitPool[]>();
    poolListIndexedByLpTokenMint: Map<string, ExplicitPool> = new Map<string, ExplicitPool>();
    poolListIndexedByIdString: Map<string, ExplicitPool> = new Map<string, ExplicitPool>();

    tokenIndexedByTokenMint: Map<string, ExplicitToken> = new Map<string, ExplicitToken>();
    tokenIndexedBySymbol: Map<string, ExplicitToken> = new Map<string, ExplicitToken>();


    // nativeSolMint: PublicKey = new PublicKey("NativeSo11111111111111111111111111111111111");
    // wrappedSolMint: PublicKey = new PublicKey("So11111111111111111111111111111111111111112");
    // TODO: Replace based on mainnet vs devnet ...
    serpiusEndpoint: string = "https://qpools.serpius.com/weight_status_devnet_solend_v2.json";

    userPubkey: PublicKey = getWrappedSolMint();

    constructor() {}

    async setNewPubkey(userPubkey: PublicKey) {
        // Delete all pool indecies and objects, and re-create them on-load ...
        // Right now, only solend has some public key in the constructor
        this.protocolPoolList = [];
        this.poolListIndexedByInputTokenMint = new Map<string, ExplicitPool[]>();
        this.poolListIndexedByLpTokenMint = new Map<string, ExplicitPool>();
        this.poolListIndexedByIdString = new Map<string, ExplicitPool>();

        this.userPubkey = userPubkey;

        // Don't do lazy-loading, fucks up with the UI
        this.getAllTokens();
        this.getAllPools();
        this.getPoolListIndexedByInputTokenMint();
        this.getPoolListIndexedByIdString();
        this.getPoolListIndexedByLpTokenMint();
        this.getTokenIndexedBySymbol();
        this.getTokenIndexedByTokenMint();
    }

    /**
     * Get the serpius API endpoint. Depending on whether we are on mainnet or devnet,
     * Return the respective variable
     * Gotta also make this devnet / mainnet dependent
     */
    getSerpiusEndpoint(): string {
        return this.serpiusEndpoint;
    }

    /**
     * Maybe I should just return the SPL Token list here, depending on whether it's mainnet or devnet
     */
    async getAllTokens(): Promise<ExplicitToken[]> {
        if (this.protocolTokenList.length < 1) {
            console.log("#getAllTokens()");
            console.log("Creating protocolTokenList");
            let saberTokenList: ExplicitToken[] = await getSaberTokens();
            let marinadeTokenList: ExplicitToken[] = await getMarinadeTokens();
            let solendTokenList: ExplicitToken[] = await getSolendTokens();
            this.protocolTokenList = [
                ...saberTokenList,
                ...marinadeTokenList,
                ...solendTokenList
            ]
            // console.log("This protocolTokenList is: ", this.protocolPoolList);
            console.log("##getAllTokens()");
        }
        return this.protocolTokenList;
    }

    async getAllPools(): Promise<ExplicitPool[]> {
        if (this.protocolPoolList.length < 1) {
            console.log("#getAllPools()");
            console.log("Creating protocolPoolList");
            let saberPoolList: ExplicitPool[] = await getSaberPools();
            let marinadePoolList: ExplicitPool[] = await getMarinadePools();
            let solendPoolList: ExplicitPool[] = await getSolendPools(this.userPubkey);
            this.protocolPoolList = [
                ...saberPoolList,
                ...marinadePoolList,
                ...solendPoolList
            ];
            // console.log("This protocolPoolList is: ", this.protocolPoolList);
            console.log("##getAllPools()");
        }
        return this.protocolPoolList;
    }

    // createIndexInputTokenToPoolList()
    /**
     * Given a set of input tokens, figure out which pools you can technically assign this to.
     * For this, we should create a separate map, that maps from input token, to pool
     *
     * For each key in this map, we store an array of protocols (and thus also pools),
     * that the user is able to deposit to
     *
     */
    async getPoolListIndexedByInputTokenMint(): Promise<Map<string, ExplicitPool[]>> {
        console.log("#getPoolListIndexedByInputTokenMint()");
        if (this.poolListIndexedByInputTokenMint.size > 0) {
            return this.poolListIndexedByInputTokenMint;
        }
        console.log("Creating poolListIndexedByInputTokenMint");
        let poolList = await this.getAllPools();
        let out: Map<string, ExplicitPool[]> = new Map<string, ExplicitPool[]>();
        poolList.map((currentPool: ExplicitPool) => {
            currentPool.tokens.map((inputToken: ExplicitToken) => {
                if (out.has(inputToken.address)) {
                    // (1) If the input token was already instantiated, then append the pool if it not already in the list
                    let pools: ExplicitPool[] = out.get(inputToken.address);
                    if (!pools.includes(currentPool)) {
                        let key = inputToken.address;
                        // Append this new pool to the list of all pols under this key
                        let value = [...pools, currentPool];
                        out.set(key, value);
                    }
                } else {
                    // (2) If the input token is not instantiated, then create a new list object with this pool
                    out.set(inputToken.address, [currentPool]);
                }
            });
        })
        this.poolListIndexedByInputTokenMint = out;
        console.log("##getPoolListIndexedByInputTokenMint()");
        return this.poolListIndexedByInputTokenMint;
    }

    // createIndexTokenMintToToken()
    async getTokenIndexedByTokenMint(): Promise<Map<string, ExplicitToken>> {
        console.log("#getTokenIndexedByTokenMint()");
        if (this.tokenIndexedByTokenMint.size > 0) {
            return this.tokenIndexedByTokenMint;
        }
        console.log("Creating tokenIndexedByTokenMint");
        let out: Map<string, ExplicitToken> = new Map<string, ExplicitToken>();
        let tokenList = await this.getAllTokens();
        tokenList.map((x: ExplicitToken) => {
            let key = x.address;
            let value = x;
            out.set(key, value);
        });
        this.tokenIndexedByTokenMint = out;
        console.log("##getTokenIndexedByTokenMint()");
        return this.tokenIndexedByTokenMint;
    }

    // createIndexSymbolToToken()
    async getTokenIndexedBySymbol(): Promise<Map<string, ExplicitToken>> {
        console.log("#getTokenIndexedBySymbol()");
        if (this.tokenIndexedBySymbol.size > 0) {
            return this.tokenIndexedBySymbol;
        }
        console.log("Creating tokenIndexedBySymbol")
        let out: Map<string, ExplicitToken> = new Map<string, ExplicitToken>();
        let tokenList = await this.getAllTokens();
        tokenList.map((x: ExplicitToken) => {
            let key = x.symbol;
            let value = x;
            out.set(key, value);
        });
        this.tokenIndexedBySymbol = out;
        console.log("##getTokenIndexedBySymbol()");
        return this.tokenIndexedBySymbol;
    }

    // createIndexByLpTokenMint()
    async getPoolListIndexedByLpTokenMint(): Promise<Map<string, ExplicitPool>> {
        console.log("#getPoolListIndexedByLpTokenMint()");
        if (this.poolListIndexedByLpTokenMint.size > 0) {
            return this.poolListIndexedByLpTokenMint;
        }
        console.log("Creating this.poolListIndexedByLpTokenMint");
        let out: Map<string, ExplicitPool> = new Map<string, ExplicitPool>();
        let pools = await this.getAllPools();
        pools.map((x: ExplicitPool) => {
            let key = x.lpToken.address;
            let value = x;
            out.set(key, value);
        });
        this.poolListIndexedByLpTokenMint = out;
        console.log("##getPoolListIndexedByLpTokenMint()");
        return this.poolListIndexedByLpTokenMint;
    }

    // createIndexByPoolId()
    async getPoolListIndexedByIdString(): Promise<Map<string, ExplicitPool>> {
        console.log("#getPoolListIndexedByIdString()");
        if (this.poolListIndexedByIdString.size > 0) {
            return this.poolListIndexedByIdString;
        }
        console.log("Creating poolListIndexedByIdString");
        let out: Map<string, ExplicitPool> = new Map<string, ExplicitPool>();
        let pools: ExplicitPool[] = await this.getAllPools();
        console.log("Elloo!");
        pools.map((x: ExplicitPool) => {
            let key = x.id;
            let value = x;
            out.set(key, value);
        });
        this.poolListIndexedByIdString = out;
        console.log("##getPoolListIndexedByIdString()");
        return this.poolListIndexedByIdString;
    }

    /**
     * Get a Token object, given the mint of the token.
     * @param tokenMint
     */
    async getToken(tokenMint: string): Promise<ExplicitToken | null> {
        let map = await this.getTokenIndexedByTokenMint();
        if (map.has(tokenMint)) {
            return map.get(tokenMint);
        } else {
            return null;
        }
    }

    /**
     * Get the logoURI based on the Symbol of the asset
     */
    async getLogoFromSymbol(symbol: string): Promise<string> {
        let map = await this.getTokenIndexedBySymbol();
        if (map.has(symbol)) {
            return map.get(symbol).logoURI
        } else {
            console.log("WARN: This token symbol is not found in the map..: ", symbol);
        }
        let splTokenList: ExplicitToken[] = await getSplTokenList();
        return splTokenList.filter((x: ExplicitToken) => x.symbol === symbol)[0].logoURI;
    }

    /**
     * Given an input token, get a list of all pools that this token can be deposited into
     * @param inputTokenMint
     */
    async getPoolsByInputToken(inputTokenMint: string): Promise<ExplicitPool[]> {
        let map = await this.getPoolListIndexedByInputTokenMint();
        if (map.has(inputTokenMint)) {
            return map.get(inputTokenMint);
        } else {
            console.log("WARN: This token is not input-able into anywhere ...");
            return []
        }
    }

    /**
     * Given an lpMint, get a list of all pools that distribute this lpMint (or this certificate, to be more general)
     * @param lpTokenMint
     */
    async getPoolByLpToken(lpTokenMint: string): Promise<ExplicitPool | null> {
        let map = await this.getPoolListIndexedByLpTokenMint();
        if (map.has(lpTokenMint)) {
            return map.get(lpTokenMint);
        } else {
            console.log("WARN: This token is not input-able into anywhere ...");
            return null
        }
    }

    /**
     * Given any tokenMint, get the logoURI that this tokenUri belongs to
     * @param tokenMint
     */
    async getIconUriFromToken(tokenMint: string): Promise<string> {
        let map = await this.getTokenIndexedByTokenMint();
        if (map.has(tokenMint)) {
            return map.get(tokenMint).logoURI;
        } else {
            console.log("WARNING: URI not found!", tokenMint);
            return "";
        }

    }

    async getPoolFromSplStringId(idString: string): Promise<ExplicitPool | null> {
        console.log("#getPoolFromSplStringId()");
        let map = await this.getPoolListIndexedByIdString();
        let out: ExplicitPool | null;
        if (map.has(idString)) {
            out = map.get(idString);
        } else {
            console.log("WARNING: idString not found!", idString, map);
            out = null;
        }
        console.log("#getPoolFromSplStringId()");
        return out
    }

    // async function getLogoFromMint(mint: PublicKey): Promise<string> {
    //     let splTokenList: ExplicitToken[] = await getSplTokenList();
    //     return splTokenList.filter((x: ExplicitToken) => x.address === mint.toString())[0].logoURI;
    // }

    /**
     *
     * TODO:
     *  I should write these items in separate interface-based classes
     *
     *
     */

    /**
     * Anything specific to Saber
     */
    async getSaberPoolContainingLpToken(lpTokenMint: PublicKey): Promise<ExplicitSaberPool | null> {
        let tokenMint: string = lpTokenMint.toString();
        let map = await this.getPoolListIndexedByLpTokenMint();
        if (map.has(tokenMint)) {
            let out = map.get(tokenMint)
            if (out.protocol === Protocol.saber) {
                return out as ExplicitSaberPool;
            } else {
                return null;
            }
        } else {
            console.log("WARNING: No Pools Found!", tokenMint);
            return null;
        }
    }

    async saberPoolLpToken2poolAddress(lpTokenMint: PublicKey): Promise<PublicKey | null> {
        let pool: ExplicitSaberPool | null = await this.getSaberPoolContainingLpToken(lpTokenMint);
        if (pool) {
            return new PublicKey(pool.swap.config.swapAccount);
        } else {
            return null;
        }
    }

    /**
     * Anything specific to Marinade
     */

    /**
     * Anything specific to solend
     */


}