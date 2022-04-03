import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";

export interface UserCurrencyAccount {
    owner: PublicKey,
    bump: number,
    initial_amount: u64,
    withdraw_amount: u64,
    mint: PublicKey,
}
