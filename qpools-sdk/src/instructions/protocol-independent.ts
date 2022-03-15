import {getPortfolioPda, PortfolioAccount} from "../types/account/portfolioAccount";
import {accountExists, getAccountForMintAndPDADontCreate} from "../utils";
import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {MOCK} from "../const";

export async function portfolioExists(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<boolean> {
    console.log("#portfolioExists");
    let out: boolean
    let [portfolioPda, _] = await getPortfolioPda(owner, solbondProgram);
    if (connection) {
        out = await accountExists(connection, portfolioPda);
    } else {
        // Maybe let it rerun after a second again ...
        out = false;
    }
    console.log("##portfolioExists");
    return out;
}

export async function fetchPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<PortfolioAccount | null> {
    console.log("#fetchPortfolio()");
    let [portfolioPda, _] = await getPortfolioPda(owner, solbondProgram);
    let portfolioContent = null;
    console.log("Before trying to fetch");
    if (await accountExists(connection, portfolioPda)) {
        console.log("Exists and trying to fetch");
        portfolioContent = (await solbondProgram.account.portfolioAccount.fetch(portfolioPda)) as PortfolioAccount;
    }
    console.log("Now fetching again ...", portfolioContent);
    console.log("##fetchPortfolio()");
    return portfolioContent;
}

export async function createPortfolioSigned(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number,
    weights: Array<BN>,
    poolAddresses: Array<PublicKey>,
    initialAmountUsdc: u64
): Promise<TransactionInstruction> {
    console.assert(weights.length === poolAddresses.length);
    if (weights.length != poolAddresses.length) {
        throw Error("Does not match in length!");
    }
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    const numPositions = new BN(weights.length);
    console.log("Creating Portfolio", portfolioPda.toString());
    let create_transaction_instructions: TransactionInstruction = solbondProgram.instruction.createPortfolio(
        new BN(portfolioBump),
        weights,
        new BN(numPositions),
        new BN(initialAmountUsdc),
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPda, //randomOwner.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        }
    )
    console.log("##createPortfolio{Instruction}")
    return create_transaction_instructions;
}

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
    owner: PublicKey,
    totalAmount: BN
) {
    console.log("#signApproveWithdrawToUser");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let ix = await solbondProgram.instruction.approveWithdrawToUser(
        portfolioBump,
        totalAmount,
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
    console.log("##signApproveWithdrawToUser");
    return ix;
}

export async function transferUsdcFromUserToPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
): Promise<TransactionInstruction> {
    console.log("#transferUsdcFromUserToPortfolio()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let userUSDCAta = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, owner);
    let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, portfolioPda);

    let ix: TransactionInstruction = solbondProgram.instruction.transferToPortfolio(
        new BN(portfolioBump),
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPda,
                userOwnedTokenAccount: userUSDCAta,
                pdaOwnedTokenAccount: pdaUSDCAccount,
                tokenMint: MOCK.DEV.SABER_USDC,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,

            }
        }
    )
    console.log("##transferUsdcFromUserToPortfolio()");
    return ix;
}
