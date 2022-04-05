import {DEV_TOKEN_LIST_MARINADE} from "../../registry/devnet/marinade/token-list.devnet";
import {DEV_POOLS_INFO_MARINADE} from "../../registry/devnet/marinade/pools-info.devnet";
import {ExplicitPool, ExplicitToken, Protocol, ProtocolType} from "../../types/interfacing";

export const getMarinadeTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[] = DEV_TOKEN_LIST_MARINADE["tokens"];
    return saberTokenList
}

export const getMarinadePools = async  (): Promise<ExplicitPool[]> => {
    let marinadePoolList: ExplicitPool[] = DEV_POOLS_INFO_MARINADE.map((x: any) => {
        x.poolType = ProtocolType.Staking;
        x.protocol = Protocol.marinade;
        return x;
    });
    return marinadePoolList;
}
