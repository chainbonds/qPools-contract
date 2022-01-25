import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {QPair} from "@qpools/sdk/src/q-pair";
// @ts-ignore
import {
    BondPoolAccount,
    createAssociatedTokenAccountSendUnsigned,
    getAssociatedTokenAddressOffCurve,
    createMint,
    getPayer,
    getSolbondProgram
} from "@qpools/sdk";
import {NETWORK} from "@qpools/sdk/lib/cluster";
import {IWallet} from "@qpools/sdk/lib/utils";
import {SEED} from "@qpools/sdk/lib/seeds";


function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class QPoolsAdmin {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public wallet: Keypair;

    // All tokens not owned by the protocol
    public currencyMint: Token;  // We will only have a single currency across one qPool

    // All tokens owned by the protocol
    public qPoolAccount: PublicKey | null = null;  // qPool Account
    public bumpQPoolAccount: number | null = null;

    public QPTokenMint: Token | undefined;  // qPool `redeemable` tokens
    public qPoolQPAccount: PublicKey | undefined;
    public qPoolCurrencyAccount: PublicKey | undefined;

    public tvlAccount: PublicKey |  null = null;
    public bumpTvlAccount: number | null = null;

    public pairs: QPair[] | undefined;

    public QPReserveTokens: Record<string, PublicKey> = {};

    constructor(
        connection: Connection,
        provider: Provider,
        currencyMint: PublicKey,
        network: NETWORK = NETWORK.LOCALNET
    ) {
        this.connection = connection;

        this.solbondProgram = getSolbondProgram(connection, provider, network);
        this.provider = provider;

        // @ts-expect-error
        this.wallet = provider.wallet.payer as Keypair

        // Assert that currencyMint is truly a mint
        this.currencyMint = new Token(
            this.connection,
            currencyMint,
            this.solbondProgram.programId,
            this.wallet
        );

    }

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

    async loadExistingQPTReserve() {
        console.log("Fetching QPT reserve...");
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.BOND_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );

        // Get the token account
        let bondPoolAccount: BondPoolAccount;
        try {
            bondPoolAccount = (await this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount)) as BondPoolAccount;
        } catch (error: any) {
            console.log("Couldn't catch bondPoolAccount");
            console.log(JSON.stringify(error));
            console.log(error);
            return false
        }
        if (!bondPoolAccount) {
            return false
        }

        // Check if this is empty.
        // If empty, return false
        this.currencyMint = new Token(
            this.connection,
            bondPoolAccount.bondPoolCurrencyTokenMint,
            this.solbondProgram.programId,
            this.wallet
        );
        this.QPTokenMint = new Token(
            this.connection,
            bondPoolAccount.bondPoolRedeemableMint,
            this.solbondProgram.programId,
            this.wallet
        );
        this.qPoolQPAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
        this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;

        return true;

    }

    async initializeQPTReserve() {

        // Currency mint should be part of the PDA

        // Generate qPoolAccount
        console.log("BEGIN: initializeQPTReserve");

        console.log("Using seeds: ");
        console.log(SEED.BOND_POOL_ACCOUNT);
        console.log(SEED.TVL_INFO_ACCOUNT);
        console.log(this.currencyMint.publicKey.toString());

        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.BOND_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );
        [this.tvlAccount, this.bumpTvlAccount] = await PublicKey.findProgramAddress(
            [this.qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.TVL_INFO_ACCOUNT))],
            this.solbondProgram.programId
        );

        console.log("Retrieved accounts: ");
        console.log(this.qPoolAccount.toString());
        console.log(this.tvlAccount.toString());

        this.QPTokenMint = await createMint(
            this.provider,
            this.wallet,
            this.qPoolAccount,
            9
        );

        await delay(1_000);
        this.qPoolQPAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            this.QPTokenMint.publicKey,
            this.qPoolAccount,
            this.provider.wallet
        );
        this.qPoolCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            this.currencyMint.publicKey,
            this.qPoolAccount,
            this.provider.wallet
        );
        /* Now make the RPC call, to initialize a qPool */
        const initializeTx = await this.solbondProgram.rpc.initializeBondPool(
            this.bumpQPoolAccount,
            this.bumpTvlAccount,
            {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    initializer: this.wallet.publicKey,
                    tvlAccount: this.tvlAccount,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [this.wallet]
            }
        );
        await this.provider.connection.confirmTransaction(initializeTx);
        console.log("END: initializeQPTReserve");
        // TODO: Do a bunch of asserts?

    }

    async createQPTReservePoolAccounts(
        positionOwner: Keypair,
        payer: IWallet
    ) {

        await Promise.all(
            this.pairs!.map(async (pair: QPair) => {

                const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, positionOwner);
                const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, positionOwner);

                // TODO: Implement
                // Create qPool Accounts as a side-products.
                // I think these should be done somewhere separate!
                await createAssociatedTokenAccountSendUnsigned(
                    this.connection,
                    tokenX.publicKey,
                    positionOwner.publicKey,
                    payer
                );
                await createAssociatedTokenAccountSendUnsigned(
                    this.connection,
                    tokenY.publicKey,
                    positionOwner.publicKey,
                    payer
                );
            })
        )

    }

    async setPairs(pairs: QPair[]) {
        this.pairs = pairs;
    }

}
