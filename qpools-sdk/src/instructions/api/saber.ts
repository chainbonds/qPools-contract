import {DEV_TOKEN_LIST_SABER} from "../../registry/devnet/saber/token-list.devnet";
import {DEV_POOLS_INFO_SABER} from "../../registry/devnet/saber/pools-info.devnet";
import {ExplicitPool, ExplicitSaberPool, ExplicitToken, Protocol, ProtocolType} from "../../types/interfacing";
import {Cluster, getNetworkCluster} from "../../network";

/**
 * Gotta just copy it from the registry ....
 */

export const getSaberTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[];
    if (getNetworkCluster() === Cluster.DEVNET) {
        saberTokenList = DEV_TOKEN_LIST_SABER["tokens"];
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
    } else {
        throw Error("Cluster not implemented! getSaberTokens");
    }
    console.log("##getSaberPools()");
    return saberPoolList;
}
