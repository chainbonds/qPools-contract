/**
 * A bunch of logic to make loading objects more efficient
 */
import {ExplicitToken} from "../types/ExplicitToken";
import {PublicKey} from "@solana/web3.js";
import {getSaberPools, getSaberTokens} from "../instructions/api/saber";
import {getMarinadePools, getMarinadeTokens} from "../instructions/api/marinade";
import {getSolendPools, getSolendTokens} from "../instructions/api/solend";
import {ExplicitPool} from "../types/ExplicitPool";
import {Protocol} from "../types/positionInfo";
import {ExplicitSaberPool} from "../../lib/registry/registry-helper";

export class Registry {

    // Could perhaps be a more efficient Data Structure?
    // Better to have some memory instead of computation here
    splTokenList: ExplicitToken[] = [];
    protocolTokenList: ExplicitToken[] = [];
    protocolPoolList: ExplicitPool[] = [];

    // Maybe we should just have a map indexed by the lp mint address.
    // If the lp mint address does not conform, then we need to search for a separate one.
    productListIndexedByInputTokenMint: Map<string, ExplicitPool[]> = new Map<string, ExplicitPool[]>();
    productListIndexedByLpTokenMint: Map<string, ExplicitPool> = new Map<string, ExplicitPool>();
    tokenIndexedByTokenMint: Map<string, ExplicitToken> = new Map<string, ExplicitToken>();

    nativeSolMint: PublicKey = new PublicKey("NativeSo11111111111111111111111111111111111");
    wrappedSolMint: PublicKey = new PublicKey("So11111111111111111111111111111111111111112");
    serpiusEndpoint: string = "https://qpools.serpius.com/weight_status_devnet_solend_v2.json";

    constructor() {
    }

    async initializeRegistry(): Promise<any> {
        await this.getAllTokens();
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
        if (!this.protocolTokenList) {
            let saberTokenList: ExplicitToken[] = await getSaberTokens();
            let marinadeTokenList: ExplicitToken[] = await getMarinadeTokens();
            let solendTokenList: ExplicitToken[] = await getSolendTokens();
            this.protocolTokenList = [
                ...saberTokenList,
                ...marinadeTokenList,
                ...solendTokenList
            ]
        }
        return this.protocolTokenList;
    }

    async getAllPools(): Promise<ExplicitPool[]> {
        if (!this.protocolPoolList) {
            let saberPoolList: ExplicitPool[] = await getSaberPools();
            let marinadePoolList: ExplicitPool[] = await getMarinadePools();
            let solendPoolList: ExplicitPool[] = await getSolendPools();
            this.protocolPoolList = [
                ...saberPoolList,
                ...marinadePoolList,
                ...solendPoolList
            ];
        }
        return this.protocolPoolList;
    }

    /**
     * Given a set of input tokens, figure out which pools you can technically assign this to.
     * For this, we should create a separate map, that maps from input token, to pool
     *
     * For each key in this map, we store an array of protocols (and thus also pools),
     * that the user is able to deposit to
     *
     */
    async createIndexInputTokenToPoolList() {
        if (this.productListIndexedByInputTokenMint.size > 0) {
            return;
        }

        let out: Map<string, ExplicitPool[]> = new Map<string, ExplicitPool[]>();
        this.protocolPoolList.map((currentPool: ExplicitPool) => {
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
        this.productListIndexedByInputTokenMint = out;
    }

    async createIndexTokenMintToToken() {
        if (this.tokenIndexedByTokenMint.size > 0) {
            return;
        }
        let out: Map<string, ExplicitToken> = new Map<string, ExplicitToken>();
        this.protocolTokenList.map((x: ExplicitToken) => {
            let key = x.address;
            let value = x;
            out.set(key, value);
        });
    }

    async createIndexByLpTokenMint() {
        if (this.productListIndexedByLpTokenMint.size > 0) {
            return;
        }
        let out: Map<string, ExplicitPool> = new Map<string, ExplicitPool>();
        this.protocolPoolList.map((x: ExplicitPool) => {
            let key = x.lpToken.address;
            let value = x;
            out.set(key, value);
        });
    }

    async getToken(tokenMint: string): Promise<ExplicitToken | null> {
        if (this.tokenIndexedByTokenMint.has(tokenMint)) {
            return this.tokenIndexedByTokenMint.get(tokenMint);
        } else {
            return null;
        }
    }

    /**
     * Given an input token, get a list of all pools that this token can be deposited into
     * @param inputTokenMint
     */
    async getPoolByInputToken(inputTokenMint: string): Promise<ExplicitPool[]> {
        await this.createIndexInputTokenToPoolList();
        if (this.productListIndexedByInputTokenMint.has(inputTokenMint)) {
            return this.productListIndexedByInputTokenMint.get(inputTokenMint);
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
        await this.createIndexInputTokenToPoolList();
        if (this.productListIndexedByLpTokenMint.has(lpTokenMint)) {
            return this.productListIndexedByLpTokenMint.get(lpTokenMint);
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
        await this.createIndexTokenMintToToken();

        if (this.tokenIndexedByTokenMint.has(tokenMint)) {
            return this.tokenIndexedByTokenMint.get(tokenMint).logoURI;
        } else {
            console.log("WARNING: URI not found!", tokenMint);
            return "";
        }

    }

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
        await this.createIndexByLpTokenMint();
        let tokenMint: string = lpTokenMint.toString();

        if (this.productListIndexedByLpTokenMint.has(tokenMint)) {
            return this.productListIndexedByLpTokenMint.get(tokenMint).filter((x: ExplicitPool) => {
                return (x.lpToken.address === tokenMint && x.protocol === Protocol.saber)
            })[0] as ExplicitSaberPool;
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