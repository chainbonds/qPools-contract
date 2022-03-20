import {PublicKey} from "@solana/web3.js";
import {BN, Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {bnTo8} from "../../utils";
import assert from "assert";
import {sol} from "easy-spl";

export const SEED = {
    PORTFOLIO_ACCOUNT: "portFolioSeed577",
    POSITION_ACCOUNT_APPENDUM: "UsingPosition359",
    USER_CURRENCY_STRING: "UserCurrency1249",
    USER_MARINADE_SEED: "UserMarinade0039"
}

/**
 * A list of PDAs that we don't really have types / accounts for ...
 */
export async function getMarinadeSolPda(
    owner: PublicKey,
    solbondProgram: Program
): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
        [owner.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.USER_MARINADE_SEED))],
        solbondProgram.programId
    );
}

export async function getPositionPda(
    owner: PublicKey,
    index: number,
    solbondProgram: Program
): Promise<[PublicKey, number]> {
    let indexAsBuffer = bnTo8(new BN(index));
    let [positionPda, positionBump] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))],
        solbondProgram.programId
    );
    return [positionPda, positionBump];
}

export async function getPortfolioPda(
    owner: PublicKey,
    solbondProgram: Program
): Promise<[PublicKey, number]> {
    // assert((owner) === PublicKey);
    console.log("owner: ", typeof owner, owner.toString(), owner);
    console.log("solbondProgramId: ", typeof solbondProgram.programId, solbondProgram.programId.toString(), solbondProgram.programId);
    console.log("SEED.PORTFOLIO_ACCOUNT: ", typeof SEED.PORTFOLIO_ACCOUNT, SEED.PORTFOLIO_ACCOUNT);
    let [portfolioPda, bumpPortfolio] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
        solbondProgram.programId
    )
    return [portfolioPda, bumpPortfolio];
}

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
