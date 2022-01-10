import {Pair} from "@invariant-labs/sdk";
import {PublicKey} from "@solana/web3.js";

export class QPair extends Pair {

    currencyMint: PublicKey | undefined;

    setCurrencyMint(_currencyMint: PublicKey) {
        this.currencyMint = _currencyMint;
    }

}