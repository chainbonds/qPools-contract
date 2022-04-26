import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {getMarinadeSolPda, getPortfolioPda, getPositionPda, getATAPda} from "../../types/account/pdas";
import * as anchor from "@project-serum/anchor";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk'
import {getAccountForMintAndPDADontCreate} from "../../utils";
import {fetchSinglePositionMarinade} from "../fetch/position";
import {PositionAccountMarinade} from "../../types/account/PositionAccountMarinade";

export async function approvePositionWeightMarinade(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    init_sol_amount: BN,
    index: number,
    weight: BN,
): Promise<TransactionInstruction> {
    console.log("#approvePositionWeightMarinade");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let [ownerSolPda, bumpMarinade] = await getMarinadeSolPda(owner, solbondProgram);

    let ix: TransactionInstruction = await solbondProgram.instruction.approvePositionWeightMarinade(
        portfolioBump,
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
    puller: PublicKey,
    index: number,
    marinadeState: MarinadeState
): Promise<TransactionInstruction> {
    console.log("#createPositionMarinade");

    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let [ownerSolPda, bumpMarinade] = await getMarinadeSolPda(owner, solbondProgram);
    let [msolATAPda, bumpMsolAta] = await getATAPda(owner, marinadeState.mSolMintAddress,solbondProgram)
    //const pda_msol = await getAccountForMintAndPDADontCreate(marinadeState.mSolMintAddress, portfolioPda);

    console.log("owner ", owner.toString())
    console.log("puller ", puller.toString())
    console.log("positionPDA ", positionPDA.toString())
    console.log("portfolioPDA ", portfolioPda.toString())
    console.log("state ", marinadeState.marinadeStateAddress.toString())
    console.log("msolMInt ", marinadeState.mSolMintAddress.toString())
    let ix: TransactionInstruction = await solbondProgram.instruction.createPositionMarinade(
        new BN(bumpMarinade),
        new BN(index),
        {
            accounts: {
                puller: puller,
                positionPda: positionPDA,
                portfolioPda: portfolioPda,
                state: marinadeState.marinadeStateAddress,
                msolMint: marinadeState.mSolMintAddress,
                liqPoolSolLegPda: await marinadeState.solLeg(),
                liqPoolMsolLeg: marinadeState.mSolLeg,
                liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
                reservePda: await marinadeState.reserveAddress(),
                ownerSolPda: ownerSolPda,
                mintTo: msolATAPda,
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

export async function approveWithdrawToMarinade(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number,
    marinade_state: MarinadeState
): Promise<Transaction> {
    console.log("#approveWithdrawToMarinade()");
    let [portfolioPda, bumpPortfolio] = await getPortfolioPda(owner, solbondProgram);
    let [msolATAPda, bumpMsolAta] = await getATAPda(owner, marinade_state.mSolMintAddress,solbondProgram)
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);

    let tx: Transaction = new Transaction();

    // Skip this if the marinade position has been fulfilled
    let marinadePosition: PositionAccountMarinade | null = await fetchSinglePositionMarinade(connection, solbondProgram, owner, index);
    if (!marinadePosition) {
        throw Error("This index does not belong to this account! Your index-accounting is wrong " + String(index));
    }
    if (marinadePosition.isFulfilled && !marinadePosition.isFulfilled) {
        throw Error("Something major is off 2");
    }
    if (marinadePosition.redeemApproved) {
        console.log("Marinade is already redeemed!");
        return tx;
    }

    console.log("1111 pda for msol is: ", marinade_state.mSolMintAddress);
    //const pda_msol = await getAccountForMintAndPDADontCreate(marinade_state.mSolMintAddress, portfolioPda);
    const usermsol = await getAccountForMintAndPDADontCreate(marinade_state.mSolMintAddress, owner);

    let ix = await solbondProgram.instruction.approveWithdrawMarinade(
        bumpPortfolio,
        new BN(bumpPosition),
        new BN(bumpMsolAta),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPda,
                msolMint: marinade_state.mSolMintAddress,
                pdaMsolAccount: msolATAPda,
                userMsolAccount: usermsol,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##approveWithdrawToMarinade()");
    tx.add(ix);
    return tx;
}
