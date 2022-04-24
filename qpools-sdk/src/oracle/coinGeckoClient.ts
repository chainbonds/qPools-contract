import {PublicKey} from '@solana/web3.js'
import {Registry} from "../frontend-friendly/registry";
import axios from "axios";


interface PriceInterface {
    usd: number,
    eur: number,
    chf: number
}

export class CoinGeckoClient {

    coinGeckoData: Map<string, PriceInterface> | null;
    initialized: boolean;
    registry : Registry;
    vs_currencies = ["usd", "eur", "chf"]

    constructor(registery : Registry) {
        this.registry = registery;
        this.initialized = false;
        this.coinGeckoData = null;
    }


    async getPriceFromMint(mint : PublicKey) {
        let coinGeckoId  = this.registry.getCoinGeckoMapping().get(mint.toString());
        if (coinGeckoId == undefined){
            console.log("Mint is not registered in the registry for coingecko", mint.toString())
            return 0;
        } else {
            let data = await this.getDataForAllRegisteredTokens();
            if (data && data.has(coinGeckoId)){
                return data.get(coinGeckoId)!.usd;
            }
            else {
                console.log("For this mint there is no price in the coingecko query", mint.toString())
                return 0;
            }
        }

    }

    /**
     * Calculates the value of the token for a given amount.
     * @param x
     * @param mint
     */
    async multiplyAmountByUSDPrice (x: number, mint: PublicKey) : Promise<number> {
        let res = this.getPriceFromMint(mint).then(price => {
            return price*x
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
        if(this.initialized && this.coinGeckoData != null){
            console.log("Price already in cache")
            return this.coinGeckoData;
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
            this.coinGeckoData = result.data;
        })
            .catch( error => {
                console.error('There was an error! Fixing the prices to 0 ', error);
                //TODO : change the hardcoded initialization below
                this.coinGeckoData = new Map<string, PriceInterface>(
                    [
                        ["msol", { usd: 0, eur: 0, chf: 0 }],
                        ["solana", { usd: 0, eur: 0, chf: 0 }],
                        ["usdc", { usd: 0, eur: 0, chf: 0 }],
                        ["wsol", { usd: 0, eur: 0, chf: 0 }]
                    ]
                )}
            );

        return this.coinGeckoData

    }

}