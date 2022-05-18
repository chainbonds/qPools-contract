import {DEV_TOKEN_LIST_SABER} from "../../registry/devnet/saber/token-list.devnet";
import {DEV_POOLS_INFO_SABER} from "../../registry/devnet/saber/pools-info.devnet";

import {BN} from "@project-serum/anchor";

import {Cluster, getNetworkCluster} from "../../network";
import {MAINNET_TOKEN_LIST_SABER} from "../../registry/mainnet/saber/token-list.mainnet";
import {MAINNET_POOLS_INFO_SABER} from "../../registry/mainnet/saber/pools-info.mainnet";
import {Connection, PublicKey} from "@solana/web3.js";
import {ExplicitToken} from "../../types/interfacing/ExplicitToken";
import {ExplicitPool} from "../../types/interfacing/ExplicitPool";
import {ExplicitSaberPool} from "../../types/interfacing/ExplicitSaberPool";
import {Protocol, ProtocolType} from "../../types/interfacing/PositionInfo";
import {Registry} from "../../frontend-friendly/registry";
import {CoinGeckoClient} from "../../oracle/coinGeckoClient";


/**
 * Gotta just copy it from the registry ....
 */

export const getSaberTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[];
    if (getNetworkCluster() === Cluster.DEVNET) {
        saberTokenList = DEV_TOKEN_LIST_SABER["tokens"];
    } else if (getNetworkCluster() === Cluster.MAINNET || getNetworkCluster() === Cluster.LOCALNET) {
        // Do a get request from saber ...
        saberTokenList = MAINNET_TOKEN_LIST_SABER["tokens"];
    } else {
        throw Error("Cluster not implemented! getSaberTokens");
    }
    return saberTokenList
}

export const getSaberPools = async  (): Promise<ExplicitPool[]> => {
    console.log("#getSaberPools()");
    // Perhaps here, return the SaberTypes ... which include some more detail on this ...
    let saberPoolList: ExplicitSaberPool[];
    if (getNetworkCluster() === Cluster.DEVNET) {
        saberPoolList = DEV_POOLS_INFO_SABER.map((x: any) => {
            x.poolType = ProtocolType.DEXLP;
            x.protocol = Protocol.saber;
            return x;
        });
    } else if (getNetworkCluster() === Cluster.MAINNET || getNetworkCluster() === Cluster.LOCALNET) {
        // Do a get request from saber ...
        saberPoolList = MAINNET_POOLS_INFO_SABER.map((x: any) => {
            x.poolType = ProtocolType.DEXLP;
            x.protocol = Protocol.saber;
            return x;
        });
    } else {
        throw Error("Cluster not implemented! getSaberTokens");
    }
    console.log("##getSaberPools()");
    return saberPoolList;
}


export async function saberPoolTokenPrice(connection: Connection, lpMint: PublicKey, registry: Registry, coingeckoClient: CoinGeckoClient): Promise<number> {

    // map pool address to exchange
    const swap: ExplicitSaberPool | null = await registry.getSaberPoolContainingLpToken(lpMint);
    if (!swap) {
        throw Error("The provided lpMint is not a saber LP token ... " + lpMint.toString());
    }
    const token_reserve_a = swap.swap.state.tokenA.reserve;
    const tokenMintA = swap.swap.state.tokenA.mint;
    const token_reserve_b = swap.swap.state.tokenB.reserve;
    const tokenMintB = swap.swap.state.tokenB.mint;
    const token_a_bal = await connection.getBalance(new PublicKey(token_reserve_a))
    const token_b_bal = await connection.getBalance(new PublicKey(token_reserve_b))

    let tokenAUsdcBalance = await coingeckoClient.multiplyAmountByUSDPrice(token_a_bal, tokenMintA);
    let tokenBUsdcBalance = await coingeckoClient.multiplyAmountByUSDPrice(token_b_bal, tokenMintB);
    const lp_supply = (await connection.getTokenSupply(lpMint)).value.uiAmount!;
    const price = (tokenAUsdcBalance + tokenBUsdcBalance)/lp_supply
    return price;
}

export async function saberMultiplyAmountByUSDPrice (x: number, mint: PublicKey, connection: Connection, registry: Registry, coingeckoClient: CoinGeckoClient) : Promise<number> {
    let exchangeRate = await saberPoolTokenPrice(connection, mint, registry, coingeckoClient);
    return x * exchangeRate;
}


/*export const getSaberPrice = async (
    connection: Connection,
    saberSwap: StableSwap,
    tokenMint: PublicKey,
    withdrawAmount: TokenAmount,
): Promise<number> => {
    console.log("#getSaberPrice()");

    // // TODO: As input, take in a pool-element
    // // Also an amount ...
    //
    // // Translate this TokenAmount to the saber token amount type ..
    //
    // // Take connection from somewhere ...
    // let swapAccount = saberSwap.config.swapAccount;
    // let exchangeInfo: IExchangeInfo = await loadExchangeInfoFromSwapAccount(connection, swapAccount);
    //
    // let lpToken: PublicKey = saberSwap.state.poolTokenMint;
    //
    // // Get the spl token info from the lpToken from the registry ...
    // // Maybe just get the info from the registry ...
    // // Get this stuff from the registry. we can also specify these items through ExplicitSaberPool
    // let saberLpTokenInfo: SaberTokenInfo = lpToken;
    // let saberLpToken: SaberToken = new SaberToken(saberLpTokenInfo);
    // let withdrawSaberAmount = new SaberTokenAmount(saberLpToken, withdrawAmount);
    //
    // // Figure out which one you want to estimate the price for ...
    // // Also write a short assets onto which one you wanna get the token amount for ...
    // // I.e. token must exist as one of the two exchange tokens ..
    // calculateEstimatedWithdrawOneAmount({
    //     exchange: exchangeInfo,
    //     poolTokenAmount: withdrawSaberAmount,
    //     withdrawToken: tokenMint
    // });

    console.log("##getSaberPricee()");
    return 0.
}*/

