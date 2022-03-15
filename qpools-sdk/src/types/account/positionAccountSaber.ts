import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN, Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../../seeds";
import {bnTo8} from "../../utils";

export async function getPositionPda(owner: PublicKey, index: number, solbondProgram: Program) {
    let indexAsBuffer = bnTo8(new BN(index));
    return PublicKey.findProgramAddress(
        [owner.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))],
        solbondProgram.programId
    );
}

export interface PositionAccountSaber {
    portfolioPda: PublicKey,
    // Pool Address is the Pool's Mint
    poolAddress: PublicKey,
    isFulfilled: boolean,
    isRedeemed: boolean,
    redeemApproved: boolean,
    index: number,
    weight: u64,
    max_initial_token_a_amount: u64,
    max_initial_token_b_amount: u64,
    min_mint_amount: u64,
    pool_token_amount: u64,
    minimum_token_amount_out: u64,
    bump: number,
    timestamp: BN,
}
