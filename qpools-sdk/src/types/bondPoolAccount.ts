import {PublicKey} from "@solana/web3.js";

export interface BondPoolAccount {
    generator: PublicKey,

    bondPoolRedeemableMint: PublicKey,
    bondPoolCurrencyTokenMint: PublicKey,
    bondPoolRedeemableTokenAccount: PublicKey,
    bondPoolCurrencyTokenAccount: PublicKey,

    bumpBondPoolAccount: number,
    bumpBondPoolTokenAccount: number,
}

