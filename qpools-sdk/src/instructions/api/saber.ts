import {DEV_TOKEN_LIST_SABER} from "../../registry/devnet/saber/token-list.devnet";
import {DEV_POOLS_INFO_SABER} from "../../registry/devnet/saber/pools-info.devnet";
import {Protocol, ProtocolType} from "../../types/PositionInfo";
import {ExplicitToken} from "../../types/ExplicitToken";
import {ExplicitPool} from "../../types/ExplicitPool";
import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import * as spl from 'easy-spl'
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


export const getSaberLpTokens = async (): Promise<ExplicitToken[]> => {
    let saberTokenList: ExplicitToken[] = DEV_POOLS_INFO_SABER["lpToken"];
    return saberTokenList;
}

export const saberPoolTokenToSwap = async (): Promise<any> => {
 
    let map = DEV_POOLS_INFO_SABER["swap"]["state"]["poolTokenMint"].map((x,i) => [
        x,DEV_POOLS_INFO_SABER["swap"][i]
    ])
    return map

}



export async function saberPoolTokenPrice(connection: Connection, lpMint: PublicKey): Promise<number> {
    // map pool address to exchange 
    const thisSwap = await saberPoolTokenToSwap[lpMint.toString()]
    const token_reserve_a = thisSwap["state"]["tokenA"]["reserve"]
    const token_reserve_b = thisSwap["state"]["tokenB"]["reserve"]
    const token_a_bal = await connection.getBalance(new PublicKey(token_reserve_a))
    const token_b_bal = await connection.getBalance(new PublicKey(token_reserve_b))

    const lp_supply = (await connection.getTokenSupply(lpMint)).value.uiAmount
    const price = (token_a_bal+ token_b_bal)/lp_supply
    return price;

}


