import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN, Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../../seeds";
import {bnTo8} from "../../utils";

export async function getPositionAccountMarinade(owner: PublicKey, index: number, solbondProgram: Program) {
    throw Error("getPositionAccountMarinade not Implemented Yet!");
}

export interface PositionAccountMarinade {
    portfolio_pda: PublicKey,
    is_fulfilled: boolean,
    is_redeemed: boolean,
    redeem_approved: boolean,
    index: number,
    weight: u64,
    initial_sol_amount: u64,
    msol_out_amount: u64,
    withdraw_sol_amount: u64,
    bump: number,
    timestamp: BN,
}
