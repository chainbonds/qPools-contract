/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {IWallet, tou64} from "@invariant-labs/sdk";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {createTokenAccount} from "../utils";
import {create} from "domain";
import {Key} from "readline";
import assert from "assert";

// can't remember what this is
export interface Tickmap {
    bitmap: Array<number>
}


export class QPoolsUser {

    public connection: Connection;
    public wallet: Keypair;
    public solbondProgram: Program;
    public provider: Provider;

    // Accounts
    public bondPoolAccount: PublicKey;
    public QPTMint: Token;
    public currencyMint: Token;

    public bondPoolQPTAccount: PublicKey;
    public bondPoolCurrencyAccount: PublicKey;

    public purchaserCurrencyAccount: PublicKey;
    public purchaserQPTAccount: PublicKey;

    constructor(
        provider: Provider,
        wallet: Keypair,
        connection: Connection,

        bondPoolAccount: PublicKey,
        QPTMint: Token,
        currencyMint: Token,

    ) {
        this.connection = connection;
        this.wallet = wallet;
        this.solbondProgram = anchor.workspace.Solbond;
        this.provider = provider;

        // Add the bond pool account here too
        this.bondPoolAccount = bondPoolAccount;
        this.QPTMint = QPTMint;
        this.currencyMint = currencyMint;
    }

    async registerAccount() {
        console.log("Registering account..");
        // Bond Pool
        if (!this.bondPoolQPTAccount) {
            // Create the reserve account, if none exists
            // console.log("Going to create the this.bondPoolQPTAccount");
            this.bondPoolQPTAccount = await createTokenAccount(this.provider, this.QPTMint.publicKey, this.bondPoolAccount);
        }
        if (!this.bondPoolCurrencyAccount) {
            // Create the reserve account, if none exists
            // console.log("Going to create the this.bondPoolCurrencyAccount");
            this.bondPoolCurrencyAccount = await createTokenAccount(this.provider, this.currencyMint.publicKey, this.bondPoolAccount);
        }
        // Purchaser
        if (!this.purchaserCurrencyAccount) {
            // Create the reserve account, if none exists
            // console.log("Going to create the this.purchaserCurrencyAccount");
            this.purchaserCurrencyAccount = await createTokenAccount(this.provider, this.currencyMint.publicKey, this.wallet.publicKey);
        }
        if (!this.purchaserQPTAccount) {
            // Same for the currency mint account, if none exists
            // console.log("Going to create the this.purchaserQPTAccount");
            this.purchaserQPTAccount = await createTokenAccount(this.provider, this.QPTMint.publicKey, this.wallet.publicKey);
        }
    }

    async buyQPT(
        currency_amount_raw: number
    ) {

        if (!(currency_amount_raw > 0)) {
            // TODO: Also implement this in the contract
            console.log("Cannot buy negative token amounts!");
            return
        }

        console.log("Inputs are: ");
        console.log(currency_amount_raw);
        console.log({
            bondPoolAccount: this.bondPoolAccount.toString(),
            bondPoolRedeemableMint: this.QPTMint.publicKey.toString(),
            bondPoolCurrencyTokenMint: this.currencyMint.publicKey.toString(),
            bondPoolCurrencyTokenAccount: this.bondPoolCurrencyAccount.toString(),
            bondPoolRedeemableTokenAccount: this.bondPoolQPTAccount.toString(),
            purchaser: this.wallet.publicKey.toString(),
            purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount.toString(),
            purchaserRedeemableTokenAccount: this.purchaserQPTAccount.toString(),
            rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
            clock: web3.SYSVAR_CLOCK_PUBKEY.toString(),
            systemProgram: web3.SystemProgram.programId.toString(),
            tokenProgram: TOKEN_PROGRAM_ID.toString()
        })

        console.log("Sending RPC call");

        let beforeQptFromAmount = (await this.QPTMint.getAccountInfo(this.bondPoolQPTAccount)).amount;
        let beforeQptTargetAmount = (await this.QPTMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let beforeCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let beforeCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.bondPoolCurrencyAccount)).amount;

        console.log("Transfers (Before)");
        console.log("Currency mint PK: ", this.QPTMint.publicKey.toString());
        console.log("QPT Account From ", (await this.QPTMint.getAccountInfo(this.bondPoolQPTAccount)).amount.toString());
        console.log("QPT Account To ", (await this.QPTMint.getAccountInfo(this.purchaserQPTAccount)).amount.toString());
        console.log("Currency Account From ", (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount.toString());
        console.log("Currency Account To ", (await this.currencyMint.getAccountInfo(this.bondPoolCurrencyAccount)).amount.toString());

        await this.solbondProgram.rpc.purchaseBond(
            new BN(currency_amount_raw),
            {
                accounts: {

                    bondPoolAccount: this.bondPoolAccount,

                    bondPoolRedeemableMint: this.QPTMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,

                    bondPoolCurrencyTokenAccount: this.bondPoolCurrencyAccount,
                    bondPoolRedeemableTokenAccount: this.bondPoolQPTAccount,

                    purchaser: this.wallet.publicKey,
                    purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount,
                    purchaserRedeemableTokenAccount: this.purchaserQPTAccount,

                    // The standard accounts on top
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [this.wallet as Signer]
            }
        );

        let afterQptFromAmount = (await this.QPTMint.getAccountInfo(this.bondPoolQPTAccount)).amount;
        let afterQptTargetAmount = (await this.QPTMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let afterCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let afterCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.bondPoolCurrencyAccount)).amount;

        console.log("Transfers (After)");
        console.log("QPT Account From ", (await this.QPTMint.getAccountInfo(this.bondPoolQPTAccount)).amount.toString());
        console.log("QPT Account To ", (await this.QPTMint.getAccountInfo(this.purchaserQPTAccount)).amount.toString());
        console.log("Currency Account From ", (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount.toString());
        console.log("Currency Account To ", (await this.currencyMint.getAccountInfo(this.bondPoolCurrencyAccount)).amount.toString());
        assert.ok(beforeCurrencyFromAmount.eq(afterQptTargetAmount), String("(T1) " + beforeQptFromAmount.toString() + " " + afterQptTargetAmount.toString()));
        assert.ok(beforeQptTargetAmount.eq(afterQptFromAmount), String("(T2) " + beforeQptTargetAmount.toString() + " " + afterQptFromAmount.toString()));
        assert.ok(beforeCurrencyFromAmount.eq(afterCurrencyTargetAmount), String("(T3) " + beforeCurrencyFromAmount.toString() + " " + afterCurrencyTargetAmount.toString()));
        assert.ok(beforeCurrencyTargetAmount.eq(afterCurrencyFromAmount), String("(T4) " + beforeCurrencyTargetAmount.toString() + " " + afterCurrencyFromAmount.toString()));


    }

}
