import {
    Connection,
    Keypair,
    PublicKey,
    Signer,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
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
    SEED, signAndSend,
    TICK_LIMIT, tou64
} from "@invariant-labs/sdk";
import {CreatePool, Decimal, FeeTier, InitPosition, Tick,} from "@invariant-labs/sdk/lib/market";
import * as net from "net";
import {Token, TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import {createStandardFeeTiers, createToken} from "../invariant-utils";
import {FEE_TIERS, fromFee, toDecimal} from "@invariant-labs/sdk/lib/utils";
import {createMint, createTokenAccount} from "../utils";
import {Key} from "readline";

import {assert, use} from "chai";
import {PoolStructure, Position, PositionList} from "@invariant-labs/sdk/lib/market";
import {UnderlyingSinkAbortCallback} from "stream/web";
import {calculatePriceAfterSlippage, isInitialized} from "@invariant-labs/sdk/lib/math";
import {getInvariantProgram} from "./program";
import {QPair} from "./q-pair";
import {
    createAssociatedTokenAccountSend, createAssociatedTokenAccountSendUnsigned,
    createAssociatedTokenAccountTx,
    getAssociatedTokenAddress, getAssociatedTokenAddressOffCurve
} from "./splpasta/tx/associated-token-account";

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
        await delay(1_000);

        console.log('before creating associated token account');

        // Create QPT Token Accounts
        console.log("Flaky starts here");
        this.qPoolQPAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            this.QPTokenMint.publicKey,
            this.qPoolAccount,
            this.provider.wallet
        );
        console.log("Goes through here")
        this.qPoolCurrencyAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            this.currencyMint.publicKey,
            this.qPoolAccount,
            this.provider.wallet
        );
        console.log("And end here");

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
    async swapReserveToAllAssetPairs(amount, backToCurrency = false) {

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

                // TODO: Create accounts if not existent!

                // const QPTokenXAccount = await getAssociatedTokenAddressOffCurve(tokenX.publicKey, this.qPoolAccount);
                // const QPTokenYAccount = await getAssociatedTokenAddressOffCurve(tokenY.publicKey, this.qPoolAccount);
                console.log("('''qPoolAccount) here: ", this.qPoolAccount.toString());
                // createAssociatedTokenAccountSendUnsigned(
                //     this.connection,
                //     this.QPTMint.publicKey,
                //     this.bondPoolAccount,
                //     this.wallet
                // )
                const QPTokenXAccount = await createAssociatedTokenAccountSendUnsigned(
                    this.connection,
                    tokenX.publicKey,
                    this.qPoolAccount,
                    this.provider.wallet
                );
                console.log("('''qPoolCurrencyAccount) 1: ", QPTokenXAccount.toString())
                const QPTokenYAccount = await createAssociatedTokenAccountSendUnsigned(
                    this.connection,
                    tokenY.publicKey,
                    this.qPoolAccount,
                    this.provider.wallet
                );
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
                if ((!backToCurrency) && tokenX.publicKey.equals(pair.currencyMint)) {
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

                let byAmountIn = false;

                // Now run the RPC Call
                console.log("Inputs are: ");
                console.log("Inputs are: ",
                    this.bumpQPoolAccount,
                    // xToY: bool,
                    byAmountIn,
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

                let beforeFromCurrency: u64;
                let beforeToCurrency: u64;
                let beforeFromAsset: u64;
                let beforeToAsset: u64;

                console.log("Swaps (Before)");
                if (xToY) {
                    console.log("Currency PK is: ", pair.tokenX.toString());
                    beforeFromCurrency = (await tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Currency Account From ", beforeFromCurrency.toString());
                    beforeToCurrency = (await tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Currency Account To ", beforeToCurrency.toString());

                    beforeFromAsset = (await tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Target Token From ", beforeFromAsset.toString());
                    beforeToAsset = (await tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Target Token To ", beforeToAsset.toString());
                } else {
                    console.log("Currency PK is: ", pair.tokenY.toString());
                    beforeFromCurrency = (await tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Currency Account From ", beforeFromCurrency.toString());
                    beforeToCurrency = (await tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Currency Account To ", beforeToCurrency.toString());

                    beforeFromAsset = (await tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Target Token From  ", beforeFromAsset.toString());
                    beforeToAsset = (await tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Target Token To  ", beforeToAsset.toString());
                }

                const tx = await this.solbondProgram.rpc.swapPair(
                    this.bumpQPoolAccount,
                    // xToY: boolea,
                    xToY,
                    // amount: u64,
                    new BN(amount),
                    // by_amount_in: bool,
                    byAmountIn,
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
                await this.connection.confirmTransaction(tx);
                console.log("Transaction id is: ", tx);
                await delay(5_000);

                let afterFromCurrency: u64;
                let afterToCurrency: u64;
                let afterFromAsset: u64;
                let afterToAsset: u64;

                console.log("Swaps (After)");
                if (xToY) {
                    afterFromCurrency = (await tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Currency Account From ", afterFromCurrency.toString());
                    afterToCurrency = (await tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Currency Account To ", afterToCurrency.toString());

                    afterFromAsset = (await tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Target Token From ", afterFromAsset.toString());
                    afterToAsset = (await tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Target Token To ", afterToAsset.toString());
                } else {
                    afterFromCurrency = (await tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Currency Account From ", afterFromCurrency.toString());
                    afterToCurrency = (await tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Currency Account To ", afterToCurrency.toString());

                    afterFromAsset = (await tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Target Token From  ", afterFromAsset.toString());
                    afterToAsset = (await tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Target Token To  ", afterToAsset.toString());
                }

                // TODO: This does not work properly!! Get back to this in a bit!!
                // This works when by_amount_in: false, but not by_amount_in: true!

            })
        )

    }

    // TODO: Create Position

    // TODO: Close Position

    // TODO: Claim Fee

    // TODO: Redeem Bond

    // Later on we should probably remove initializer from the seeds completely, then anyone can call this
    // And the user could prob get some governance tokens out of it ... Actually not needed, because the generating program is the owner of this by default

    /**
     * Swap assets back from the liquidity-pool assets
     * back to the currency asset
     * @param amount
     */
    async swapAllAssetPairsToReserve(amount) {
        return this.swapReserveToAllAssetPairs(amount, true);
    }

    async getPositionListSeeds(owner: PublicKey) {
        const POSITION_LIST_SEED = 'positionlistv1';
        const [positionListAddress, positionListBump] = await PublicKey.findProgramAddress(
            [Buffer.from(utils.bytes.utf8.encode(POSITION_LIST_SEED)), owner.toBuffer()],
            this.solbondProgram.programId
        )
        return {
            positionListAddress,
            positionListBump
        }
    }

    async createPositionList() {

        const {positionListAddress, positionListBump} = await this.mockMarket.getPositionListAddress(
            this.qPoolAccount
        );

        const ix = this.invariantProgram.instruction.createPositionList(positionListBump, {
            accounts: {
                positionList: positionListAddress,
                owner: this.qPoolAccount,
                signer: this.wallet.publicKey,
                rent: SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId
            }
        }) as TransactionInstruction

        // const ix = await this.mockMarket.createPositionListInstruction(this.qPoolAccount);
        const tx = await signAndSend(new Transaction().add(ix), [this.wallet], this.connection);
        await this.connection.confirmTransaction(tx);

    }

    async createPositions() {

        // For each pair, create a position!
        await Promise.all(
            this.pairs.map(async (pair: Pair) => {
                    console.log()

                    // Ticks should be well-defined for now!
                    const lowerTick = -50;
                    const upperTick = 50;

                    const poolAddress = await pair.getAddress(this.invariantProgram.programId);
                    const [tickmap, pool] = await Promise.all([this.mockMarket.getTickmap(pair), this.mockMarket.get(pair)])

                    const lowerExists = isInitialized(tickmap, lowerTick, pool.tickSpacing)
                    const upperExists = isInitialized(tickmap, upperTick, pool.tickSpacing)

                    const tx = new Transaction();

                    // TODO: Who is the owner here
                    // Let's assume its the reserve / qPoolAccount
                    if (!lowerExists) {
                        tx.add(await this.mockMarket.createTickInstruction(pair, lowerTick, this.qPoolAccount));
                    }
                    if (!upperExists) {
                        tx.add(await this.mockMarket.createTickInstruction(pair, upperTick, this.qPoolAccount));
                    }

                    const {positionListAddress} = await this.mockMarket.getPositionListAddress(this.qPoolAccount);
                    const account = await this.connection.getAccountInfo(positionListAddress);

                    if (account === null) {
                        tx.add(await this.mockMarket.createPositionListInstruction(this.qPoolAccount));
                    }

                    await signAndSend(tx, [this.wallet], this.connection);

                    // Retrieve tick addresses
                    const {
                        tickAddress: lowerTickPDA,
                        tickBump: lowerTickPDABump
                    } = await this.mockMarket.getTickAddress(pair, lowerTick);
                    const {
                        tickAddress: upperTickPDA,
                        tickBump: upperTickPDABump
                    } = await this.mockMarket.getTickAddress(pair, upperTick);

                    // Get AccountX and AccountY
                    const QPTokenXAccount = await createAssociatedTokenAccountSendUnsigned(
                        this.connection,
                        pool.tokenX,
                        this.qPoolAccount,
                        this.provider.wallet
                    );
                    console.log("('''qPoolTokenXAccount) ", QPTokenXAccount.toString());
                    const QPTokenYAccount = await createAssociatedTokenAccountSendUnsigned(
                        this.connection,
                        pool.tokenY,
                        this.qPoolAccount,
                        this.provider.wallet
                    );
                    console.log("('''qPoolTokenYAccount) ", QPTokenYAccount.toString());

                    // Get pool address

                    // Do a PDA position generation
                    const POSITION_SEED = 'positionv1';
                    const index = 0;  // TODO: Gotta find index first
                    const indexBuffer = Buffer.alloc(4)
                    indexBuffer.writeInt32LE(0);
                    // Should not have wallet as seed,
                    // but should have
                    //
                    const [positionAddress, positionBump] = await PublicKey.findProgramAddress(
                        [Buffer.from(utils.bytes.utf8.encode(POSITION_SEED)), this.qPoolAccount.toBuffer(), indexBuffer],
                        // this.invariantProgram.programId
                        this.invariantProgram.programId
                    )
                    console.log("invariant program id is: ", this.invariantProgram.programId.toString());
                    // console.log("Owning account: ", this.invariantProgram.programId.toString());
                    // console.log("Owning account: ", this.solbondProgram.programId);

                    // const {positionAddress, positionBump} = await this.mockMarket.getPositionAddress(
                    //     this.qPoolAccount,
                    //     (await this.mockMarket.getPositionList(this.qPoolAccount)).head
                    // );

                    // TODO: Figure out how to calculate the liquidity delta
                    const liquidityDelta = new BN(1);
                    // I guess liquidity delta is calculated globally
                    console.log("Debug liquidity providing");
                    console.log(
                        positionBump,
                        this.bumpQPoolAccount,
                        lowerTick,
                        upperTick,
                        liquidityDelta,
                        {
                            accounts: {
                                // Create liquidity accounts
                                initializer: this.wallet.publicKey.toString(),

                                state: this.mockMarket.stateAddress.toString(),
                                position: positionAddress.toString(),
                                pool: poolAddress.toString(),
                                positionList: positionListAddress.toString(),
                                owner: this.qPoolAccount.toString(),
                                lowerTick: lowerTickPDA.toString(),
                                upperTick: upperTickPDA.toString(),
                                tokenX: pool.tokenX.toString(),
                                tokenY: pool.tokenY.toString(),
                                accountX: QPTokenXAccount.toString(),
                                accountY: QPTokenYAccount.toString(),
                                reserveX: pool.tokenXReserve.toString(),
                                reserveY: pool.tokenYReserve.toString(),

                                // Auxiliary Accounts
                                programAuthority: this.mockMarket.programAuthority.toString(),
                                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                                invariantProgram: this.invariantProgram.programId.toString(),
                                systemProgram: web3.SystemProgram.programId.toString(),
                                rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString()
                            }
                        }
                    )


                    await this.solbondProgram.rpc.createLiquidityPosition(
                        positionBump,
                        this.bumpQPoolAccount,
                        new BN(lowerTick),
                        new BN(upperTick),
                        new BN(liquidityDelta),
                        {
                            accounts: {
                                // Create liquidity accounts
                                initializer: this.wallet.publicKey,  // Again, remove initializer as a seed from the qPoolAccount!

                                state: this.mockMarket.stateAddress,
                                position: positionAddress,
                                pool: poolAddress,
                                positionList: positionListAddress,
                                owner: this.qPoolAccount,
                                lowerTick: lowerTickPDA,
                                upperTick: upperTickPDA,
                                tokenX: pool.tokenX,
                                tokenY: pool.tokenY,
                                accountX: QPTokenXAccount,
                                accountY: QPTokenYAccount,
                                reserveX: pool.tokenXReserve,
                                reserveY: pool.tokenYReserve,

                                // Auxiliary Accounts
                                programAuthority: this.mockMarket.programAuthority,
                                tokenProgram: TOKEN_PROGRAM_ID,
                                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                                systemProgram: web3.SystemProgram.programId,
                                invariantProgram: this.invariantProgram.programId,
                            },
                            signers: [this.wallet]
                        }
                    )

                }
            )
        );

    }


}