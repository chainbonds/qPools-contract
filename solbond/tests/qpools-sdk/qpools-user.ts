/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
import {Connection, Keypair, PublicKey, Signer, Transaction} from "@solana/web3.js";
import {BN, Program, Provider, Wallet, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {IWallet, tou64} from "@invariant-labs/sdk";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import assert from "assert";
import {createTokenAccount} from "../utils";
import {getOrCreateAssociatedTokenAccount} from "../../../dapp/src/programs/anchor";
import {Key} from "readline";
import {Sign} from "crypto";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountSendUnsigned,
    getAssociatedTokenAddressOffCurve
} from "./splpasta/tx/associated-token-account";

// can't remember what this is
export interface Tickmap {
    bitmap: Array<number>
}


export class QPoolsUser {

    public connection: Connection;
    public wallet: IWallet;
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
        // wallet: IWallet,
        connection: Connection,

        bondPoolAccount: PublicKey,
        QPTMint: Token,
        currencyMint: Token,

    ) {
        this.connection = connection;
        this.wallet = provider.wallet;
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
            console.log("('''qPoolAccount) here: ", this.bondPoolAccount.toString());
            // this.provider
            await createAssociatedTokenAccountSendUnsigned(this.connection, this.QPTMint.publicKey, this.bondPoolAccount, this.wallet);
            this.bondPoolQPTAccount = await getAssociatedTokenAddressOffCurve(this.QPTMint.publicKey, this.bondPoolAccount);
            console.log("('''qPoolCurrencyAccount) 1.1", this.bondPoolQPTAccount.toString());
            this.bondPoolQPTAccount = await getAssociatedTokenAddressOffCurve(this.QPTMint.publicKey, this.bondPoolAccount);
            console.log("('''qPoolCurrencyAccount) 2.1", this.bondPoolQPTAccount.toString())
        }
        if (!this.bondPoolCurrencyAccount) {
            // Create the reserve account, if none exists
            // console.log("Going to create the this.bondPoolCurrencyAccount");
            this.bondPoolCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(this.connection, this.currencyMint.publicKey, this.bondPoolAccount, this.wallet);
        }
        // Purchaser
        if (!this.purchaserCurrencyAccount) {
            // Create the reserve account, if none exists
            // console.log("Going to create the this.purchaserCurrencyAccount");
            this.purchaserCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(this.connection, this.currencyMint.publicKey, this.wallet.publicKey, this.wallet);
        }
        if (!this.purchaserQPTAccount) {
            // Same for the currency mint account, if none exists
            // console.log("Going to create the this.purchaserQPTAccount");
            this.purchaserQPTAccount = await createAssociatedTokenAccountSendUnsigned(this.connection, this.QPTMint.publicKey, this.wallet.publicKey, this.wallet);
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

        console.log("Sending RPC call");
        console.log("Transfers (Before)");
        console.log("(Currency Mint PK) when buying QPT: ", this.currencyMint.publicKey.toString());

        let beforeQptFromAmount = (await this.QPTMint.getAccountInfo(this.bondPoolQPTAccount)).amount;
        let beforeQptTargetAmount = (await this.QPTMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let beforeCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let beforeCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.bondPoolCurrencyAccount)).amount;

        console.log("Error is: ");

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
                // @ts-expect-error
                signers: [this.provider.wallet.payer as Keypair]
            }
        );

        let afterQptFromAmount = (await this.QPTMint.getAccountInfo(this.bondPoolQPTAccount)).amount;
        let afterQptTargetAmount = (await this.QPTMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let afterCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let afterCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.bondPoolCurrencyAccount)).amount;

        console.log("afterQptFromAmount", afterQptFromAmount.toString());
        console.log("afterQptTargetAmount", afterQptTargetAmount.toString());
        console.log("afterCurrencyFromAmount", afterCurrencyFromAmount.toString());
        console.log("afterCurrencyTargetAmount", afterCurrencyTargetAmount.toString());

        assert.ok(beforeCurrencyFromAmount.eq(afterQptTargetAmount), String("(T1) " + beforeQptFromAmount.toString() + " " + afterQptTargetAmount.toString()));
        assert.ok(beforeQptTargetAmount.eq(afterQptFromAmount), String("(T2) " + beforeQptTargetAmount.toString() + " " + afterQptFromAmount.toString()));
        assert.ok(beforeCurrencyFromAmount.eq(afterCurrencyTargetAmount), String("(T3) " + beforeCurrencyFromAmount.toString() + " " + afterCurrencyTargetAmount.toString()));
        assert.ok(beforeCurrencyTargetAmount.eq(afterCurrencyFromAmount), String("(T4) " + beforeCurrencyTargetAmount.toString() + " " + afterCurrencyFromAmount.toString()));

        // Make sure in the end that the token currency account has funds now
        assert.ok(afterCurrencyTargetAmount > tou64(0), String("(T5)" + afterCurrencyTargetAmount.toString()));
        console.log("Bond pool currency account is: ", this.bondPoolCurrencyAccount.toString());


    }

}
