import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getPositionPda} from "../../types/account/pdas";
import * as anchor from "@project-serum/anchor";
import {PositionAccountSaber} from "../../types/account/positionAccountSaber";
import * as registry from "../../registry/registry-helper";
import {
    createAssociatedTokenAccountUnsignedInstruction,
    getAccountForMintAndPDADontCreate, IWallet,
    tokenAccountExists
} from "../../utils";
import {getPoolState} from "../fetch/saber";
import {findSwapAuthorityKey, StableSwapState} from "@saberhq/stableswap-sdk";
import {stableSwapProgramId} from "../saber";
import {WalletI} from "easy-spl";

export async function approvePositionWeightSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddress: PublicKey,
    amountA: u64,
    amountB: u64,
    minMintAmount: u64,
    index: number,
    weight: BN
): Promise<TransactionInstruction> {
    console.log("#approvePositionWeightSaber()");
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;

    // Double check if already fulfilled, and skip it if not ...

    // Make sure to swap amountA and amountB accordingly ...
    // TODO: Make sure that A corresponds to USDC, or do a swap in general (i.e. push whatever there is, to the swap account)
    // TODO: Gotta define how much to pay in, depending on if mintA == USDC, or mintB == USDC
    let approveWeightInstruction: TransactionInstruction = await solbondProgram.instruction.approvePositionWeightSaber(
        portfolioBump,
        bumpPosition,
        new BN(weight),
        new BN(amountA),
        new BN(amountB),
        new BN(minMintAmount),
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
            }
        }
    );
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
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    // Fetch the position
    console.log("aaa 3");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 4");
    let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);
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
                portfolioPda: portfolioPDA,
                poolMint: state.poolTokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##approveWithdrawAmountSaber()");
    return ix;
}

export async function signApproveWithdrawAmountSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddress: PublicKey,
    index: number,
    poolTokenAmount: u64,
    tokenAAmount: u64
) {
    console.log("#signApproveWithdrawAmountSaber()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;

    let ix = await solbondProgram.instruction.approveWithdrawAmountSaber(
        portfolioBump,
        new BN(bumpPosition),
        new BN(poolTokenAmount),
        new BN(tokenAAmount),
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
            }
        }
    )
    console.log("##signApproveWithdrawAmountSaber()");
    return ix;
}

export async function permissionlessFulfillSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddress: PublicKey,
    index: number
) {
    console.log("#permissionlessFulfillSaber()");
    // Index should take the account
    // And find the poolAddress through a get request
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState

    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())
    // TODO: Gotta replace the this. functionality
    let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    console.log("userA ", userAccountA.toString());
    let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    console.log("userB ", userAccountA.toString());
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);

    let ix = await solbondProgram.instruction.createPositionSaber(
        bumpPosition,
        portfolioBump,
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPDA,
                outputLp: userAccountpoolToken,
                poolMint: state.poolTokenMint,
                swapAuthority: stableSwapState.config.authority,
                swap: stableSwapState.config.swapAccount,
                qpoolsA: userAccountA,
                poolTokenAccountA: state.tokenA.reserve,
                poolTokenAccountB: state.tokenB.reserve,
                qpoolsB: userAccountB,
                tokenProgram: TOKEN_PROGRAM_ID,
                saberSwapProgram: stableSwapProgramId,
                systemProgram: web3.SystemProgram.programId,
                poolAddress: poolAddress,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##permissionlessFulfillSaber()");
    return ix;
}

export async function redeemSinglePositionOnlyOne(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    pool_address: PublicKey,
    index: number,
) {
    console.log("#redeemSinglePositionOnlyOne()");
    const stableSwapState = await getPoolState(connection, pool_address);
    const {state} = stableSwapState;
    console.log("got state ", state);
    console.log("poolTokenMint ", state.poolTokenMint.toString());
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positonPDA, bumpPositon] = await getPositionPda(owner, index, solbondProgram);
    console.log("positionPDA ", positonPDA.toString())

    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())
    let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    console.log("userA ", userAccountA.toString())
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);
    let totalLPTokens = (await connection.getTokenAccountBalance(userAccountpoolToken)).value;

    console.log("👀 positionPda ", positonPDA.toString())
    console.log("😸 portfolioPda", portfolioPDA.toString());
    console.log("👾 owner.publicKey", owner.toString());
    console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
    console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    console.log("🤥 userAccountA", userAccountA.toString());
    console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    console.log("🦒 mint A", state.tokenA.mint.toString());
    console.log("🦒 mint B", state.tokenB.mint.toString());
    console.log("🦒 mint LP", state.poolTokenMint.toString());

    let ix = await solbondProgram.instruction.redeemPositionOneSaber(
        new BN(portfolioBump),
        new BN(bumpPositon),
        new BN(index),
        {
            accounts: {
                positionPda: positonPDA,
                portfolioPda: portfolioPDA,
                portfolioOwner: owner,
                poolMint: state.poolTokenMint,
                inputLp: userAccountpoolToken,
                swapAuthority: stableSwapState.config.authority,
                swap: stableSwapState.config.swapAccount,
                userA: userAccountA,
                reserveA: state.tokenA.reserve,
                mintA: state.tokenA.mint,
                reserveB: state.tokenB.reserve,
                feesA: state.tokenA.adminFeeAccount,
                saberSwapProgram: stableSwapProgramId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##redeemSinglePositionOnlyOne()");
    return ix;
}

export async function redeem_single_position(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    poolAddress: PublicKey,
    index: number
) {
    console.log("#redeem_single_position()");

    // TODO : replace this, by fetching the poolAddress from the position ...
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;

    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);

    console.log("got state ", state);
    console.log("poolTokenMint ", state.poolTokenMint.toString());
    let [positonPDA, bumpPositon] = await getPositionPda(owner, index, solbondProgram);
    console.log("positionPDA ", positonPDA.toString())

    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())

    let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    console.log("userA ", userAccountA.toString())
    let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    console.log("userB ", userAccountA.toString())
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);

    console.log("👀 positionPda ", positonPDA.toString())
    console.log("😸 portfolioPda", portfolioPDA.toString());
    console.log("👾 owner.publicKey", owner.toString());
    console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
    console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    console.log("🤥 userAccountA", userAccountA.toString());
    console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    console.log("👹 userAccountB", userAccountB.toString());
    console.log("🦒 mint A", state.tokenA.mint.toString());
    console.log("🦒 mint B", state.tokenB.mint.toString());
    console.log("🦒 mint LP", state.poolTokenMint.toString());

    let ix = await solbondProgram.instruction.redeemPositionSaber(
        new BN(portfolioBump),
        new BN(bumpPositon),
        new BN(index),
        {
            accounts: {
                positionPda: positonPDA,
                portfolioPda: portfolioPDA,
                portfolioOwner: owner,
                poolMint: state.poolTokenMint,
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
    );
    console.log("##redeem_single_position()");
    return ix;
}


// Put naming "saber" into it (?)
export async function registerLiquidityPoolAssociatedTokenAccountsForPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    providerWallet: IWallet,
    state: StableSwapState,
    createdAtaAccounts: Set<string>
): Promise<TransactionInstruction[]> {
    console.log("#registerLiquidityPoolAssociatedTokenAccountsForPortfolio()");
    // Creating ATA accounts if not existent yet ...
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    console.log("Checkpoint (2.1)");
    let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    let userAccountPoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);
    console.log("Checkpoint (2.2)");

    let txs = [];
    // Check for each account if it exists, and if it doesn't exist, create it
    if (!(await tokenAccountExists(connection, userAccountA)) && !createdAtaAccounts.has(userAccountA.toString())) {
        console.log("Chaining userAccountA");
        createdAtaAccounts.add(userAccountA.toString());
        let ix: Transaction = await createAssociatedTokenAccountUnsignedInstruction(
            connection,
            state.tokenA.mint,
            null,
            portfolioPDA,
            providerWallet,
        );
        txs.push(...ix.instructions);
        console.log("Chained userAccountA");
    }
    if (!(await tokenAccountExists(connection, userAccountB)) && !createdAtaAccounts.has(userAccountB.toString())) {
        console.log("Chaining userAccountB");
        createdAtaAccounts.add(userAccountB.toString());
        let ix: Transaction = await createAssociatedTokenAccountUnsignedInstruction(
            connection,
            state.tokenB.mint,
            null,
            portfolioPDA,
            providerWallet
        );
        txs.push(...ix.instructions);
        console.log("Chained userAccountB");
    }
    if (!(await tokenAccountExists(connection, userAccountPoolToken)) && !createdAtaAccounts.has(userAccountPoolToken.toString())) {
        console.log("Chaining userAccountPoolToken");
        createdAtaAccounts.add(userAccountPoolToken.toString());
        let ix: Transaction = await createAssociatedTokenAccountUnsignedInstruction(
            connection,
            state.poolTokenMint,
            null,
            portfolioPDA,
            providerWallet
        );
        // Do I need to sign this? Probably not ...
        txs.push(...ix.instructions);
    }
    console.log("Checkpoint (2.3)");
    console.log("##registerLiquidityPoolAssociatedTokenAccountsForPortfolio()");
    return txs;
}
