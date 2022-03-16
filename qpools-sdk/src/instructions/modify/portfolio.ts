import {Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {getPortfolioPda, getUserCurrencyPda} from "../../types/account/pdas";
import {getAccountForMintAndPDADontCreate} from "../../utils";
import {MOCK} from "../../const";


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
    let ix: TransactionInstruction = await solbondProgram.instruction.approveWithdrawToUser(
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

// TODO: Merge logic
// async transfer_to_portfolio(owner: Keypair, currencyMint: PublicKey, wrappedSolAccount:PublicKey) {
//
//     let [portfolioPDAtmp, bumpPortfoliotmp] = await PublicKey.findProgramAddress(
//         [owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
//         this.solbondProgram.programId
//     );
//     this.portfolio_owner = owner.publicKey
//     this.portfolioPDA = portfolioPDAtmp
//     this.portfolioBump = bumpPortfoliotmp
//
//     let pdaUSDCAccount = await this.getAccountForMintAndPDA(currencyMint, this.portfolioPDA);
//     console.log("HHH")
//     console.log("pda ", pdaUSDCAccount.toString())
//     let [currencyPDA, bumpCurrency] = await PublicKey.findProgramAddress(
//         [owner.publicKey.toBuffer(),
//             currencyMint.toBuffer() ,
//             Buffer.from(anchor.utils.bytes.utf8.encode(SEED.USER_CURRENCY_STRING))
//         ],
//         this.solbondProgram.programId
//     );
//     // @ts-expect-error
//     let signer = this.provider.wallet.payer as keypair
//     let finaltx = await this.solbondProgram.rpc.transferToPortfolio(
//         new BN(this.portfolioBump),
//         new BN(bumpCurrency),
//         {
//             accounts: {
//                 owner: owner.publicKey,
//                 portfolioPda: this.portfolioPDA,
//                 userOwnedTokenAccount: wrappedSolAccount,
//                 pdaOwnedTokenAccount: pdaUSDCAccount,
//                 userCurrencyPdaAccount: currencyPDA,
//                 tokenMint: currencyMint,
//                 tokenProgram: TOKEN_PROGRAM_ID,
//                 systemProgram: web3.SystemProgram.programId,
//                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//
//             },
//             signers:[owner]
//         }
//     )
//
//     await this.provider.connection.confirmTransaction(finaltx);
//     console.log("send money from user to portfolio: ", finaltx);
//     return finaltx;
//
// }


export async function registerCurrencyInputInPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    amount: u64,
    currencyMint: PublicKey
): Promise<TransactionInstruction> {
    console.log("#registerCurrencyInputInPortfolio");
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
                userCurrencyPdaAccount: currencyPDA,//randomOwner.publicKey,
                currencyMint: currencyMint,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                // Create liquidity accounts
            }
        }
    )
    console.log("##registerCurrencyInputInPortfolio");
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
