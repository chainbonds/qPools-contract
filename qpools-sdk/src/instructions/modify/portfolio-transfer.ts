import {Connection, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda, getUserCurrencyPda, getATAPda} from "../../types/account/pdas";
import {getAccountForMintAndPDADontCreate, tokenAccountExists} from "../../utils";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";

export async function sendLamports(
    from: PublicKey,
    to: PublicKey,
    lamports: BN
): Promise<TransactionInstruction> {
    return web3.SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: lamports.toNumber(),
    })
}

export async function transferUsdcFromUserToPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    currencyMint: PublicKey,
): Promise<TransactionInstruction> {
    console.log("#transferUsdcFromUserToPortfolio()");
    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(solbondProgram, owner, currencyMint);
    let [ataPDA, bumpATA] = await getATAPda(owner, currencyMint, solbondProgram);
    
    //let pdaCurrencyAccount = await getAccountForMintAndPDADontCreate(currencyMint, portfolioPda);
    let userCurrencyAccount = await getAccountForMintAndPDADontCreate(currencyMint, owner);

    console.log("Input Accounts are: ");
    console.log(
        {
            owner: owner.toString(),
            portfolioPda: portfolioPda.toString(),
            userOwnedTokenAccount: userCurrencyAccount.toString(),
            pdaOwnedTokenAccount: ataPDA.toString(),
            userCurrencyPdaAccount: currencyPDA.toString(),
            tokenMint: currencyMint.toString(),
        }
    )

    let ix = await solbondProgram.instruction.transferToPortfolio(
        new BN(portfolioBump),
        new BN(bumpCurrency),
        new BN(bumpATA),
        {
            accounts: {
                owner: owner,
                portfolioPda: portfolioPda,
                userOwnedTokenAccount: userCurrencyAccount,
                pdaOwnedTokenAccount: ataPDA,
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
    puller: PublicKey,
    currencyMint: PublicKey
): Promise<Transaction> {
    console.log("#transfer_to_user()");
    let tx: Transaction = new Transaction();
    let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let [ataPDA, bumpATA] = await getATAPda(owner, currencyMint,solbondProgram);
    //let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(currencyMint, portfolioPDA);
    let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(solbondProgram, owner, currencyMint);
    let userOwnedUSDCAccount = await getAccountForMintAndPDADontCreate(currencyMint, owner);
    console.log("portfolioPDA ", portfolioPDA.toString());
    console.log("currencyPDA ", currencyPDA.toString());
    console.log("userOwnedUSDCAccount ", userOwnedUSDCAccount.toString());
    console.log("currencyMint ", currencyMint.toString());
    console.log("owner ", owner.toString());
    console.log("puller ", puller.toString());
    // This token account is closed, if it has been transferred back ...
    if (!(await tokenAccountExists(connection, currencyPDA))) {
        return tx;
    }
    let ix = await solbondProgram.instruction.transferRedeemedToUser(
        new BN(bumpCurrency),
        new BN(bumpATA),
        {
            accounts: {
                portfolioPda: portfolioPDA,
                puller: puller,
                userCurrencyPdaAccount: currencyPDA,
                userOwnedUserA: userOwnedUSDCAccount,
                currencyMint: currencyMint,
                pdaOwnedUserA: ataPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    console.log("##transfer_to_user()");
    tx.add(ix);
    return tx;
}
