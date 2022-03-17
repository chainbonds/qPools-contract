import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getUserCurrencyPda} from "../../types/account/pdas";
import {getAccountForMintAndPDADontCreate, getAssociatedTokenAddressOffCurve} from "../../utils";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";

export async function sendLamports(
    from: PublicKey,
    to: PublicKey,
    lamports: number
): Promise<TransactionInstruction> {
    return web3.SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: lamports,
    })
}

export async function signApproveWithdrawToUser(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<TransactionInstruction> {
    console.log("#signApproveWithdrawToUser()");
    let [portfolioPDA, bumpPortfolio] = await getPortfolioPda(owner, solbondProgram);
    let ix = await solbondProgram.instruction.approveWithdrawToUser(
        bumpPortfolio,
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##signApproveWithdrawToUser()");
    return ix;
}

export async function transferUsdcFromUserToPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint: PublicKey,
    wrappedSolAccount: PublicKey
): Promise<TransactionInstruction> {
    console.log("#transferUsdcFromUserToPortfolio()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(solbondProgram, owner, currencyMint);
    let pdaCurrencyAccount = await getAccountForMintAndPDADontCreate(currencyMint, portfolioPda);

    let ix = await solbondProgram.instruction.transferToPortfolio(
        new BN(portfolioBump),
        new BN(bumpCurrency),
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPda,
                userOwnedTokenAccount: wrappedSolAccount,
                pdaOwnedTokenAccount: pdaCurrencyAccount,
                userCurrencyPdaAccount: currencyPDA,
                tokenMint: currencyMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            }
        }
    )
    console.log("##transferUsdcFromUserToPortfolio()");
    return ix;
}

export async function transfer_to_user(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint: PublicKey
): Promise<TransactionInstruction> {
    console.log("#transfer_to_user()");
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(currencyMint, portfolioPDA);
    let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(solbondProgram, owner, currencyMint);
    let userOwnedUSDCAccount = await getAccountForMintAndPDADontCreate(currencyMint, owner);

    let ix = await solbondProgram.instruction.transferRedeemedToUser(
        new BN(portfolioBump),
        new BN(bumpCurrency),
        {
            accounts: {
                portfolioPda: portfolioPDA,
                portfolioOwner: owner,
                userCurrencyPdaAccount: currencyPDA,
                userOwnedUserA: userOwnedUSDCAccount,
                currencyMint: currencyMint,
                pdaOwnedUserA: pdaUSDCAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##transfer_to_user()");
    return ix;
}