import {DEV_TOKEN_LIST_SABER} from "../../registry/devnet/saber/token-list.devnet";
import {ExplicitPool, ExplicitToken} from "../../registry/registry-helper";
import {DEV_POOLS_INFO_SABER} from "../../registry/devnet/saber/pools-info.devnet";
import {Protocol, ProtocolType} from "../../types/positionInfo";

/**
 * Gotta just copy it from the registry ....
 */

export const getSaberTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[] = DEV_TOKEN_LIST_SABER["tokens"];
    return saberTokenList
}

export const getSaberPools = async  (): Promise<ExplicitPool[]> => {
    let saberPoolList: ExplicitPool[] = DEV_POOLS_INFO_SABER.map((x: any) => {
        x.poolType = ProtocolType.DEXLP;
        x.protocol = Protocol.saber;
        return x;
    });
    return saberPoolList;
}
