import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {getPortfolioPda, getUserCurrencyPda} from "../../types/account/pdas";
import {PortfolioAccount} from "../../types/account";
import {fetchPortfolio} from "../fetch/portfolio";

export async function createPortfolioSigned(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    weights: BN[],
    poolAddresses: PublicKey[],
    numCurrencies: BN,
): Promise<TransactionInstruction> {
    console.log("#createPortfolioSigned()");
    console.log("owner thing ", owner.toString())
    console.assert(weights.length === poolAddresses.length);
    if (weights.length != poolAddresses.length) {
        throw Error("Does not match in length!");
    }
    let sumOfWeights: BN = weights.reduce((sum, current) => sum.add(current), new BN(0));
    console.assert(owner);
    console.assert(solbondProgram);
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    const numPositions = weights.length;
    console.log("Creating Portfolio", portfolioPda.toString());
    let create_transaction_instructions: TransactionInstruction = solbondProgram.instruction.createPortfolio(
        portfolioBump,
        sumOfWeights,
        numPositions,
        numCurrencies,
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##createPortfolioSigned()");
    return create_transaction_instructions;
}

export async function registerCurrencyInputInPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    amount: u64,
    currencyMint: PublicKey
): Promise<TransactionInstruction> {
    console.log("#registerCurrencyInputInPortfolio()");
    let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(
        solbondProgram,
        owner,
        currencyMint
    );
    let ix: TransactionInstruction = solbondProgram.instruction.approveInitialCurrencyAmount(
        new BN(bumpCurrency),
        new BN(amount),
        {
            accounts: {
                owner: owner,
                userCurrencyPdaAccount: currencyPDA,
                currencyMint: currencyMint,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##registerCurrencyInputInPortfolio()");
    return ix;
}

export async function approvePortfolioWithdraw(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<Transaction> {
    console.log("#registerCurrencyInputInPortfolio()");
    let tx = new Transaction();
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    // Get the portfolioPda
    // Only approveWithdraw if it has not been done already ..
    let portfolio: PortfolioAccount | null = await fetchPortfolio(connection, solbondProgram, owner);
    if (!portfolio) {
        throw Error("Portfolio coudld not be fetched!! (19)");
    }
    if (portfolio.toBeRedeemed) {
        return tx;
    }
    let ix: TransactionInstruction = solbondProgram.instruction.approveWithdrawToUser(
        new BN(portfolioBump),
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPda,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            }
        }
    )
    console.log("##registerCurrencyInputInPortfolio()");
    tx.add(ix);
    return tx;
}
