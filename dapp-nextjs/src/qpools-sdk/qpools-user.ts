/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
import {Connection, Keypair, PublicKey, Signer, Transaction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {IWallet, tou64} from "@invariant-labs/sdk";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import assert from "assert";
import {Key} from "readline";
import {Sign} from "crypto";
import {BondPoolAccount} from "./types/bondPoolAccount";
import {getSolbondProgram} from "./program";
import {createAssociatedTokenAccountSendUnsigned} from "./utils";

// can't remember what this is
export interface Tickmap {
    bitmap: Array<number>
}


export class QPoolsUser {

    public connection: Connection;
    public wallet: IWallet;
    public walletPayer: Keypair;
    public solbondProgram: Program;
    public provider: Provider;

    // Accounts
    // @ts-ignore
    public qPoolAccount: PublicKey;
    // @ts-ignore
    public bumpQPoolAccount: number;
    public QPTokenMint: Token;
    public currencyMint: Token;

    // @ts-ignore
    public qPoolQPAccount: PublicKey;
    // @ts-ignore
    public purchaserCurrencyAccount: PublicKey;
    // @ts-ignore
    public purchaserQPTAccount: PublicKey;
    // @ts-ignore
    public qPoolCurrencyAccount: PublicKey;

    constructor(
        provider: Provider,
        // wallet: IWallet,
        connection: Connection,

        QPTokenMint: Token,
        currencyMint: Token,

    ) {
        this.connection = connection;
        this.wallet = provider.wallet;
        this.provider = provider;
        this.solbondProgram = getSolbondProgram(this.connection, this.provider);

        //@ts-expect-error
        this.walletPayer = this.wallet.payer as Keypair;

        PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))],
            this.solbondProgram.programId
        ).then(([_qPoolAccount, _bumpQPoolAccount] ) => {
            this.qPoolAccount = _qPoolAccount ;
            this.bumpQPoolAccount = _bumpQPoolAccount;
        });

        // Add the bond pool account here too
        this.QPTokenMint = QPTokenMint;  // TODO Also hardcode this somewhere else probably
        this.currencyMint = currencyMint;

        this.loadExistingQPTReserve();

        // this.qPoolAccount = null;
        // this.bumpQPoolAccount = null;
        // this.qPoolQPAccount = null;
        // this.purchaserCurrencyAccount = null;
        // this.purchaserQPTAccount = null;
        // this.qPoolCurrencyAccount = null;
    }

    async loadExistingQPTReserve() {
        console.log("Fetching QPT reserve...");
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))],
            this.solbondProgram.programId
        );

        // Get the token account
        console.log("qPoolAccount", this.qPoolAccount.toString());
        // @ts-ignore
        let bondPoolAccount = (await this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount)) as BondPoolAccount;

        // Check if this is empty.
        // If empty, return false

        this.currencyMint = new Token(
            this.connection,
            bondPoolAccount.bondPoolCurrencyTokenAccount,
            this.solbondProgram.programId,
            this.walletPayer
        );
        this.QPTokenMint = new Token(
            this.connection,
            bondPoolAccount.bondPoolCurrencyTokenMint,
            this.solbondProgram.programId,
            this.walletPayer
        );
        this.qPoolQPAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
        this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;

    }

    async registerAccount() {
        console.log("Registering account..");
        // Purchaser
        if (!this.qPoolQPAccount) {
            this.qPoolQPAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.QPTokenMint.publicKey,
                this.qPoolAccount,
                this.provider.wallet
            );
        }
        if (!this.qPoolCurrencyAccount) {
            this.qPoolCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.currencyMint.publicKey,
                this.qPoolAccount,
                this.provider.wallet
            );
        }
        // Create the reserve account, if none exists
        // console.log("Going to create the this.purchaserCurrencyAccount");
        if (!this.purchaserCurrencyAccount) {
            this.purchaserCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.currencyMint.publicKey,
                this.wallet.publicKey,
                this.wallet
            );
        }
        // Same for the currency mint account, if none exists
        // console.log("Going to create the this.purchaserQPTAccount");
        if (!this.purchaserQPTAccount) {
            this.purchaserQPTAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.QPTokenMint.publicKey,
                this.wallet.publicKey,
                this.wallet
            );
        }
    }

    async buyQPT(currency_amount_raw: number) {

        if (!(currency_amount_raw > 0)) {
            // TODO: Also implement this in the contract
            console.log("Cannot buy negative token amounts!");
            return false;
        }

        console.log("Sending RPC call");
        console.log("Transfers (Before)");
        console.log("(Currency Mint PK) when buying QPT: ", this.currencyMint.publicKey);

        let beforeQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
        let beforeQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let beforeCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let beforeCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;

        const tx = await this.solbondProgram.rpc.purchaseBond(
            new BN(currency_amount_raw),
            {
                accounts: {

                    bondPoolAccount: this.qPoolAccount,

                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,

                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,

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
        await this.connection.confirmTransaction(tx);

        let afterQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
        let afterQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let afterCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let afterCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;

        // console.log("afterQptFromAmount", afterQptFromAmount.toString());
        // console.log("afterQptTargetAmount", afterQptTargetAmount.toString());
        // console.log("afterCurrencyFromAmount", afterCurrencyFromAmount.toString());
        // console.log("afterCurrencyTargetAmount", afterCurrencyTargetAmount.toString());

        assert.ok(beforeCurrencyFromAmount.eq(afterQptTargetAmount), String("(T1) " + beforeQptFromAmount.toString() + " " + afterQptTargetAmount.toString()));
        assert.ok(beforeQptTargetAmount.eq(afterQptFromAmount), String("(T2) " + beforeQptTargetAmount.toString() + " " + afterQptFromAmount.toString()));
        assert.ok(beforeCurrencyFromAmount.eq(afterCurrencyTargetAmount), String("(T3) " + beforeCurrencyFromAmount.toString() + " " + afterCurrencyTargetAmount.toString()));
        assert.ok(beforeCurrencyTargetAmount.eq(afterCurrencyFromAmount), String("(T4) " + beforeCurrencyTargetAmount.toString() + " " + afterCurrencyFromAmount.toString()));

        // Make sure in the end that the token currency account has funds now
        assert.ok(afterCurrencyTargetAmount > tou64(0), String("(T5)" + afterCurrencyTargetAmount.toString()));
        // console.log("Bond pool currency account is: ", this.qPoolCurrencyAccount.toString());

    }

    async redeemQPT(qpt_amount_raw: number) {

        console.log("Redeeming ", qpt_amount_raw);

        if (!(qpt_amount_raw > 0)) {
            // TODO: Also implement this in the contract
            console.log("Cannot buy negative token amounts!");
            return
        }

        // console.log("Sending RPC call");
        // console.log("Transfers (Before)");
        // console.log("(Currency Mint PK) when buying QPT: ", this.currencyMint.publicKey);

        let beforeQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
        let beforeQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let beforeCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let beforeCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;

        // console.log("beforeQptFromAmount", beforeQptFromAmount.toString());
        // console.log("beforeQptTargetAmount", beforeQptTargetAmount.toString());
        // console.log("beforeCurrencyFromAmount", beforeCurrencyFromAmount.toString());
        // console.log("beforeCurrencyTargetAmount", beforeCurrencyTargetAmount.toString());

        // console.log("Currency mint is: ", this.currencyMint.publicKey.toString());

        const initializeTx = await this.solbondProgram.rpc.redeemBond(
            // Need to assign less than there is ...
            new BN(qpt_amount_raw),
            {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    purchaser: this.wallet.publicKey,
                    purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount,
                    purchaserRedeemableTokenAccount: this.purchaserQPTAccount,

                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                // @ts-expect-error
                signers: [this.provider.wallet.payer as Keypair]
            }
        );
        await this.connection.confirmTransaction(initializeTx);

        let afterQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
        let afterQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
        let afterCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
        let afterCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;

        // console.log("afterQptFromAmount", afterQptFromAmount.toString());
        // console.log("afterQptTargetAmount", afterQptTargetAmount.toString());
        // console.log("afterCurrencyFromAmount", afterCurrencyFromAmount.toString());
        // console.log("afterCurrencyTargetAmount", afterCurrencyTargetAmount.toString());

        // TODO: Gotta modify all these value to account for redeem

        // assert.ok(beforeCurrencyFromAmount.eq(afterQptTargetAmount), String("(T1) " + beforeQptFromAmount.toString() + " " + afterQptTargetAmount.toString()));
        // assert.ok(beforeQptTargetAmount.eq(afterQptFromAmount), String("(T2) " + beforeQptTargetAmount.toString() + " " + afterQptFromAmount.toString()));
        // assert.ok(beforeCurrencyFromAmount.eq(afterCurrencyTargetAmount), String("(T3) " + beforeCurrencyFromAmount.toString() + " " + afterCurrencyTargetAmount.toString()));
        // assert.ok(beforeCurrencyTargetAmount.eq(afterCurrencyFromAmount), String("(T4) " + beforeCurrencyTargetAmount.toString() + " " + afterCurrencyFromAmount.toString()));

        // Make sure in the end that the token currency account has funds now

        // assert.ok(afterCurrencyTargetAmount > tou64(0), String("(T5)" + afterCurrencyTargetAmount.toString()));

        // console.log("Bond pool currency account is: ", this.qPoolCurrencyAccount.toString());

    }

}
