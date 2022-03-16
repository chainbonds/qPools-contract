import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getPositionPda} from "../../types/account/pdas";
import * as anchor from "@project-serum/anchor";
import {PositionAccountSaber} from "../../types/account/positionAccountSaber";
import * as registry from "../../registry/registry-helper";
import {getAccountForMintAndPDADontCreate} from "../../utils";

export async function approvePositionWeightSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddresses: Array<PublicKey>,
    amountA: u64,
    amountB: u64,
    minMintAmount: u64,
    index: number,
    weight: BN
): Promise<TransactionInstruction> {

    let [portfolioPDA, bumpPortfolio] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let poolAddress = poolAddresses[index];
    const stableSwapState = await this.getPoolState(poolAddress);
    const {state} = stableSwapState;

    // Make sure to swap amountA and amountB accordingly ...
    // TODO: Make sure that A corresponds to USDC, or do a swap in general (i.e. push whatever there is, to the swap account)
    // TODO: Gotta define how much to pay in, depending on if mintA == USDC, or mintB == USDC
    let accounts: any = {
        accounts: {
            owner: owner,
            positionPda: positionPDA,
            portfolioPda: portfolioPDA,
            poolMint: state.poolTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            // Create liquidity accounts
        },
    };
    console.log("Printing accounts: ", accounts);
    let approveWeightInstruction: TransactionInstruction = await this.solbondProgram.instruction.approvePositionWeightSaber(
        this.portfolioBump,
        bumpPosition,
        new BN(weight),
        new BN(amountA),
        new BN(amountB),
        new BN(minMintAmount),
        new BN(index),
        accounts
    )
    return approveWeightInstruction;
}


export async function approveWithdrawAmountSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number
): Promise<TransactionInstruction | null> {
    console.log("#approveWithdrawAmountSaber()");
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    // Fetch the position
    console.log("aaa 3");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 4");
    let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await this.getPoolState(poolAddress);
    const {state} = stableSwapState;
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);
    let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

    // Skip this instruction, if Position has already been redeemed
    console.log("Is Redeemed is: ", positionAccount.isRedeemed);
    console.log(positionAccount);
    if (positionAccount.isRedeemed && !positionAccount.isFulfilled) {
        throw Error("Something major is off 2");
    }
    if (positionAccount.isRedeemed) {
        return null;
    }

    let ix: TransactionInstruction = await solbondProgram.instruction.approveWithdrawAmountSaber(
        portfolioBump,
        new BN(bumpPosition),
        new BN(lpAmount),
        new BN(1),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPDA,
                poolMint: state.poolTokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [this.payer]
        }
    )
    console.log("##approveWithdrawAmountSaber()");
    return ix;
}
