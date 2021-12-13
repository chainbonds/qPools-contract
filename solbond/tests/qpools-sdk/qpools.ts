import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import {Amm, IDL} from "../../deps/invariant/sdk/src/idl/amm";
import * as anchor from "@project-serum/anchor";
import {DENOMINATOR, IWallet, Market, Network, Pair, SEED, TICK_LIMIT} from "@invariant-labs/sdk";
import {CreatePool, Decimal, FeeTier} from "@invariant-labs/sdk/lib/market";
import * as net from "net";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {createToken} from "../invariant-utils";
import {fromFee} from "@invariant-labs/sdk/lib/utils";
import {createMint} from "../utils";
import {Key} from "readline";
import {assert} from "chai";

export interface Tickmap {
    bitmap: Array<number>
}

export class QPools {

    public connection: Connection;
    public wallet: IWallet;
    public solbondProgram: Program;
    public invariantProgram: Program<Amm>;

    // Create Mock Pools

    constructor(
        wallet: IWallet,
        connection: Connection
    ) {
        this.connection = connection;
        this.wallet = wallet;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = anchor.workspace.Amm;
    }

    async createMockPools() {
        // { pair, signer, initTick }: CreatePool

    }

}

export class QPoolsAdmin {

    public connection: Connection;
    public solbondProgram: Program;
    public invariantProgram: Program<Amm>;
    public provider: Provider;
    public wallet: Keypair;

    // All tokens not owned by the protocol
    public currencyMint: Token | null = null;  // We will only have a single currency across one qPool

    // All tokens owned by the protocol
    public qPoolAccount: PublicKey | null = null;  // qPool Account
    public bumpQPoolAccount: number | null = null;

    public QPTokenMint: Token;  // qPool `redeemable` tokens
    public qPoolQPAccount: PublicKey;
    public qPoolCurrencyAccount: PublicKey;

    constructor(
        wallet: IWallet,
        connection: Connection,
        provider: Provider
    ) {
        this.connection = connection;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = anchor.workspace.Amm;
        this.provider = provider;

        // @ts-expect-error
        this.wallet = provider.wallet.payer as Keypair
    }

    /**
     *
     * @param currencyMint: Will be provided, is the currency that will be used
     */
    async initialize(currencyMint: Token, initializer: Keypair) {

        this.currencyMint = currencyMint;

        // Generate qPoolAccount
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [initializer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            this.solbondProgram.programId
        );

        // Generate Redeemable Mint
        this.QPTokenMint = await createMint(
            this.provider,
            initializer,
            this.qPoolAccount,
            9
        );

        this.qPoolQPAccount = await this.QPTokenMint!.createAccount(this.qPoolAccount);
        this.qPoolCurrencyAccount = await this.currencyMint.createAccount(this.qPoolAccount);

        /*
            Now make the RPC call, to initialize a qPool
         */
        const initializeTx = await this.solbondProgram.rpc.initializeBondPool(
            this.bumpQPoolAccount,
            {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: currencyMint.publicKey,
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

    }


}

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class MockQPools extends QPoolsAdmin {

    public mockMarket: Market;
    public pairs: Pair[];
    public tokens: Token[];
    // We have a single fee tier across all pools, for simplicity
    public feeTier: FeeTier;
    public protocolFee: Decimal;

    // TODO: Number pools should be part of the constructor!
    async createTokens(number_pools: number, mintAuthority: Keypair) {
        this.tokens = await Promise.all(
            Array.from({length: 2 * number_pools}).map((_) => {
                return createToken(this.connection, this.wallet, mintAuthority)
            })
        );
    }

    async createPairs(number_pools: number) {
        // Call this after all tokens were created!
        if (!this.tokens) {
            throw Error("Tokens Mints were not generated yet");
        }
        if (!this.feeTier) {
            throw Error("Tokens Mints were not generated yet");
        }

        let i = 0;
        this.pairs = Array.from({length: number_pools}).map((_) => {
            let pair = new Pair(
                this.tokens[2*i].publicKey,
                this.tokens[(2*i)+1].publicKey,
                this.feeTier
            );
            i++;
            return pair;
        });
    }

    async createState(admin: Keypair) {
        this.protocolFee = { v: fromFee(new BN(10000))};
        await this.mockMarket.createState(admin, this.protocolFee);
    }
    async createFeeTier(admin: Keypair) {
        this.feeTier = {
            fee: fromFee(new BN(600)),
            tickSpacing: 10
        }
        await this.mockMarket.createFeeTier(this.feeTier, admin);
    }

    async createMockMarket(
        network: Network,
        wallet: IWallet,
        ammProgramId: PublicKey,
    ) {
        this.mockMarket = new Market(
            network,
            wallet,
            this.connection,
            ammProgramId
        );
    }

    async creatMarketsFromPairs(
        numberPools: number,
        admin: Keypair,
    ) {

        const [programAuthority, nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(SEED)],
            this.invariantProgram.programId
        )

        // Now register a bunch of pairs
        for (let i = 0; i < numberPools; i++) {
            let pair = this.pairs[i];

            // 0.6% / 10
            await this.mockMarket.create({
                pair,
                signer: admin
            });
            const createdPool = await this.mockMarket.get(pair);
            const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, admin);
            const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, admin);

            // Run a bunch of tests to make sure the market creation went through successfully
            assert.ok(createdPool.tokenX.equals(tokenX.publicKey), ("createdPool.tokenX === tokenX.publicKey) " + createdPool.tokenX.toString() + " " + tokenX.publicKey.toString()));
            assert.ok(createdPool.tokenY.equals(tokenY.publicKey), ("createdPool.tokenY === tokenY.publicKey) " + createdPool.tokenY.toString() + " " + tokenY.publicKey.toString()));
            // Passed in through the pair
            assert.ok(createdPool.fee.v.eq(this.feeTier.fee), ("createdPool.fee.v.eq(feeTier.fee)"));
            assert.equal(createdPool.tickSpacing, this.feeTier.tickSpacing, ("createdPool.tickSpacing, feeTier.tickSpacing"));
            assert.ok(createdPool.liquidity.v.eqn(0), ("createdPool.liquidity.v.eqn(0)"));
            assert.ok(createdPool.sqrtPrice.v.eq(DENOMINATOR), ("createdPool.sqrtPrice.v.eq(DENOMINATOR)"));
            assert.ok(createdPool.currentTickIndex == 0, ("createdPool.currentTickIndex == 0"));
            assert.ok(createdPool.feeGrowthGlobalX.v.eqn(0), ("createdPool.feeGrowthGlobalX.v.eqn(0)"));
            assert.ok(createdPool.feeGrowthGlobalY.v.eqn(0), ("createdPool.feeGrowthGlobalY.v.eqn(0)"));
            assert.ok(createdPool.feeProtocolTokenX.v.eqn(0), ("createdPool.feeProtocolTokenX.v.eqn(0)"));
            assert.ok(createdPool.feeProtocolTokenY.v.eqn(0), ("createdPool.feeProtocolTokenY.v.eqn(0)"));
            // I guess these will be ok?
            assert.ok(createdPool.authority.equals(programAuthority), ("createdPool.authority.equals(programAuthority)"));
            assert.ok(createdPool.nonce == nonce, ("createdPool.nonce == nonce"));

            const tickmapData = await this.mockMarket.getTickmap(pair)
            assert.ok(tickmapData.bitmap.length == TICK_LIMIT / 4, "tickmapData.bitmap.length == TICK_LIMIT / 4")
            assert.ok(tickmapData.bitmap.every((v) => v == 0), "tickmapData.bitmap.every((v) => v == 0)")

        }

    }

}
