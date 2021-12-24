import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, utils, Wallet, web3} from "@project-serum/anchor";
import {Amm, IDL} from "@invariant-labs/sdk/src/idl/amm";
import * as anchor from "@project-serum/anchor";
import {
    calculate_price_sqrt, DENOMINATOR,
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
import {FEE_TIERS, fromFee, toDecimal} from "@invariant-labs/sdk/lib/utils";
import {createMint, createTokenAccount} from "../utils";
import {Key} from "readline";

import {assert, use} from "chai";
import {PoolStructure, Position, PositionList} from "@invariant-labs/sdk/lib/market";
import {UnderlyingSinkAbortCallback} from "stream/web";
import {calculatePriceAfterSlippage} from "@invariant-labs/sdk/lib/math";
import {getInvariantProgram} from "./program";
import {QPair} from "./q-pair";
import {
    createAssociatedTokenAccountSend, createAssociatedTokenAccountSendUnsigned,
    createAssociatedTokenAccountTx,
    getAssociatedTokenAddress, getAssociatedTokenAddressOffCurve
} from "./splpasta/tx/associated-token-account";

export class QPoolsAdmin {

    public connection: Connection;
    public solbondProgram: Program;
    public invariantProgram: Program;  // <Amm>
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
        wallet: Keypair,
        connection: Connection,
        provider: Provider,
        currencyMint: Token
    ) {
        this.connection = connection;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = getInvariantProgram(connection, provider);
        // this.invariantProgram = anchor.workspace.Amm as Program;  //  as Program<Amm>;
        this.provider = provider;
        this.currencyMint = currencyMint;
        console.log("(Currency Mint PK) after registering in Market: ", this.currencyMint.publicKey.toString());

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
        positionOwner: Keypair,
        payer: Wallet
    ) {

        await Promise.all(
            this.pairs.map(async (pair: Pair) => {

                const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, positionOwner);
                const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, positionOwner);

                // TODO: Implement
                // Create qPool Accounts as a side-products.
                // I think these should be done somewhere separate!
                await createAssociatedTokenAccountSend(
                    this.connection,
                    tokenX.publicKey,
                    positionOwner.publicKey,
                    payer
                );
                await createAssociatedTokenAccountSend(
                    this.connection,
                    tokenY.publicKey,
                    positionOwner.publicKey,
                    payer
                );
            })
        )

    }

    async initializeQPTReserve() {

        // Generate qPoolAccount
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [this.wallet.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            this.solbondProgram.programId
        );

        // Generate Redeemable Mint which is owned by the program
        this.QPTokenMint = await createMint(
            this.provider,
            this.wallet,
            this.qPoolAccount,
            9
        );

        console.log('before creating associated token account');
        // const tx = await createAssociatedTokenAccountTx(
        //     this.connection,
        //     this.QPTokenMint.publicKey,
        //     null,
        //     this.qPoolAccount,
        //     this.wallet.publicKey,
        //     //@ts-ignore
        //     false
        // );
        // const signature = await web3.sendAndConfirmTransaction(
        //     this.connection,
        //     tx,
        //     [this.wallet],
        // );


        // const address = await getAssociatedTokenAddressOffCurve(
        //     this.QPTokenMint.publicKey,
        //     owner
        // );
        // const tx = await createAssociatedTokenAccountTx(
        //     this.connection,
        //     this.QPTokenMint.publicKey,
        //     ,
        //     owner,
        //     wallet.publicKey
        // );
        // const signature = await this.provider.wallet.signTransaction(tx);
        // console.log('SIGNATURE', signature);

        // return await wallet.signTransaction(tx);

        // Create QPT Token Accounts
        // this.qPoolQPAccount = await this.QPTokenMint!.createAssociatedTokenAccount(this.qPoolAccount);
        // this.qPoolCurrencyAccount = await this.currencyMint.createAssociatedTokenAccount(this.qPoolAccount);
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
            {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    initializer: this.wallet.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [this.wallet]
            }
        );
        await this.provider.connection.confirmTransaction(initializeTx);

        // TODO: Do a bunch of asserts?

    }

    async setPairs(pairs) {
        this.pairs = pairs;
    }

    /**
     * The admin user is making these transactions
     *
     * For every pair in our token account, we need to
     * Get the oracle price for every pair
     * Get the ratio for each pair
     * Check how much was swapped already
     * Swap the rest / difference of this
     * Rename `mockMarket` with `market` everywhere
     *
     * @param initializer
     */
    async swapToAllPairs(amount) {

        await Promise.all(
            this.pairs.map(async (pair: QPair) => {
                // console.log("Looking at pair: ", pair.tokenX.toString(), pair.tokenY.toString());
                console.log("(tokenX) when swapping to Pairs: ", pair.tokenX.toString());
                console.log("(tokenY) when swapping to Pairs: ", pair.tokenY.toString());

                assert.ok(
                    pair.tokenX.equals(pair.currencyMint) || pair.tokenY.equals(pair.currencyMint)
                );

                // Create token accounts for the
                const poolAddress = await pair.getAddress(this.invariantProgram.programId);

                // Create a tokenX, and tokenY account for us, and
                const pool = await this.get(pair);

                // // Create a token for our QP Reserve
                // // If a token exists already, save it in the dictionary
                const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, this.wallet);
                const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, this.wallet);

                // Must create asset accounts, not QPT!!!
                // We're not fuckily trading QPT tokens. These are only redeemed etc.!!

                console.log("('''qPoolAccount) here: ", this.qPoolAccount.toString());
                const QPTokenXAccount = await getAssociatedTokenAddress(tokenX.publicKey, this.qPoolAccount);
                console.log("('''qPoolCurrencyAccount) 1: ", QPTokenXAccount.toString())
                const QPTokenYAccount = await getAssociatedTokenAddress(tokenY.publicKey, this.qPoolAccount);
                console.log("('''qPoolCurrencyAccount) 2: ", QPTokenYAccount.toString())

                assert.ok(
                    (await tokenX.getAccountInfo(QPTokenXAccount)).mint.equals(tokenX.publicKey),
                    ("1 " + (await tokenX.getAccountInfo(QPTokenXAccount)).mint.toString() + ", " + tokenX.publicKey.toString())
                );
                assert.ok(
                    (await tokenY.getAccountInfo(QPTokenYAccount)).mint.equals(tokenY.publicKey),
                    ("2 " + (await tokenY.getAccountInfo(QPTokenYAccount)).mint.toString() + ", " + tokenY.publicKey.toString())
                );

                assert.ok(
                    (await tokenX.getAccountInfo(pool.tokenXReserve)).mint.equals(tokenX.publicKey),
                    ("3 " + (await tokenX.getAccountInfo(pool.tokenXReserve)).mint.toString() + ", " + tokenX.publicKey.toString())
                );
                assert.ok(
                    (await tokenY.getAccountInfo(pool.tokenYReserve)).mint.equals(tokenY.publicKey),
                    ("4 " + (await tokenY.getAccountInfo(pool.tokenYReserve)).mint.toString() + ", " + tokenY.publicKey.toString())
                );

                // One of them must be the currency account of qpools,
                // and one of them must have some credit
                assert.ok(
                    ((await tokenX.getAccountInfo(QPTokenXAccount)).amount > tou64(0)) ||
                    ((await tokenY.getAccountInfo(QPTokenYAccount)).amount > tou64(0)),
                    String("(currency and target (tokenX and tokenY) amounts are: ) " +
                        ((await tokenX.getAccountInfo(QPTokenXAccount)).amount) + " " +
                        ((await tokenY.getAccountInfo(QPTokenYAccount)).amount),
                    )
                );

                // Get the sqrt price
                // And subtract some tolerance from this

                console.log("Sqrt price is: ", pool.sqrtPrice.v.toString());
                console.log("Liquidity provided is: ", pool.liquidity.v.toString());

                console.log("Liquidity in X are", (await tokenX.getAccountInfo(pool.tokenXReserve)).amount.toString());
                console.log("Liquidity in Y are", (await tokenY.getAccountInfo(pool.tokenYReserve)).amount.toString());

                // Not entirely sure what this is!
                let xToY: boolean;
                if (tokenX.publicKey.equals(pair.currencyMint)) {
                    xToY = true
                } else {
                    xToY = false
                }
                console.log("xToY is: ", xToY);

                // const xToY = true;
                const slippage = toDecimal(5, 1);

                // Calculate price limit after slippage
                const priceLimit = calculatePriceAfterSlippage(
                    pool.sqrtPrice,
                    slippage,
                    !xToY
                ).v;

                // 9_223_372_036_854_775_807
                // 1_000_000_000_000

                console.log("Slippage is: ", slippage.v.div(DENOMINATOR.div(new BN(1_000))).toString());

                // pool.sqrtPrice.v.sub(new BN(500_000_000_000))

                // Now run the RPC Call
                console.log("Inputs are: ");
                console.log("Inputs are: ",
                    this.bumpQPoolAccount,
                    // xToY: bool,
                    true,
                    // amount: u64,
                    new BN(amount).toString(),
                    // by_amount_in: bool,
                    true,
                    // sqrt_price_limit: u128,
                    priceLimit.toString()
                );
                console.log(
                    {
                        initializer: this.wallet.publicKey.toString(),
                        owner: this.qPoolAccount.toString(),

                        tickmap: pool.tickmap.toString(),
                        token_x_mint: pair.tokenX.toString(),
                        token_y_mint: pair.tokenY.toString(),
                        reserve_account_x: pool.tokenXReserve.toString(),
                        reserve_account_y: pool.tokenYReserve.toString(),
                        account_x: QPTokenXAccount.toString(),  // this.qPoolCurrencyAccount.toString(),
                        account_y: QPTokenYAccount.toString(),

                        pool: poolAddress.toString(),

                        state: this.mockMarket.stateAddress.toString(),
                        program_authority: this.mockMarket.programAuthority.toString(),

                        token_program: TOKEN_PROGRAM_ID.toString(),
                        invariant_program: this.invariantProgram.programId.toString(),
                        system_program: web3.SystemProgram.programId.toString(),
                    }
                )

                console.log("Swaps (Before)");
                console.log("Currency PK is: ", pair.tokenX.toString());
                console.log("Currency Account From ", (await tokenX.getAccountInfo(QPTokenXAccount)).amount.toString());
                console.log("Currency Account To ", (await tokenX.getAccountInfo(pool.tokenXReserve)).amount.toString());

                console.log("Target Token From ", (await tokenY.getAccountInfo(QPTokenYAccount)).amount.toString());
                console.log("Target Token To ", (await tokenY.getAccountInfo(pool.tokenYReserve)).amount.toString());

                await this.solbondProgram.rpc.swapPair(
                    this.bumpQPoolAccount,
                    // xToY: boolea,
                    xToY,
                    // amount: u64,
                    new BN(amount),
                    // by_amount_in: bool,
                    true,
                    // sqrt_price_limit: u128,
                    // 1_000_000_000_000
                    priceLimit,
                    {
                        accounts: {
                            initializer: this.wallet.publicKey,
                            owner: this.qPoolAccount,

                            pool: poolAddress,
                            state: this.mockMarket.stateAddress,
                            tickmap: pool.tickmap,


                            tokenXMint: pair.tokenX,
                            tokenYMint: pair.tokenY,

                            reserveAccountX: pool.tokenXReserve,
                            reserveAccountY: pool.tokenYReserve,

                            accountX: QPTokenXAccount,
                            accountY: QPTokenYAccount,

                            programAuthority: this.mockMarket.programAuthority,

                            tokenProgram: TOKEN_PROGRAM_ID,
                            invariantProgram: this.invariantProgram.programId,
                            systemProgram: web3.SystemProgram.programId,
                        },
                        signers: [this.wallet]
                    }
                );


                console.log("Swaps (After)");
                console.log("Currency Account From ", (await tokenX.getAccountInfo(QPTokenXAccount)).amount.toString());
                console.log("Currency Account To ", (await tokenX.getAccountInfo(pool.tokenXReserve)).amount.toString());

                console.log("Target Token From ", (await tokenY.getAccountInfo(QPTokenYAccount)).amount.toString());
                console.log("Target Token To ", (await tokenY.getAccountInfo(pool.tokenYReserve)).amount.toString());


            })
        )

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
