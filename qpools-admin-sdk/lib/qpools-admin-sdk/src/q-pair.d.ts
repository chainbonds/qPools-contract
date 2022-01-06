import { Pair } from "@invariant-labs/sdk";
import { PublicKey } from "@solana/web3.js";
export declare class QPair extends Pair {
    currencyMint: PublicKey | undefined;
    setCurrencyMint(_currencyMint: PublicKey): void;
}
