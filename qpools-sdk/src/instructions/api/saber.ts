import {DEV_TOKEN_LIST_SABER} from "../../registry/devnet/saber/token-list.devnet";
import {DEV_POOLS_INFO_SABER} from "../../registry/devnet/saber/pools-info.devnet";
import {ExplicitPool, ExplicitSaberPool, ExplicitToken, Protocol, ProtocolType} from "../../types/interfacing";

/**
 * Gotta just copy it from the registry ....
 */

export const getSaberTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[] = DEV_TOKEN_LIST_SABER["tokens"];
    return saberTokenList
}

export const getSaberPools = async  (): Promise<ExplicitPool[]> => {
    // Perhaps here, return the SaberTypes ... which include some more detail on this ...
    let saberPoolList: ExplicitSaberPool[] = DEV_POOLS_INFO_SABER.map((x: any) => {
        x.poolType = ProtocolType.DEXLP;
        x.protocol = Protocol.saber;
        return x;
    });
    return saberPoolList;
}
