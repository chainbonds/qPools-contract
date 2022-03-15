import {PublicKey} from "@solana/web3.js";
import {u64} from "@solana/spl-token";
import {BN, Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../../seeds";
import {bnTo8} from "../../utils";

export async function getUserCurrencyPda(
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint: PublicKey
): Promise<[PublicKey, number]> {
    // throw Error("getUserCurrencyAccount not Implemented Yet!");
    let [currencyPDA, bumpCurrency] = await PublicKey.findProgramAddress(
        [owner.toBuffer(),
            currencyMint.toBuffer() ,
            Buffer.from(anchor.utils.bytes.utf8.encode(SEED.USER_CURRENCY_STRING))
        ],
        solbondProgram.programId
    );
    return [currencyPDA, bumpCurrency]
}

export interface UserCurrencyAccount {
    owner: PublicKey,
    bump: number,
    initial_amount: u64,
    withdraw_amount: u64,
    mint: PublicKey,
}
