import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {getPortfolioPda} from "../../types/account/pdas";
import {getAccountForMintAndPDADontCreate} from "../../utils";
import {MOCK} from "../../const";
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
    owner: PublicKey,
    totalAmount: BN
) {
    console.log("#signApproveWithdrawToUser()");
    let [portfolioPDA, bumpPortfolio] = await getPortfolioPda(this.owner.publicKey, solbondProgram);
    let ix = await solbondProgram.instruction.approveWithdrawToUser(
        bumpPortfolio,
        totalAmount,
        {
            accounts: {
                owner: this.owner.publicKey,
                portfolioPda: this.portfolioPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [this.payer]
        }
    )
    console.log("##signApproveWithdrawToUser()");
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

    let ix: TransactionInstruction = await solbondProgram.instruction.transferToPortfolio(
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

export async function transfer_to_user(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
) {
    //this.qPools_USDC_fees = await this.getAccountForMintAndPDA(this.USDC_mint, new PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs"));

    // TODO: Do this somewhere else!
    // if (!this.userOwnedUSDCAccount) {
    //     console.log("Creating a userOwnedUSDCAccount");
    //     this.userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
    //         this.connection,
    //         this.USDC_mint,
    //         this.wallet.publicKey,
    //         owner, // Initially had type WalletI
    //     );
    //     console.log("Done!");
    // }

    let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let pdaUSDCAccount = await this.getAccountForMintAndPDA(MOCK.DEV.SABER_USDC, portfolioPda);
    let userOwnedUSDCAccount = await this.getAccountForMintAndPDA(MOCK.DEV.SABER_USDC, owner);

    let ix: TransactionInstruction = await this.solbondProgram.instruction.transferRedeemedToUser(
        new BN(this.portfolioBump),
        //new BN(amount),
        {
            accounts: {
                portfolioPda: portfolioPda,
                portfolioOwner: owner,
                userOwnedUserA: userOwnedUSDCAccount,
                pdaOwnedUserA: pdaUSDCAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        }
    )
    return ix;
}
