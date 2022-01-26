import {PublicKey} from "@solana/web3.js";

export class QPair {

    public tokenX: PublicKey;
    public tokenY: PublicKey;
    currencyMint: PublicKey | undefined;

    constructor(first: PublicKey, second: PublicKey) {
        if (first.equals(second)) {
            throw new Error('Pair must contain two unique public keys')
        }

        if (first.toString() < second.toString()) {
            this.tokenX = first
            this.tokenY = second
        } else {
            this.tokenX = second
            this.tokenY = first
        }
    }

    setCurrencyMint(_currencyMint: PublicKey) {
        this.currencyMint = _currencyMint;
    }

}