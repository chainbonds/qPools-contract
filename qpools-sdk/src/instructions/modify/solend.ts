import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getPositionPda, getUserCurrencyPda} from "../../types/account/pdas";
import * as anchor from "@project-serum/anchor";
import {getAccountForMintAndPDADontCreate} from "../../utils";

import {PositionAccountSolend} from "../../types/account";
import {SolendAction} from "@solendprotocol/solend-sdk";
import {Cluster, getNetworkCluster} from "../../network";

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


export async function signApproveWithdrawAmountSolend(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number,
    // redeemAmount: u64
) {
    console.log("#signApproveWithdrawAmountSaber()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);

    console.log("aaa 26");
    let positionAccount: PositionAccountSolend = (await solbondProgram.account.positionAccountSolend.fetch(positionPDA)) as PositionAccountSolend;
    console.log("aaa 27");

    if (positionAccount.isRedeemed && !positionAccount.isFulfilled) {
        throw Error("Something major is off 2");
    }
    if (positionAccount.isRedeemed) {
        return null;
    }
    // Take out as many c-tokens as there are ...
    // TODO: How to get the amount of c-tokens from here ...
    throw Error("Not implemented yet!");

    let ix = await solbondProgram.instruction.approveWithdrawSolend(
        portfolioBump,
        new BN(bumpPosition),
        new BN(0),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                portfolioPda: portfolioPda,
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
    index: number,
    solendAction: SolendAction
) {
    console.log("#permissionlessFulfillSolend()");
    // Index should take the account
    // And find the poolAddress through a get request
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("aaa 20");
    let positionAccount: PositionAccountSolend = (await solbondProgram.account.positionAccountSolend.fetch(positionPDA)) as PositionAccountSolend;
    const pdaOwnedATA = await getAccountForMintAndPDADontCreate(positionAccount.currencyMint, portfolioPDA)

    // TODO: Get the Collateral Mint Address through the currency Mint
    // I can do a lookup, from poolAddress (mintAddress) to symbol, as this was the same across the registry.
    // TODO: Oh boy, we should really write some tests around this. I'm using something from 5 files aways
    const pdaOwnedCollateral = await getAccountForMintAndPDADontCreate(new PublicKey(solendAction.reserve.collateralMintAddress), portfolioPDA);
    console.log("aaa 21");

    console.log("owner ", owner.toString())
    console.log("positionPDA ", positionPDA.toString())
    console.log("portfolioPDA, userTransferAuthority ", portfolioPDA.toString())
    console.log("sourceLiquidity ", pdaOwnedATA.toString())
    console.log("destinationCollateral ", pdaOwnedCollateral.toString())
    console.log("reserve ", solendAction.reserve.address)
    console.log("reserveCollateralMint ", solendAction.reserve.collateralMintAddress)
    console.log("reserveLiquiditySupply ", solendAction.reserve.liquidityAddress)
    console.log("lendingMarket ", solendAction.lendingMarket.address)
    console.log("lending authority ", solendAction.lendingMarket.authorityAddress)
    console.log("program id ", solendAction.solendInfo.programID.toString())    

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
                reserve: new PublicKey(solendAction.reserve.address),
                reserveCollateralMint: new PublicKey(solendAction.reserve.collateralMintAddress),
                reserveLiquiditySupply: new PublicKey(solendAction.reserve.liquidityAddress),
                lendingMarket: new PublicKey(solendAction.lendingMarket.address),
                lendingMarketAuthority: new PublicKey(solendAction.lendingMarket.authorityAddress),
                solendProgram: new PublicKey(solendAction.solendInfo.programID),
                userTransferAuthority: portfolioPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##permissionlessFulfillSaber()");
    return ix;
}

export async function redeemSinglePositionSolend(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint: PublicKey,
    index: number,
    tokenSymbol : string
) {
    console.log("#redeemSinglePositionOnlyOne()");
    // TODO: Do a translation from index to state first ...

    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("portfolioPda is ", portfolioPDA.toString());
    console.log("positionPDA ", positionPDA.toString());

    console.log("aaa 24solend");
    let positionAccount: PositionAccountSolend = (await solbondProgram.account.positionAccountSolend.fetch(positionPDA)) as PositionAccountSolend;
    console.log("aaa 25solend");

 
    // const stableSwapState = await getPoolState(connection, pool_address);
    // const {state} = stableSwapState;
    let solendAction: SolendAction;
    if (getNetworkCluster() === Cluster.DEVNET) {
        solendAction = await SolendAction.initialize(
            "mint",
            new BN(0),
            tokenSymbol,
            owner,
            connection,
            "devnet",
        )
    } else {
        throw Error("Cluster not implemented! getMarinadeTokens");
    }

    const pdaOwnedATA = await getAccountForMintAndPDADontCreate(currencyMint, portfolioPDA)
    const pdaOwnedCollateral = await getAccountForMintAndPDADontCreate(new PublicKey(solendAction.reserve.collateralMintAddress), portfolioPDA)
  
    
    // console.log("👀 positionPda ", positionPDA.toString())
    // console.log("😸 portfolioPda", portfolioPDA.toString());
    // console.log("👾 owner.publicKey", owner.toString());
    // console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
    // console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    // console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    // console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    // console.log("🤥 userAccountA", userAccount.toString());
    // console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    // console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    // console.log("🦒 mint A", state.tokenA.mint.toString());
    // console.log("🦒 mint B", state.tokenB.mint.toString());
    // console.log("🦒 mint LP", state.poolTokenMint.toString());

    let ix = await solbondProgram.instruction.redeemPositionSolend(
        new BN(bumpPosition),
        new BN(portfolioBump),
        new BN(index),
        {
            accounts: {
                owner: owner,
                positionPda: positionPDA,
                userTransferAuthority: portfolioPDA,
                destinationLiquidity: pdaOwnedATA,
                sourceCollateral: pdaOwnedCollateral,
                reserve: new PublicKey(solendAction.reserve.address),
                reserveCollateralMint: new PublicKey(solendAction.reserve.collateralMintAddress),
                reserveLiquiditySupply: new PublicKey(solendAction.reserve.liquidityAddress),
                lendingMarket: new PublicKey(solendAction.lendingMarket.address),
                lendingMarketAuthority: new PublicKey(solendAction.lendingMarket.authorityAddress),
                solendProgram: new PublicKey(solendAction.solendInfo.programID),
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            },
        }
    )
    console.log("##redeemSinglePositionOnlyOne()");
    return ix;
}