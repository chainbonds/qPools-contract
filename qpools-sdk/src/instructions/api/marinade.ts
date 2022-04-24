import {DEV_TOKEN_LIST_MARINADE} from "../../registry/devnet/marinade/token-list.devnet";
import {DEV_POOLS_INFO_MARINADE} from "../../registry/devnet/marinade/pools-info.devnet";


import {CoinGeckoClient} from "../../oracle/coinGeckoClient";

import {Cluster, getNetworkCluster} from "../../network";
import {MAINNET_TOKEN_LIST_MARINADE} from "../../registry/mainnet/marinade/token-list.mainnet";
import {MAINNET_POOLS_INFO_MARINADE} from "../../registry/mainnet/marinade/pools-info.mainnet";
import {PublicKey} from "@solana/web3.js";
import {getMarinadeSolMint, getWrappedSolMint} from "../../const";
import {ExplicitToken} from "../../types/interfacing/ExplicitToken";
import {ExplicitPool} from "../../types/interfacing/ExplicitPool";
import {Protocol, ProtocolType} from "../../types/interfacing/PositionInfo";


export const getMarinadeTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[];
    if (getNetworkCluster() === Cluster.DEVNET) {
        saberTokenList = DEV_TOKEN_LIST_MARINADE["tokens"];
    } else if (getNetworkCluster() === Cluster.MAINNET) {
        saberTokenList = MAINNET_TOKEN_LIST_MARINADE["tokens"];
    } else {
        throw Error("Cluster not implemented! getMarinadeTokens");
    }
    return saberTokenList
}

export const getMarinadePools = async  (): Promise<ExplicitPool[]> => {
    console.log("#getMarinadePools()");
    let marinadePoolList: ExplicitPool[];
    if (getNetworkCluster() === Cluster.DEVNET) {
        marinadePoolList = DEV_POOLS_INFO_MARINADE.map((x: any) => {
            x.poolType = ProtocolType.Staking;
            x.protocol = Protocol.marinade;
            return x;
        });
    } else if (getNetworkCluster() === Cluster.MAINNET) {
        marinadePoolList = MAINNET_POOLS_INFO_MARINADE.map((x: any) => {
            x.poolType = ProtocolType.Staking;
            x.protocol = Protocol.marinade;
            return x;
        });
    } else {
        throw Error("Cluster not implemented! getMarinadePools");
    }
    console.log("##getMarinadePools()");
    return marinadePoolList;
}


export const getMarinadePriceUSD = async (tokenMint: PublicKey, coinGeckoClient : CoinGeckoClient): Promise<number> => {
    console.log("#getMarinadePrice()");
    let out: number;
    if (tokenMint.equals(getWrappedSolMint()) || tokenMint.equals(getMarinadeSolMint()) ) {
        out = await coinGeckoClient.getPriceFromMint(tokenMint);

    } else {
        throw Error("This function is reserved for marinade finance. You don't seem to have put in either wrapped SOL, or mSOL, " + tokenMint.toString());
    }
    console.log("##getMarinadePrice()");
    return out;
}