import {Pair} from "@invariant-labs/sdk";
import {PublicKey} from "@solana/web3.js";
import {FeeTier} from "@invariant-labs/sdk/lib/market";
import {feeToTickSpacing} from "@invariant-labs/sdk/lib/utils";

export class QPair extends Pair {

    currencyMint: PublicKey;

    setCurrencyMint(_currencyMint: PublicKey) {
        this.currencyMint = _currencyMint;

        // Make currency mint always the first token
        if (_currencyMint.equals(this.tokenX)) {
            return
        } else if (_currencyMint.equals(this.tokenY)) {
            // flip in this case
            const swap = this.tokenX;
            this.tokenX = new PublicKey(this.tokenY.toString());
            this.tokenY = new PublicKey(swap.toString());
        } else {
            throw Error("Mint does not equal either!");
        }
    }

}