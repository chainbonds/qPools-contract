import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN, Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../../seeds";
import {bnTo8} from "../../utils";

export async function getUserCurrencyAccount(owner: PublicKey, index: number, solbondProgram: Program) {
    throw Error("getUserCurrencyAccount not Implemented Yet!");
}

export interface UserCurrencyAccount {
    owner: PublicKey,
    bump: number,
    initial_amount: u64,
    withdraw_amount: u64,
    mint: PublicKey,
}
