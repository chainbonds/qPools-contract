import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getPositionPda, getUserCurrencyPda} from "../../types/account/pdas";
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
import {MOCK} from "../../const";
import {PositionAccountSolend} from "../../types/account/PositionAccountSolend";
import {SolendAction} from "@solendprotocol/solend-sdk";

// TODO: For all withdraw actions, remove the poolAddress, and get this from the saved position, and then convert it back
export async function approvePositionWeightSolend(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint: PublicKey,
    inputAmount: u64,
    index: number,
    weight: BN
): Promise<TransactionInstruction> {
    console.log("#approvePositionWeightSolend()");
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(solbondProgram, owner, currencyMint);

    // Make sure to swap asomountA and amountB accordingly ...
    // TODO: Make sure that A corresponds to USDC, or do a swap in general (i.e. push whatever there is, to the swap account)
    // TODO: Gotta define how much to pay in, depending on if mintA == USDC, or mintB == USDC
    let approveWeightInstruction: TransactionInstruction = await solbondProgram.instruction.approvePositionWeightSolend(
        portfolioBump,
        bumpPosition,
        bumpCurrency,
        new BN(weight),
        new BN(inputAmount),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPDA,
                userCurrencyPdaAccount: currencyPDA,
                currencyMint: currencyMint,
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
    minRedeemTokenAmount: u64
) {
    console.log("#signApproveWithdrawAmountSaber()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);

    console.log("aaa 26");
    let positionAccount: PositionAccountSaber = (await solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    console.log("aaa 27");

    // FOr some address, this is not needed ...
    let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
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

/*
TODO: Environment variable should be generalized to MAINNET
 */
export async function permissionlessFulfillSolend(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint : PublicKey,
    index: number,
    tokenSymbol : string,
    environment : "devnet"
) {
    /*
    If we want to sail to other markets, we should find a
     */
    const solendAction = await SolendAction.initialize(
        "mint",
        new BN(0),
        tokenSymbol,
        owner,
        this.connection,
        environment,
    )


    console.log("#permissionlessFulfillSolend()");
    // Index should take the account
    // And find the poolAddress through a get request
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("aaa 20");
    let positionAccount: PositionAccountSolend = (await solbondProgram.account.positionAccountSolend.fetch(positionPDA)) as PositionAccountSolend;
    const pdaOwnedATA = await getAccountForMintAndPDADontCreate(currencyMint, portfolioPDA)
    const pdaOwnedCollateral = await getAccountForMintAndPDADontCreate(new PublicKey(solendAction.reserve.collateralMintAddress), portfolioPDA)
    console.log("aaa 21");


    let ix = await solbondProgram.instruction.createPositionSolend(
        bumpPosition,
        portfolioBump,
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                sourceLiquidity: pdaOwnedATA,
                destinationCollateral: pdaOwnedCollateral,
                reserve: ,
                reserveCollateralMint: ,
                reserveLiquiditySupply: ,
                lendingMarket: ,
                lendingMarketAuthority: ,
                solendProgram: ,
                userTransferAuthority: portfolioPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: ,
                systemProgram: web3.SystemProgram.programId,
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
    index: number
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
    let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
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
                userA: userAccount,
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