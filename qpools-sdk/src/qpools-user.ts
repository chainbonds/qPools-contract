/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
import {Connection, Keypair, PublicKey, Transaction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {BondPoolAccount} from "./types/bondPoolAccount";
import {getSolbondProgram} from "./solbond-program";
import {createAssociatedTokenAccountSendUnsigned, IWallet} from "./utils";
import {SEED} from "./seeds";

export class QPoolsUser {

    public connection: Connection;
    public wallet: IWallet;
    public walletPayer: Keypair;
    public solbondProgram: Program;
    public provider: Provider;

    // @ts-ignore
    public tvlAccount: PublicKey;
    // @ts-ignore
    public bumpTvlAccount: number;

    // Accounts
    // @ts-ignore
    public qPoolAccount: PublicKey;
    // @ts-ignore
    public bumpQPoolAccount: number;
    // @ts-ignore
    public QPTokenMint: Token;
    // @ts-ignore
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
        currencyMint: Token,
    ) {
        this.connection = connection;
        this.wallet = provider.wallet;
        this.provider = provider;
        this.solbondProgram = getSolbondProgram(this.connection, this.provider);

        //@ts-expect-error
        this.walletPayer = this.wallet.payer as Keypair;

        if (!currencyMint) {
            throw Error("Currency mint is empty!");
        }
        if (!currencyMint.publicKey) {
            throw Error("Currency mint pubkey is empty!");
        }
        // Add the bond pool account here too
        this.currencyMint = currencyMint;

        PublicKey.findProgramAddress(
            [this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.BOND_POOL_ACCOUNT))],
            this.solbondProgram.programId
        ).then(([_qPoolAccount, _bumpQPoolAccount]) => {

            PublicKey.findProgramAddress(
                [_qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.TVL_INFO_ACCOUNT))],
                this.solbondProgram.programId
            ).then(([tvlAccount, bumpTvlAccount]) => {
                this.tvlAccount = tvlAccount;
                this.bumpTvlAccount = bumpTvlAccount;
            });

            this.qPoolAccount = _qPoolAccount;
            this.bumpQPoolAccount = _bumpQPoolAccount;
        });

        this.loadExistingQPTReserve(this.currencyMint.publicKey).then(() => {
            console.log("Successfully loaded QPT Reserve!");

        }).catch((error: any) => {
            console.log("error loading existing QPT reserve!");
            console.log(JSON.stringify(error));

        });

        // this.qPoolAccount = null;
        // this.bumpQPoolAccount = null;
        // this.qPoolQPAccount = null;
        // this.purchaserCurrencyAccount = null;
        // this.purchaserQPTAccount = null;
        // this.qPoolCurrencyAccount = null;
    }

    async loadExistingQPTReserve(currencyMintPubkey: PublicKey) {
        console.log("Fetching QPT reserve...");
        if (!currencyMintPubkey) {
            throw Error("currencyMintPubkey is empty!");
        }
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [currencyMintPubkey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.BOND_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );
        [this.tvlAccount, this.bumpTvlAccount] = await PublicKey.findProgramAddress(
            [this.qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.TVL_INFO_ACCOUNT))],
            this.solbondProgram.programId
        );

        // Get the token account
        console.log("qPoolAccount", this.qPoolAccount.toString());
        // @ts-ignore
        let bondPoolAccount = (await this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount)) as BondPoolAccount;

        if (!bondPoolAccount.bondPoolCurrencyTokenMint.equals(currencyMintPubkey)) {
            console.log(bondPoolAccount.bondPoolCurrencyTokenMint.toString());
            console.log(currencyMintPubkey.toString());
            throw Error("mint is not the same!: " + currencyMintPubkey.toString());
        }

        // Check if this is empty.
        // If empty, return false
        this.currencyMint = new Token(
            this.connection,
            bondPoolAccount.bondPoolCurrencyTokenMint,
            this.solbondProgram.programId,
            this.walletPayer
        );
        this.QPTokenMint = new Token(
            this.connection,
            bondPoolAccount.bondPoolRedeemableMint,
            this.solbondProgram.programId,
            this.walletPayer
        );
        this.qPoolQPAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
        this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;

        console.log("Pretty printing loaded accounts...");
        await this.prettyPrintAccounts();
    }

    async registerAccount() {
        console.log("Registering account..");
        // Purchaser
        if (!this.qPoolQPAccount) {
            console.log("Creating a qPoolQPAccount");
            console.log("this.QPTokenMint", this.QPTokenMint);
            this.qPoolQPAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.QPTokenMint!.publicKey,
                this.qPoolAccount,
                this.provider.wallet
            );
            console.log("Done!");
        }
        if (!this.qPoolCurrencyAccount) {
            console.log("Creating a qPoolCurrencyAccount");
            this.qPoolCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.currencyMint!.publicKey,
                this.qPoolAccount,
                this.provider.wallet
            );
            console.log("Done!");
        }
        // Create the reserve account, if none exists
        // console.log("Going to create the this.purchaserCurrencyAccount");
        if (!this.purchaserCurrencyAccount) {
            console.log("Creating a purchaserCurrencyAccount");
            this.purchaserCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.currencyMint!.publicKey,
                this.wallet.publicKey,
                this.wallet
            );
            console.log("Done!");
        }
        // Same for the currency mint account, if none exists
        // console.log("Going to create the this.purchaserQPTAccount");
        if (!this.purchaserQPTAccount) {
            console.log("Creating a purchaserQPTAccount");
            this.purchaserQPTAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.QPTokenMint!.publicKey,
                this.wallet.publicKey,
                this.wallet
            );
            console.log("Done!");
        }
    }

    // Probably better to store all of this in a struct ... instead of different addresses.
    // Otherwise way too confusing
    prettyPrintAccounts() {
        console.log("solbondProgram", this.solbondProgram.programId.toString());
        console.log("wallet", this.wallet.publicKey.toString());

        console.log("🟢 qPoolAccount", this.qPoolAccount!.toString());
        console.log("🟢 bumpQPoolAccount", this.bumpQPoolAccount!.toString());

        console.log("🌊 QPTokenMint", this.QPTokenMint!.publicKey.toString());
        console.log("🌊 qPoolQPAccount", this.qPoolQPAccount!.toString());

        console.log("💵 currencyMint", this.currencyMint.publicKey.toString());
        console.log("💵 qPoolCurrencyAccount", this.qPoolCurrencyAccount!.toString());
    }

}
