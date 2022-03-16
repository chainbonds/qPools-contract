import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {getMarinadeSolPda, getPortfolioPda, getPositionPda} from "../../types/account/pdas";
import * as anchor from "@project-serum/anchor";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk'

export async function approvePositionWeightMarinade(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    init_sol_amount: u64,
    index: number,
    weight: BN,
): Promise<TransactionInstruction> {
    console.log("#approvePositionWeightMarinade");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let [ownerSolPda, bumpMarinade] = await getMarinadeSolPda(owner, solbondProgram);

    let ix: TransactionInstruction = await solbondProgram.instruction.approvePositionWeightMarinade(
        portfolioBump,
        bumpPosition,
        new BN(bumpMarinade),
        new BN(weight),
        new BN(init_sol_amount),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPda,
                ownerSolPda: ownerSolPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##approvePositionWeightMarinade");
    return ix;
}

// TODO: Marinade state can also prob be retrieved from somewhere (?)
export async function createPositionMarinade(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number,
    marinadeState: MarinadeState
): Promise<TransactionInstruction> {
    console.log("#createPositionMarinade");

    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let [ownerSolPda, bumpMarinade] = await getMarinadeSolPda(owner, solbondProgram);

    // TODO: Replace this with the getAccountForMintAndPDA function
    const pda_msol = await this.getAccountForMintAndPDA(marinadeState.mSolMintAddress, portfolioPda);

    console.log("owner ", owner.toString())
    console.log("positionPDA ", positionPDA.toString())
    console.log("portfolioPDA ", portfolioPda.toString())
    console.log("state ", marinadeState.marinadeStateAddress.toString())
    console.log("msolMInt ", marinadeState.mSolMintAddress.toString())
    let ix: TransactionInstruction = await solbondProgram.instruction.createPositionMarinade(
        portfolioBump,
        bumpPosition,
        new BN(bumpMarinade),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPda,
                state: marinadeState.marinadeStateAddress,
                msolMint: marinadeState.mSolMintAddress,
                liqPoolSolLegPda: await marinadeState.solLeg(),
                liqPoolMsolLeg: marinadeState.mSolLeg,
                liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
                reservePda: await marinadeState.reserveAddress(),
                ownerSolPda: ownerSolPda,
                mintTo: pda_msol,
                msolMintAuthority: await marinadeState.mSolMintAuthority(),
                marinadeProgram: marinadeState.marinadeFinanceProgramId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##createPositionMarinade");
    return ix;
}
