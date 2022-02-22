// Static class to help with common functionality around registry, etc.
// Could also be implemented as individual functions,
// but it's nice to have some unified accessor
import {Connection, PublicKey} from "@solana/web3.js";
import {POOLS_INFO} from "./devnet/pools-info.devnet";
import {TOKEN_LIST} from "./devnet/token-list.devnet";
import {PORTFOLIOID_TO_TOKEN} from "./devnet/portfolio-to-pool.devnet";
import {token} from "easy-spl";
import {StableSwap} from "@saberhq/stableswap-sdk";
import {parsePriceData, PriceData} from "@pythnetwork/client";

// Create interfaces for all getters here for now

export interface PortfolioPair {
    portfolioApiId: string,
    poolAddress: string
}

export interface PythStruct {
    price?: string,
    product?: string
}

export interface ExplicitToken {
    address: string,
    chainId: number
    decimals: number
    extensions: any,
    logoURI: string
    name: string,
    symbol: string,
    pyth: PythStruct
}

export interface ExplicitSaberPool {
    id: string,
    name: string,
    tokens: any[],  // Should only be used to get the addresses, nothing more // Or we should update it on-the-fly
    currency: string,
    lpToken: any,  // Again, should be updated on the fly
    plotKey: string,
    swap: StableSwap,
    quarry: string,
}

/**
 * Fetches everything from the local files. Does not fetch anything from GET requests / online
 */
class RegistryHelper {

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
     * Make a case distinction if its a devnet or mainnet token
     */
    public static getPortfolioToTokenDict() {
        return PORTFOLIOID_TO_TOKEN;
    }
    public static getAllTokens() {
        return TOKEN_LIST;
    }
    public static getAllPools() {
        return POOLS_INFO;
    }

    public static getTokenFromPortfolioId(portfolioId: String): PublicKey | null {
        let out: PublicKey | null = null;
        this.getPortfolioToTokenDict()["pairs"].map((x: PortfolioPair) => {
            if (portfolioId === x.portfolioApiId) {
                out = new PublicKey(x.poolAddress);
            }
        })
        return out;
    }

    // The other way around is not needed
    // public static getPortfolioIdFromToken() {}

    /*
        Getting a single token, given the token mint
    */
    public static getToken(tokenMint: PublicKey): ExplicitToken | null {
        let out: ExplicitToken | null = null;
        this.getAllTokens()["tokens"].map((x: ExplicitToken) => {
            if (x.address === tokenMint.toString()) {
                out = x;
            }
        })
        return out;
    }

    public static getPool(poolAddress: PublicKey): ExplicitSaberPool | null {
        let out: ExplicitSaberPool | null = null;
        this.getAllPools()["tokens"].map((x: ExplicitSaberPool) => {
            if (x.swap.config.swapAccount.equals(poolAddress)) {
                out = x;
            }
        })
        return out;
    }

    public static async getTokenPythToUsdcPrice(
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


}

