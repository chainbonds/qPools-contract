
// Write a function here which applies the pyth oracle ...
// TODO: Replace this by a proper Pyth Provider, or pyth function ...
import {PublicKey} from "@solana/web3.js";

export const multiplyAmountByPythprice = async (x: number, mint: PublicKey) => {
    let out: number;
    console.log("Mint is: ", mint.toString());
    console.log("Number in: ", x);
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
    }
    console.log("Number out is: ", out);
    return out
}