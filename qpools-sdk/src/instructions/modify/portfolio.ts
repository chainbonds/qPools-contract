import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {getPortfolioPda, getUserCurrencyPda, SEED} from "../../types/account/pdas";
import {bnTo1} from "../../utils";

export async function createPortfolioSigned(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    weights: Array<BN>,
    poolAddresses: PublicKey[]
): Promise<TransactionInstruction> {
    console.log("#createPortfolioSigned()");
    console.assert(weights.length === poolAddresses.length);
    if (weights.length != poolAddresses.length) {
        throw Error("Does not match in length!");
    }
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    const numPositions = weights.length;
    console.log("Creating Portfolio", portfolioPda.toString());
    console.log("Seeds are: ", owner.toString(), solbondProgram.programId.toString(), SEED.PORTFOLIO_ACCOUNT.toString(), portfolioBump);
    console.log("Inputs to the program ..");
    console.log(portfolioBump, weights, numPositions);
    console.log("Accounts are: ",
        {
            owner: owner.toString(),
            ownerType: typeof owner,
            portfolioPda: portfolioPda.toString(),
            portfolioType: typeof portfolioPda,
            tokenProgram: TOKEN_PROGRAM_ID.toString(),
            systemProgram: web3.SystemProgram.programId.toString(),
            rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
        })
    let create_transaction_instructions: TransactionInstruction = solbondProgram.instruction.createPortfolio(
        bnTo1(new BN(portfolioBump)),
        weights,
        numPositions,
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
): Promise<TransactionInstruction> {
    console.log("#registerCurrencyInputInPortfolio()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
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
    return ix;
}
