
// Write a function here which applies the pyth oracle ...
// TODO: Replace this by a proper Pyth Provider, or pyth function ...
import {PublicKey} from "@solana/web3.js";
import {PythProvider} from "../../frontend-friendly/pyth-provider";
import {Registry} from "../../frontend-friendly/registry";
import {BN, Provider} from '@project-serum/anchor';

export const multiplyAmountByPythprice = async (x: number, mint: PublicKey) => {

    //TODO : use the function in pyth provider
    let pythProvider = new PythProvider()
    let price = await pythProvider.getPriceFromMint(mint);
    return x * price ;

    /*console.log("Number in: ", x);
    if (mint.equals(new PublicKey("NativeSo11111111111111111111111111111111111"))) {
        console.log("Assuming SOL...");
        out = x * 120.00;
    } else if (mint.equals(new PublicKey("So11111111111111111111111111111111111111112"))) {
        console.log("Assuming wrapped SOL...");
        out = x * 115.49;
    } else if (mint.equals(new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"))) {
        console.log("Assuming mSOL...");
        out = x * 115.49;
    } else {
        console.log("Assuming USDC...");
        out = x;
    }*/
}