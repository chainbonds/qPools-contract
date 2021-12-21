/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { IWallet } from "@invariant-labs/sdk";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {createTokenAccount} from "../utils";
import {create} from "domain";

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
        wallet: IWallet,
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
        // Bond Pool
        if (!this.bondPoolQPTAccount) {
            // Create the reserve account, if none exists
            this.bondPoolQPTAccount = await createTokenAccount(this.provider, this.QPTMint, this.bondPoolAccount);
        }
        if (!this.bondPoolCurrencyAccount) {
            // Create the reserve account, if none exists
            this.bondPoolCurrencyAccount = await createTokenAccount(this.provider, this.currencyMint, this.bondPoolAccount);
        }
        // Purchaser
        if (!this.purchaserCurrencyAccount) {
            // Create the reserve account, if none exists
            this.purchaserCurrencyAccount = await createTokenAccount(this.provider, this.QPTMint, this.bondPoolAccount);
        }
        if (!this.purchaserQPTAccount) {
            // Same for the currency mint account, if none exists
            this.purchaserQPTAccount = await createTokenAccount(this.provider, this.currencyMint, this.bondPoolAccount);
        }
    }

    async buyQPT(
        currency_amount_raw: number
    ) {
        await this.registerAccount();
        // @ts-expect-error
        const signer = this.wallet as Keypair;

        await this.solbondProgram.rpc.purchaseBond(
            currency_amount_raw,
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
                // Add wallet here
            signers: [signer]
        })
    }

}
