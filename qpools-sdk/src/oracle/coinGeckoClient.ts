import { Commitment, Connection, PublicKey, Cluster } from '@solana/web3.js'
import {PythHttpClient, getPythProgramKeyForCluster} from '@pythnetwork/client'
import {PythHttpClientResult} from "@pythnetwork/client/lib/PythHttpClient";
import {Registry} from "../frontend-friendly/registry";
import fetch from "node-fetch";
import {BN, Provider} from "@project-serum/anchor";
import axios from "axios";
import {min} from "@solendprotocol/solend-sdk/dist/examples/common";
export class CoinGeckoClient {

    static coinGeckoData ;
    static initialized = false;
    registry : Registry;
    vs_currencies = ["usd", "eur", "chf"]

    constructor(registery : Registry) {
        this.registry = registery;
    }


    async getPriceFromMint (mint : PublicKey, vs_currency :string){
        let coinGeckoId = this.registry.getCoinGeckoMapping().get(mint.toString());
        let data = await this.getDataForAllRegisteredTokens();
        if (data.hasOwnProperty(coinGeckoId)){
            return data[coinGeckoId][vs_currency];
        }
        else {
            console.log("For this mint there is no price in the coingecko query", mint.toString())
            return 0;
        }

    }

    /**
     * Calculates the value of the token for a given amount. Maximum value that can be returned is 10^12.
     * @param x
     * @param mint
     */
    async multiplyAmountByUSDPrice (x: number, mint: PublicKey) : Promise<BN> {
        let res = this.getPriceFromMint(mint, "usd").then(price => {
            return new BN(x).mul(new BN(price*(10**8))).div(new BN(10**8))
        })
        return res;
    }


    arrayToQueryForm (array : string[]) {
        if(array.length == 0){
            return ""
        }
        else if(array.length == 1){
            return array[0]
        }
        else{
         return array.slice(1).reduce((acc : string, curr : string) => {
             return acc.concat("%2C").concat(curr) },array[0])
        }
    }

    async getDataForAllRegisteredTokens (){
        if(CoinGeckoClient.initialized && CoinGeckoClient.coinGeckoData != null){
            console.log("Price already in cache")
            return CoinGeckoClient.coinGeckoData;
        }
        let priceEndpoint : string = "https://api.coingecko.com/api/v3/simple/price?"

        let coinGeckoMapping : Map<string,string> = this.registry.getCoinGeckoMapping();
        let geckoIds = Array.from(coinGeckoMapping.values());
        let query_Ids = "ids=".concat(this.arrayToQueryForm(geckoIds))
        let query_vsCurrency = "vs_currencies=".concat(this.arrayToQueryForm(this.vs_currencies))
        let query = priceEndpoint.concat(query_Ids).concat("&").concat(query_vsCurrency)
        console.log(query)
        await axios.get<any>(query).then(result => {
            console.log(result.data);
            CoinGeckoClient.coinGeckoData = result.data;
            CoinGeckoClient.initialized = true ;})
            .catch( error => {
                console.error('There was an error! Fixing the prices to 0 ', error);
                //TODO : change the hardcoded initialization below
                CoinGeckoClient.coinGeckoData = {
                    msol: { usd: 0, eur: 0, chf: 0 },
                    solana: { usd: 0, eur: 0, chf: 0 },
                    'usd-coin': { usd: 0, eur: 0, chf: 0 },
                    'wrapped-solana': { usd: 0, eur: 0, chf: 0 }
                }
            } )

        //console.log(this.coinGeckoData)
        return CoinGeckoClient.coinGeckoData

    }

}