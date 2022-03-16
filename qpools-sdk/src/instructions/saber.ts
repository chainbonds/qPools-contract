import {PositionAccountSaber} from "../types/account/positionAccountSaber";
import {accountExists, getAccountForMintAndPDADontCreate} from "../utils";
import {Connection, Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {getPositionPda, getPortfolioPda} from "../types/account/pdas";
import * as registry from "../registry/registry-helper";
import {findSwapAuthorityKey, StableSwap} from "@saberhq/stableswap-sdk";
import * as assert from "assert";
import {MOCK} from "../const";

/**
 * Any constants.
 * You should probably include these in the registry.
 */
const stableSwapProgramId = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");

/**
 * Private helper functions
 */
async function getPoolState(
    connection: Connection,
    poolAddress: PublicKey
) {
    const fetchedStableSwap = await StableSwap.load(
        connection,
        poolAddress,
        stableSwapProgramId
    );
    assert.ok(fetchedStableSwap.config.swapAccount.equals(poolAddress));
    return fetchedStableSwap;
}

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
    console.log("#approvePositionWeightSaber()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let poolAddress = poolAddresses[index];
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;

    // Make sure to swap amountA and amountB accordingly ...
    // TODO: Make sure that A corresponds to USDC, or do a swap in general (i.e. push whatever there is, to the swap account)
    // TODO: Gotta define how much to pay in, depending on if mintA == USDC, or mintB == USDC
    let accounts: any = {
        accounts: {
            owner: owner,
            positionPda: positionPDA,
            portfolioPda: portfolioPda,
            poolMint: state.poolTokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
    };
    let approveWeightInstruction: TransactionInstruction = await solbondProgram.instruction.approvePositionWeightSaber(
        portfolioBump,
        bumpPosition,
        new BN(weight),
        new BN(amountA),
        new BN(amountB),
        new BN(minMintAmount),
        new BN(index),
        accounts
    )
    console.log("##approvePositionWeightSaber()");
    return approveWeightInstruction;
}

export async function approveWithdrawAmountSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number
): Promise<TransactionInstruction | null> {
    console.log("#approveWithdrawAmountSaber()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    // Fetch the position
    console.log("aaa 3");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 4");
    let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPda);
    let lpAmount = (await connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

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
                portfolioPda: portfolioPda,
                poolMint: state.poolTokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##approveWithdrawAmountSaber()");
    return ix;
}

// TODO: Continue here tomorrow (?)
// Should probably copy everything over from the register-portfolio only,
// And create logic parallel to what you had done in the other file
export async function redeem_single_position_only_one(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddresses: PublicKey[],
    index: number
): Promise<TransactionInstruction> {
    console.log("#redeem_single_position_only_one()");
    const pool_address = poolAddresses[index];
    const stableSwapState = await getPoolState(connection, pool_address);
    const {state} = stableSwapState;
    let poolTokenMint = state.poolTokenMint;
    console.log("poolTokenMint ", poolTokenMint.toString());

    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positonPDA, bumpPositon] = await getPositionPda(owner, index, this.solbondProgram);
    console.log("positionPDA ", positonPDA.toString())
    const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
    console.log("authority ", authority.toString())

    let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
    let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
    console.log("userA ", userAccountA.toString())
    let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);
    let totalLPTokens = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value;

    console.log("👀 positionPda ", positonPDA.toString())

    console.log("😸 portfolioPda", portfolioPda.toString());
    console.log("👾 owner.publicKey",  owner.toString());

    console.log("🟢 poolTokenMint", poolTokenMint.toString());
    console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());

    console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    // console.log("🤯 poolPDA", poolPDA.toString());

    console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    console.log("🤥 userAccountA", userAccountA.toString());
    console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());

    console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());

    console.log("🦒 mint A", state.tokenA.mint.toString());
    console.log("🦒 mint B", state.tokenB.mint.toString());
    console.log("🦒 mint LP", poolTokenMint.toString());

    let ix: TransactionInstruction = await solbondProgram.instruction.redeemPositionOneSaber(
        new BN(portfolioBump),
        new BN(bumpPositon),
        new BN(index),
        {
            accounts: {
                positionPda: positonPDA,
                portfolioPda: this.portfolioPDA,
                portfolioOwner: owner,
                poolMint: poolTokenMint,
                inputLp: userAccountpoolToken,
                swapAuthority: stableSwapState.config.authority,
                swap:stableSwapState.config.swapAccount,
                userA: userAccountA,
                reserveA: state.tokenA.reserve,
                mintA: state.tokenA.mint,
                reserveB: state.tokenB.reserve,
                feesA: state.tokenA.adminFeeAccount,
                saberSwapProgram: this.stableSwapProgramId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##redeem_single_position_only_one()");
    return ix;
}



export async function redeem_single_position(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddresses: PublicKey,
    index: number,
) {
    console.log("#redeem_single_position()");
    const stableSwapState = await getPoolState(connection, poolAddresses);
    const {state} = stableSwapState;
    let poolTokenMint = state.poolTokenMint;
    console.log("poolTokenMint ", poolTokenMint.toString());

    let [portfolioPda, bumpPortfolio] = await getPositionPda(owner, index, solbondProgram);
    let [positonPDA, bumpPositon] = await getPositionPda(owner, index, solbondProgram);
    console.log("positionPDA ", positonPDA.toString())
    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())

    let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, portfolioPda);
    let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, portfolioPda);
    console.log("userA ", userAccountA.toString());
    console.log("userB ", userAccountB.toString());

    let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, portfolioPda);
    let amount_a = new u64(0);
    let amount_b = new u64(0);

    let totalLPTokens = (await connection.getTokenAccountBalance(userAccountpoolToken)).value;
    if (state.tokenA.mint.toString() === MOCK.DEV.SABER_USDC.toString()) {
        amount_a = new u64(1);
        console.log("A IS THE WAY")
    } else {
        amount_b = new u64(1);
        console.log("B IS THE WAY")
    }

    console.log("👀 positionPda ", positonPDA.toString())
    console.log("😸 portfolioPda", portfolioPda.toString());
    console.log("👾 owner.publicKey", owner.toString());
    console.log("🟢 poolTokenMint", poolTokenMint.toString());
    console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    console.log("🤥 userAccountA", userAccountA.toString());
    console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    console.log("👹 userAccountB", userAccountB.toString());
    console.log("🦒 mint A", state.tokenA.mint.toString());
    console.log("🦒 mint B", state.tokenB.mint.toString());
    console.log("🦒 mint LP", poolTokenMint.toString());

    let ix: TransactionInstruction = await this.solbondProgram.instruction.redeemPositionSaber(
        new BN(this.portfolioBump),
        new BN(bumpPositon),
        new BN(index),
        {
            accounts: {
                positionPda: positonPDA,
                portfolioPda: portfolioPda,
                portfolioOwner: owner,
                poolMint: poolTokenMint,
                inputLp: userAccountpoolToken,
                swapAuthority: stableSwapState.config.authority,
                swap: stableSwapState.config.swapAccount,
                userA: userAccountA,
                reserveA: state.tokenA.reserve,
                reserveB: state.tokenB.reserve,
                userB: userAccountB,
                feesA: state.tokenA.adminFeeAccount,
                feesB: state.tokenB.adminFeeAccount,
                saberSwapProgram: stableSwapProgramId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: web3.SystemProgram.programId,
            },
        }
    )
    console.log("##redeem_single_position()");
    return ix;
}

export async function permissionlessFulfillSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddress: PublicKey,
    index: number
) {
    console.log("#permissionlessFulfillSaber");

    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;
    let poolTokenMint = state.poolTokenMint;

    const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
    let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
    let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
    let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);

    let ix: TransactionInstruction = await this.solbondProgram.instruction.createPositionSaber(
        bumpPosition,
        this.portfolioBump,
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                outputLp:  userAccountpoolToken,
                poolMint: poolTokenMint,
                swapAuthority: stableSwapState.config.authority,
                swap: stableSwapState.config.swapAccount,
                qpoolsA: userAccountA,
                poolTokenAccountA: state.tokenA.reserve,
                poolTokenAccountB: state.tokenB.reserve,
                qpoolsB: userAccountB,
                tokenProgram: TOKEN_PROGRAM_ID,
                saberSwapProgram: this.stableSwapProgramId,
                systemProgram: web3.SystemProgram.programId,
                poolAddress: poolAddress,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##permissionlessFulfillSaber");
    return ix;
}
