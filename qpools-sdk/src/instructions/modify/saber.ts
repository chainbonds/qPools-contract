import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getPositionPda, getATAPda} from "../../types/account/pdas";
import * as anchor from "@project-serum/anchor";
import {PositionAccountSaber} from "../../types/account";
import {
    createAssociatedTokenAccountUnsignedInstruction,
    getAccountForMintAndPDADontCreate, IWallet,
    tokenAccountExists
} from "../../utils";
import {getPoolState} from "../fetch/saber";
import {findSwapAuthorityKey, StableSwapState} from "@saberhq/stableswap-sdk";
import {stableSwapProgramId} from "../saber";
import {MOCK} from "../../const";
import {Registry} from "../../frontend-friendly";

// TODO: For all withdraw actions, remove the poolAddress, and get this from the saved position, and then convert it back
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

    console.assert(amountB.eq(new BN(0)));

    // Double check if already fulfilled, and skip it if not ...
    if (state.tokenA.mint.equals(MOCK.DEV.SABER_USDC)) {
        console.log("tokenA");
        // Don't do any swap
    } else if (state.tokenB.mint.equals(MOCK.DEV.SABER_USDC)) {
        console.log("tokenB");
        amountB = amountA;
        amountA = new BN(0);
    } else {
        throw Error("KSLDJLKAJSD ERROR");
    }

    // Make sure to swap asomountA and amountB accordingly ...
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


export async function signApproveWithdrawAmountSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number,
    poolTokenAmount: u64,
    minRedeemTokenAmount: u64,
    registry: Registry
) {
    console.log("#signApproveWithdrawAmountSaber()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);

    console.log("aaa 26");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 27");

    // FOr some address, this is not needed ...
    let poolAddress = await registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;

    // Skip this instruction, if Position has already been redeemed
    console.log("Is Redeemed is: ", positionAccount.isRedeemed);
    console.log(positionAccount);
    if (positionAccount.isRedeemed && !positionAccount.isFulfilled) {
        throw Error("Something major is off 2");
    }
    if (positionAccount.isRedeemed) {
        return null;
    }

    let ix = await solbondProgram.instruction.approveWithdrawAmountSaber(
        portfolioBump,
        new BN(bumpPosition),
        new BN(poolTokenAmount),
        new BN(minRedeemTokenAmount),
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
    index: number,
    registry: Registry
) {
    console.log("#permissionlessFulfillSaber()");
    // Index should take the account
    // And find the poolAddress through a get request
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("aaa 20");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 21");
    // FOr some address, this is not needed ...
    let poolAddress = await registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;

    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())
    // TODO: Gotta replace the this. functionality
    //let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    //console.log("userA ", userAccountA.toString());
    //let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    //console.log("userB ", userAccountA.toString());
    //let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);

    let [ataA, bumpATAa] = await getATAPda(owner,state.tokenA.mint, solbondProgram)
    let [ataB, bumpATAb] = await getATAPda(owner,state.tokenB.mint, solbondProgram)
    let [ataLP, bumpATAlp] = await getATAPda(owner,state.poolTokenMint, solbondProgram)

    let ix = await solbondProgram.instruction.createPositionSaber(
        bumpPosition,
        portfolioBump,
        new BN(bumpATAa),
        new BN(bumpATAb),
        new BN(bumpATAlp),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPDA,
                outputLp: ataLP,
                poolMint: state.poolTokenMint,
                mintA: state.tokenA.mint,
                mintB: state.tokenB.mint,
                swapAuthority: stableSwapState.config.authority,
                swap: stableSwapState.config.swapAccount,
                qpoolsA: ataA,
                poolTokenAccountA: state.tokenA.reserve,
                poolTokenAccountB: state.tokenB.reserve,
                qpoolsB: ataB,
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
    index: number,
    registry: Registry,
) {
    console.log("#redeemSinglePositionOnlyOne()");
    // TODO: Do a translation from index to state first ...

    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("portfolioPda is ", portfolioPDA.toString());
    console.log("positionPDA ", positionPDA.toString());

    console.log("aaa 24");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 25");

    // FOr some address, this is not needed ...
    let poolAddress = await registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;
    console.log("got state ", state);
    console.log("poolTokenMint ", state.poolTokenMint.toString());

    // const stableSwapState = await getPoolState(connection, pool_address);
    // const {state} = stableSwapState;

    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())
    // let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    // let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    // console.log("userA ", userAccountA.toString())
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);
    // let totalLPTokens = (await connection.getTokenAccountBalance(userAccountpoolToken)).value;

    // TODO: Hardcode to check for IF-ELSE statement on USDC ...
    // TODO: Pass in currency also as an input to this
    // Probably can use this template
    let userAccount: PublicKey;
    let reserveA: PublicKey;
    let feesA: PublicKey;
    let mintA: PublicKey;
    let reserveB: PublicKey;
    if (MOCK.DEV.SABER_USDC.equals(state.tokenA.mint)) {
        userAccount = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
        reserveA = state.tokenA.reserve
        feesA = state.tokenA.adminFeeAccount
        mintA = state.tokenA.mint
        reserveB = state.tokenB.reserve

    } else if (MOCK.DEV.SABER_USDC.equals(state.tokenB.mint)) {
        userAccount = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
        reserveA = state.tokenB.reserve
        feesA = state.tokenB.adminFeeAccount
        mintA = state.tokenB.mint
        reserveB = state.tokenA.reserve

    } else {
        throw Error(
            "Could not find overlapping USDC Pool Mint Address!! " +
            MOCK.DEV.SABER_USDC.toString() + " (Saber USDC) " +
            state.tokenA.mint.toString() + " (MintA) " +
            state.tokenB.mint.toString() + " (MintB) "
        )
    }

    let [ataPDA_a, bumpATAa] = await getATAPda(owner,mintA, solbondProgram)
    let [ataPDA_lp, bumpATAlp] = await getATAPda(owner,state.poolTokenMint, solbondProgram)

    console.log("👀 positionPda ", positionPDA.toString())
    console.log("😸 portfolioPda", portfolioPDA.toString());
    console.log("👾 owner.publicKey", owner.toString());
    console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
    console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    console.log("🤥 userAccountA", userAccount.toString());
    console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    console.log("🦒 mint A", state.tokenA.mint.toString());
    console.log("🦒 mint B", state.tokenB.mint.toString());
    console.log("🦒 mint LP", state.poolTokenMint.toString());

    let ix = await solbondProgram.instruction.redeemPositionOneSaber(
        new BN(portfolioBump),
        new BN(bumpPosition),
        new BN(bumpATAa),
        new BN(bumpATAlp),
        new BN(index),
        {
            accounts: {
                positionPda: positionPDA,
                portfolioPda: portfolioPDA,
                portfolioOwner: owner,
                poolMint: state.poolTokenMint,
                inputLp: ataPDA_lp,
                swapAuthority: stableSwapState.config.authority,
                swap: stableSwapState.config.swapAccount,
                userA: ataPDA_a,
                reserveA: reserveA,
                mintA: mintA,
                reserveB: reserveB,
                feesA: feesA,
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
    index: number,
    registry: Registry
) {
    console.log("#redeem_single_position()");
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPositon] = await getPositionPda(owner, index, solbondProgram);
    console.log("positionPDA ", positionPDA.toString())
    // TODO : replace this, by fetching the poolAddress from the position ...
    console.log("aaa 22");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 23");

    // FOr some address, this is not needed ...
    let poolAddress = await registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    const stableSwapState = await getPoolState(connection, poolAddress);
    const {state} = stableSwapState;
    console.log("got state ", state);
    console.log("poolTokenMint ", state.poolTokenMint.toString());

    console.log("got state ", state);
    console.log("poolTokenMint ", state.poolTokenMint.toString());

    const [authority] = await findSwapAuthorityKey(state.adminAccount, stableSwapProgramId);
    console.log("authority ", authority.toString())

    let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, portfolioPDA);
    console.log("userA ", userAccountA.toString())
    let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, portfolioPDA);
    console.log("userB ", userAccountA.toString())
    let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, portfolioPDA);

    console.log("👀 positionPda ", positionPDA.toString())
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
                positionPda: positionPDA,
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

    // Next to exporting the tx, also export the associated token accounts that will be created ..
    return txs;
}
