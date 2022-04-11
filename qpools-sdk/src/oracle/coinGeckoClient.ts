import { Commitment, Connection, PublicKey, Cluster } from '@solana/web3.js'
import {PythHttpClient, getPythProgramKeyForCluster} from '@pythnetwork/client'
import {PythHttpClientResult} from "@pythnetwork/client/lib/PythHttpClient";
import {Registry} from "../frontend-friendly/registry";
import fetch from "node-fetch";
import {BN, Provider} from "@project-serum/anchor";
import {multiplyAmountByPythprice} from "../instructions/pyth/multiplyAmountByPythPrice";
import axios from "axios";
export class CoinGeckoClient {

    static coinGeckoData;
    registry : Registry;
    vs_currencies = ["usd", "eur", "chf"]

    constructor() {
        this.registry = new Registry();
    }


    async getPriceFromMint (mint : PublicKey, vs_currency :string){
        let coinGeckoId = this.registry.getCoinGeckoMapping().get(mint.toString())
        let data = await this.getDataForAllRegisteredTokens()
        return data[coinGeckoId][vs_currency];
    }

    async multiplyAmountByUSDPrice (x: number, mint: PublicKey) : Promise<BN> {
        let res = this.getPriceFromMint(mint, "usd").then(price => {
            return new BN(x).mul(new BN(price*100)).div(new BN(100))
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
        if(CoinGeckoClient.coinGeckoData != null){
            console.log("I was here")
            return CoinGeckoClient.coinGeckoData;
        }
        let priceEndpoint : string = "https://api.coingecko.com/api/v3/simple/price?"

        let coinGeckoMapping : Map<string,string> = this.registry.getCoinGeckoMapping();
        let geckoIds = Array.from(coinGeckoMapping.values());
        let query_Ids = "ids=".concat(this.arrayToQueryForm(geckoIds))
        let query_vsCurrency = "vs_currencies=".concat(this.arrayToQueryForm(this.vs_currencies))
        let query = priceEndpoint.concat(query_Ids).concat("&").concat(query_vsCurrency)
        console.log(query)
        await axios.get<any>(query).then(result => { console.log(result.data); CoinGeckoClient.coinGeckoData = result.data})
        //console.log(this.coinGeckoData)
        return CoinGeckoClient.coinGeckoData

    }

}