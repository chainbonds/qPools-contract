import {DEV_TOKEN_LIST_MARINADE} from "../../registry/devnet/marinade/token-list.devnet";
import {DEV_POOLS_INFO_MARINADE} from "../../registry/devnet/marinade/pools-info.devnet";
import {Protocol, ProtocolType} from "../../types/PositionInfo";
import {ExplicitPool} from "../../types/ExplicitPool";
import {ExplicitToken} from "../../types/ExplicitToken";
import {PublicKey} from "@solana/web3.js";
import {getMarinadeSolMint, getWrappedSolMint} from "../../const";
import {CoinGeckoClient} from "../../oracle/coinGeckoClient";

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

export const getMarinadePriceUSD = async (tokenMint: PublicKey, coinGeckoClient : CoinGeckoClient): Promise<number> => {
    console.log("#getMarinadePrice()");
    let out: number;
    if (tokenMint.equals(getWrappedSolMint()) || tokenMint.equals(getMarinadeSolMint()) ) {
        out = await coinGeckoClient.getPriceFromMint(tokenMint, "usd");
    } else {
        throw Error("This function is reserved for marinade finance. You don't seem to have put in either wrapped SOL, or mSOL, " + tokenMint.toString());
    }
    console.log("##getMarinadePrice()");
    return out;
}
