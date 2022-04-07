import { Commitment, Connection, PublicKey, Cluster } from '@solana/web3.js'
import {PythHttpClient, getPythProgramKeyForCluster} from '@pythnetwork/client'
import {PythHttpClientResult} from "@pythnetwork/client/lib/PythHttpClient";
import {Registry} from "./registry";
import {Provider} from "@project-serum/anchor";
import {multiplyAmountByPythprice} from "../instructions/pyth/multiplyAmountByPythPrice";
export class PythProvider {

    pythProgramKey : PublicKey;
    cluster : Cluster;
    connection : Connection;
    pythData : PythHttpClientResult;
    registry : Registry;

    //TODO : maybe we should pass connection, cluster, and registry as argument
 constructor() {
     const provider = Provider.local("https://api.devnet.solana.com");
     const connection = provider.connection;
     this.cluster = 'devnet';

     this.pythProgramKey = getPythProgramKeyForCluster(this.cluster);
     this.connection = connection;
     this.registry = new Registry();
    }

    async getData () {
     if(this.pythData != undefined){
        return this.pythData;
     }
     else {
         let pythClient = new PythHttpClient(this.connection, this.pythProgramKey)
         this.pythData = await pythClient.getData()
         return this.pythData;
     }
    }

    pythName (s : string) {
        return "Crypto.".concat(s, '/USD')
    }

    // TODO : Maybe we should throw an exception instead of returning 0 in case of failure.
     async getPrice (asset : string)  {
        //console.log(asset);
        let res = await this.getData().then(data => {
            if(data != undefined) {
                //console.log(data);
                let pythName = this.pythName(asset);
                console.log("Retrieving ", pythName);
                let productInfo = data.productPrice.get(pythName);
                //console.log(productInfo);
                if (productInfo != undefined) {
                    return (productInfo.price);
                } else {
                    return 0;
                }
            }
            else {
                return 0;
            }
        })

         return res;
    }

    async getPriceFromMint (mint : PublicKey){
        let price = this.registry.getTokenSymbolFromMint(mint).then(tokenSymbol => {
            return  this.getPrice(tokenSymbol)
        })
        return price;
    }

    async multiplyAmountByPythprice (x: number, mint: PublicKey) {
     let res = this.getPriceFromMint(mint).then(price => {
         return x * price
     })
        return res;
    }

}