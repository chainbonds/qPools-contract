import {DEVNET_TOKENS_COINGECKO} from "../../registry/tokenCoinGeckoMapping";
import {CoinGeckoClient} from "../../oracle/coinGeckoClient";
import {saberMultiplyAmountByUSDPrice} from "./saber";
import {PublicKey} from "@solana/web3.js";
import {min} from "@solendprotocol/solend-sdk/dist/examples/common";


export const getCoinGeckoList= () => {
    return DEVNET_TOKENS_COINGECKO
}

