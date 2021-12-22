import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import {Amm, IDL} from "@invariant-labs/sdk/src/idl/amm";
import * as anchor from "@project-serum/anchor";
import {
    calculate_price_sqrt,
    DENOMINATOR,
    IWallet,
    Market,
    MAX_TICK,
    MIN_TICK,
    Network,
    Pair,
    SEED,
    TICK_LIMIT, tou64
} from "@invariant-labs/sdk";
import {CreatePool, Decimal, FeeTier, Tick,} from "@invariant-labs/sdk/lib/market";
import * as net from "net";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {createStandardFeeTiers, createToken} from "../invariant-utils";
import {FEE_TIERS, fromFee} from "@invariant-labs/sdk/lib/utils";
import {createMint, createTokenAccount} from "../utils";
import {Key} from "readline";

import {assert} from "chai";
import {PoolStructure, Position, PositionList} from "@invariant-labs/sdk/lib/market";
import {UnderlyingSinkAbortCallback} from "stream/web";

export class QPoolsAdmin {

    public connection: Connection;
    public solbondProgram: Program;
    public invariantProgram: Program<Amm>;
    public provider: Provider;
    public wallet: Keypair;

    // All tokens not owned by the protocol
    public currencyMint: Token;  // We will only have a single currency across one qPool

    // All tokens owned by the protocol
    public qPoolAccount: PublicKey | null = null;  // qPool Account
    public bumpQPoolAccount: number | null = null;

    public QPTokenMint: Token;  // qPool `redeemable` tokens
    public qPoolQPAccount: PublicKey;
    public qPoolCurrencyAccount: PublicKey;

    public pairs: Pair[];
    public mockMarket: Market;
    public feeTier: FeeTier;

    public QPReserveTokens: Record<string, PublicKey> = {};


    constructor(
        wallet: IWallet,
        connection: Connection,
        provider: Provider,
        currencyMint: Token
    ) {
        this.connection = connection;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = anchor.workspace.Amm as Program<Amm>;
        this.provider = provider;
        this.currencyMint = currencyMint;

        // @ts-expect-error
        this.wallet = provider.wallet.payer as Keypair

        this.feeTier = {
            fee: fromFee(new BN(600)),
            tickSpacing: 10
        }

        // Do a bunch of assert OKs
    }


    /**
     *
     * @param currencyMint: Will be provided, is the currency that will be used
     */
    async get(pair: Pair) {
        const address = await pair.getAddress(this.invariantProgram.programId)
        return (await this.invariantProgram.account.pool.fetch(address)) as PoolStructure
    }

    async createQPTReservePoolAccounts(
        positionOwner: Keypair
    ) {

        this.pairs.map(async (pair: Pair) => {

            const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, positionOwner);
            const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, positionOwner);

            // TODO: Implement
            // Create qPool Accounts as a side-products.
            // I think these should be done somewhere separate!
            const qPoolsTokenX = await tokenX.createAccount(positionOwner.publicKey);
            const qPoolsTokenY = await tokenY.createAccount(positionOwner.publicKey);

        });

    }

    async initializeQPTReserve(initializer: Keypair) {

        // Generate qPoolAccount
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [initializer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            this.solbondProgram.programId
        );

        // Generate Redeemable Mint which is owned by the program
        this.QPTokenMint = await createMint(
            this.provider,
            initializer,
            this.qPoolAccount,
            9
        );

        // Create QPT Token Accounts
        this.qPoolQPAccount = await this.QPTokenMint!.createAccount(this.qPoolAccount);
        this.qPoolCurrencyAccount = await this.currencyMint.createAccount(this.qPoolAccount);

        /* Now make the RPC call, to initialize a qPool */
        const initializeTx = await this.solbondProgram.rpc.initializeBondPool(
            this.bumpQPoolAccount,
            {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    initializer: initializer.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [initializer]
            }
        );
        await this.provider.connection.confirmTransaction(initializeTx);

        // TODO: Do a bunch of asserts?

    }

    async setPairs(pairs) {
        this.pairs = pairs;
    }

    async swapToAllPairs(initializer: Keypair) {

        // For every pair in our token account, we need to
        for (let i = 0; i < this.pairs.length; i++) {
            let pair = this.pairs[i];

            console.log("Looking at pair: ", pair.tokenX.toString(), pair.tokenY.toString())

            // Get the oracle price for every pair

            // Get the ratio for each pair

            // Check how much was swapped already

            // Swap the rest / difference of this
            // Rename `mockMarket` with `market` everywhere
            // this.mockMarket.poo

            const poolAddress = await pair.getAddress(this.invariantProgram.programId);

            // Create a tokenX, and tokenY account for us, and
            const pool = await this.get(pair);

            // Create a token for our QP Reserve
            // If a token exists already, save it in the dictionary
            const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, initializer);
            const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, initializer);
            console.log("Creating token accounts");
            const QPtokenXAccount = await tokenX.createAccount(this.qPoolAccount);
            console.log("")
            const QPtokenYAccount = await tokenY.createAccount(this.qPoolAccount);

            assert.ok(
                (await tokenX.getAccountInfo(QPtokenXAccount)).mint.equals(tokenX.publicKey),
                ("1 " + (await tokenX.getAccountInfo(QPtokenXAccount)).mint.toString() + ", " + tokenX.publicKey.toString())
            );
            assert.ok(
                (await tokenY.getAccountInfo(QPtokenYAccount)).mint.equals(tokenY.publicKey),
                ("2 " + (await tokenY.getAccountInfo(QPtokenYAccount)).mint.toString() + ", " + tokenY.publicKey.toString())
            );

            assert.ok(
                (await tokenX.getAccountInfo(pool.tokenXReserve)).mint.equals(tokenX.publicKey),
                ("3 " + (await tokenX.getAccountInfo(pool.tokenXReserve)).mint.toString() + ", " + tokenX.publicKey.toString())
            );
            assert.ok(
                (await tokenY.getAccountInfo(pool.tokenYReserve)).mint.equals(tokenY.publicKey),
                ("4 " + (await tokenY.getAccountInfo(pool.tokenYReserve)).mint.toString() + ", " + tokenY.publicKey.toString())
            );

            console.log("Inputs are: ");
            console.log("Inputs are: ",
                // xToY: bool,
                true,
                // amount: u64,
                tou64(2_000_000),
                // by_amount_in: bool,
                true,
                // sqrt_price_limit: u128,
                1_000_000,
            );
            console.log(
                {
                    initializer: initializer.publicKey.toString(),

                    tickmap: pool.tickmap.toString(),
                    token_x_mint: pair.tokenX.toString(),
                    token_y_mint: pair.tokenY.toString(),
                    reserve_account_x: pool.tokenXReserve.toString(),
                    reserve_account_y: pool.tokenYReserve.toString(),
                    account_x: QPtokenXAccount.toString(),  // this.qPoolCurrencyAccount.toString(),
                    account_y: QPtokenYAccount.toString(),

                    pool: poolAddress.toString(),

                    state: this.mockMarket.stateAddress.toString(),
                    program_authority: this.mockMarket.programAuthority.toString(),

                    token_program: TOKEN_PROGRAM_ID.toString(),
                    invariant_program: this.invariantProgram.programId.toString(),
                    system_program: web3.SystemProgram.programId.toString(),
                }
            )


            await this.solbondProgram.rpc.swapPair(
                // xToY: boolea,
                true,
                // amount: u64,
                new BN(2_000_000),
                // by_amount_in: bool,
                true,
                // sqrt_price_limit: u128,
                new BN(1_000_000_000_000),
                {
                    accounts: {
                        initializer: initializer.publicKey,

                        pool: poolAddress,
                        state: this.mockMarket.stateAddress,
                        tickmap: pool.tickmap,


                        tokenXMint: pair.tokenX,
                        tokenYMint: pair.tokenY,

                        reserveAccountX: pool.tokenXReserve,
                        reserveAccountY: pool.tokenYReserve,

                        accountX: this.qPoolCurrencyAccount,  // ,  // this.QPReserveTokens[pair.tokenY.toString()]
                        accountY: QPtokenYAccount,  //


                        programAuthority: this.mockMarket.programAuthority,

                        tokenProgram: TOKEN_PROGRAM_ID,
                        invariantProgram: this.invariantProgram.programId,
                        systemProgram: web3.SystemProgram.programId,
                    },
                    signers: [initializer]
                }
            );

        }

        // pub fn swap_pair(
        //     ctx: Context<SwapPairInstruction>,

        // )

        // Later on we should probably remove initializer from the seeds completely, then anyone can call this
        // And the user could prob get some governance tokens out of it ...

        // initializer
        // pool
        // state
        // tickmap
        // token_x_mint
        // token_y_mint
        // reserve_account_x
        // reserve_account_y
        // account_x
        // account_y
        // program_authority
        // token_program
        // invariant_program
        // system_program

    }


}
