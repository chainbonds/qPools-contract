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
    TICK_LIMIT
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
import {QPoolsAdmin} from "./qpools-admin";

// some invariant seeds
const POSITION_SEED = 'positionv1'
const TICK_SEED = 'tickv1'
const POSITION_LIST_SEED = 'positionlistv1'

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class MockQPools extends QPoolsAdmin {

    public mockMarket: Market;
    public pairs: Pair[];
    public tokens: Token[];
    public currencyMint: Token | null = null;  // We will only have a single currency across one qPool

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
            throw Error("Token Mints were not generated yet");
        }
        if (!this.feeTier) {
            throw Error("Token Mints were not generated yet");
        }

        let i = 0;
        this.pairs = Array.from({length: number_pools}).map((_) => {
            let pair = new Pair(
                this.tokens[2 * i].publicKey,
                this.tokens[(2 * i) + 1].publicKey,
                this.feeTier
            );
            i++;
            return pair;
        });
    }

    async createState(admin: Keypair) {
        this.protocolFee = {v: fromFee(new BN(10000))};
        await this.mockMarket.createState(admin, this.protocolFee);
    }

    async getPositionAddress(owner: PublicKey, index: number) {
        const indexBuffer = Buffer.alloc(4)
        indexBuffer.writeInt32LE(index)

        const [positionAddress, positionBump] = await PublicKey.findProgramAddress(
            [Buffer.from(utils.bytes.utf8.encode(POSITION_SEED)), owner.toBuffer(), indexBuffer],
            this.invariantProgram.programId
        )

        return {
            positionAddress,
            positionBump
        }
    }

    async getPositionListAddress(owner: PublicKey) {
        const [positionListAddress, positionListBump] = await PublicKey.findProgramAddress(
            [Buffer.from(utils.bytes.utf8.encode(POSITION_LIST_SEED)), owner.toBuffer()],
            this.invariantProgram.programId
        )

        return {
            positionListAddress,
            positionListBump
        }
    }

    async getPositionList(owner: PublicKey) {
        const {positionListAddress} = await this.getPositionListAddress(owner)
        return (await this.invariantProgram.account.positionList.fetch(positionListAddress)) as PositionList
    }

    async getPosition(owner: PublicKey, index: number) {
        const {positionAddress} = await this.getPositionAddress(owner, index)
        return (await this.invariantProgram.account.position.fetch(positionAddress)) as Position
    }

    async getTickAddress(pair, index: number) {
        const poolAddress = await pair.getAddress(this.invariantProgram.programId)
        const indexBuffer = Buffer.alloc(4)
        indexBuffer.writeInt32LE(index)

        const [tickAddress, tickBump] = await PublicKey.findProgramAddress(
            [Buffer.from(utils.bytes.utf8.encode(TICK_SEED)), poolAddress.toBuffer(), indexBuffer],
            this.invariantProgram.programId
        )

        return {
            tickAddress,
            tickBump
        }
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

        this.mockMarket = await Market.build(
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
            // assert.ok(createdPool.authority.equals(programAuthority), ("createdPool.authority.equals(programAuthority)"));
            // assert.ok(createdPool.nonce == nonce, ("createdPool.nonce == nonce"));

            const tickmapData = await this.mockMarket.getTickmap(pair)
            assert.ok(tickmapData.bitmap.length == TICK_LIMIT / 4, "tickmapData.bitmap.length == TICK_LIMIT / 4")
            assert.ok(tickmapData.bitmap.every((v) => v == 0), "tickmapData.bitmap.every((v) => v == 0)")

        }

    }

    async provideLiquidityToAllPairs(
        numberPools: number,
        positionOwner: Keypair,
        tokenMintAuthority: Keypair,
        airdropAmount: number,
        _liquidityDelta: number
    ) {
        // liquidityDelta = 1_000_000
        const liquidityDelta = { v: new BN(_liquidityDelta).mul(DENOMINATOR) };
        await this.mockMarket.createPositionList(positionOwner);

        const upperTick = 1000;
        const lowerTick = -1000;

        for (let i = 0; i < numberPools; i++) {
            // Fetch the pair
            let pair = this.pairs[i];

            // Generate token accounts for the liquidity provider (our bond program, basically)
            const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, tokenMintAuthority);
            const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, tokenMintAuthority);

            const qPoolsTokenX = await tokenX.createAccount(positionOwner.publicKey);
            const qPoolsTokenY = await tokenY.createAccount(positionOwner.publicKey);

            // Also make an airdrop to provide some of this liquidity to the token holders ...
            await tokenX.mintTo(qPoolsTokenX, tokenMintAuthority.publicKey, [tokenMintAuthority], airdropAmount);
            await tokenY.mintTo(qPoolsTokenY, tokenMintAuthority.publicKey, [tokenMintAuthority], airdropAmount);

            // Generate the upper and lower ticks, if they don't exist yet

            // Now initialize the position
            await this.mockMarket.initPosition(
                {
                    pair: pair,
                    owner: positionOwner.publicKey,
                    userTokenX: qPoolsTokenX,
                    userTokenY: qPoolsTokenY,
                    lowerTick: lowerTick,
                    upperTick: upperTick,
                    liquidityDelta: liquidityDelta
                },
                positionOwner
            )
        }
    }

    async makeSwap(
        pair: Pair,

    ) {

    }

    async swapWithInvariant(
        admin: Keypair,
        xToy: boolean,
        amount: BN,
        byAmountIn: boolean,
        sqrtPriceLimit: BN,
        current_idx: BN
    ) {

        let pair = this.pairs[current_idx.toNumber()];
        await this.mockMarket.create({
            pair,
            signer: admin
        });
        console.log("made market for pair")
        const pool = await this.get(pair);
        console.log("god pool ")
        const state = (await this.mockMarket.getStateAddress()) //.address
        console.log("got state")
        const stateAddress = state.address
        console.log("got state address")
        const tickmap = await this.mockMarket.getTickmap(pair);
        console.log("got the tickmap data")
        const tokenXMint = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, admin);
        console.log("token x mint baby")
        const tokenYMint = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, admin);
        console.log("token y mint yo")
        const reserveX = pool.tokenX//tokenXMint.createAccount(admin)
        console.log("pool token x address")
        const reserveY = pool.tokenY//tokenXMint.createAccount(admin)
        console.log("pool token y address")

        const accountX = await tokenXMint!.createAccount(admin.publicKey)
        console.log("token account x address")

        const accountY = await tokenYMint!.createAccount(admin.publicKey)
        console.log("token account y address")
        const pairaddrs = await pair.getAddress(this.invariantProgram.programId)
        console.log("pair addr")
        const feetieraddr = await pair.feeTierAddress
        console.log("feetier addr ", feetieraddr.toString())
        // const swapInstruction = await this.solbondProgram.rpc.swapPair(
        //     pair.feeTierAddress,
        //     xToy,
        //     amount,
        //     byAmountIn,
        //     sqrtPriceLimit,
        //     {
        //         accounts: {
        //             initializer: admin.publicKey,
        //             pool: pairaddrs,
        //             state: stateAddress,
        //             tickmap: pool.tickmap,
        //             tokenXMint: tokenXMint.publicKey,
        //             tokenYMint: tokenYMint.publicKey,
        //             reserveAccountX: pool.tokenXReserve,
        //             reserveAccountY: pool.tokenYReserve,
        //             accountX: accountX,
        //             accountY: accountY,
        //             programAuthority:pool,
        //             tokenProgram: TOKEN_PROGRAM_ID,
        //             invariantProgram: this.invariantProgram.programId,
        //             systemProgram: web3.SystemProgram.programId,
        //         },
        //         signers: [admin]
        //     }
        // )

        //const tx = await this.provider.connection.confirmTransaction(swapInstruction);


    }


    async registerInvariantInstruction(
        current_idx: number,
        max_idx: number,
        current_weight: number,
        admin: Keypair,
    ) {
        this.currencyMint = await createMint(
            this.provider,
            admin
        );
        let seed_string = current_idx.toString();
        const [invariantPoolAccount, bumpRegisterPosition] = await anchor.web3.PublicKey.findProgramAddress(
            [admin.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("invariantPoolAccount" + current_idx.toString()))],
            this.solbondProgram.programId
        )
        console.log("invariant pool account ", invariantPoolAccount.toString())

        console.log("GOT POOL PDA")
        let pair = this.pairs[current_idx];

        // 0.6% / 10
        await this.mockMarket.create({
            pair,
            signer: admin
        });

        const createdPool = await this.mockMarket.get(pair);
        const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, admin);
        const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, admin);
        const tickmapData = await this.mockMarket.getTickmap(pair)

        // CREATE POSITION IN POOL

        const [createPositionInPoolAccount, bumpCreatePositionInPool] = await anchor.web3.PublicKey.findProgramAddress(
            [admin.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("positionv1"))],
            this.invariantProgram.programId
        )

        console.log("GOT POSITION IN POOL PDA")

        const [positionList, bumpPositionList] = await anchor.web3.PublicKey.findProgramAddress(
            [admin.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("positionlistv1"))],
            this.invariantProgram.programId
        )
        console.log("GOT POSITION LIST PDA")

        // DO I EVEN NEED TO DO THIS?
        // const createPositionListTx = await this.invariantProgram.rpc.createPositionList(
        //     bumpPositionList,
        //     {
        //         accounts: {
        //             positionList: positionList,
        //             owner: admin.publicKey,
        //             rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        //             systemProgram: web3.SystemProgram.programId,
        //         },
        //         signers: [admin]
        //     }
        // );


        // await this.provider.connection.confirmTransaction(createPositionListTx);
        const index: number = 0;
        const pairTick = await this.mockMarket.createTick(pair, index, admin);
        // console.log("888")
        const [poolAddress, poolBump] = await pair.getAddressAndBump(this.invariantProgram.programId);
        // console.log("08989")
        const {tickAddress} = await this.mockMarket.getTickAddress(pair, index);
        // console.log("87000")
        const stateAddress = (await this.mockMarket.getStateAddress()).address
        console.log(" state  ", stateAddress.toString())

        // console.log("8900010")
        const currencyTokenMint = this.currencyMint.publicKey;
        // console.log("cuee")
        const tokenXMint = this.tokens[current_idx]//.publicKey;
        // console.log("2")
        const accountCurrencyReserve = await this.currencyMint!.createAccount(createPositionInPoolAccount);
        const accountXReserve = await tokenXMint!.createAccount(createPositionInPoolAccount);

        const reserveCurrencyToken = this.qPoolCurrencyAccount;
        //console.log("3")
        const assumeFirstPosition: boolean = false;
        const reserveX = this.tokens[current_idx].publicKey;
        //console.log("bi")
        //const otherMint = await this.tokens[current_idx].getMintInfo().then().
        // const upperTick = await this.mockMarket.createTick(pair, 0, admin);
        // console.log("created Tick")
        const pool = await this.get(pair);
        console.log(" pool  ", await pair.getAddress(this.invariantProgram.programId).toString())
        console.log(" tick map ", pool.tickmap.toString())

        //const { address: stateAddress } = await this.getStateAddress()
        //vconst { positionAddress, positionBump } = await this.getPositionAddress(
        //    admin.publicKey,
        //    assumeFirstPosition ? 0 : (await this.getPositionList(admin.publicKey)).head
        //)
        // console.log(" positionaddr  ",  positionAddress.toString())

        //const { positionListAddress } = await this.getPositionListAddress(admin.publicKey)
        //console.log(" poslist addrses  ",  positionListAddress.toString())

        //const { tickAddress: upperTickAddress } = await this.getTickAddress(pair, upperTick)
        //console.log(" uppertick addrses  ",  upperTickAddress.toString())

        //const { tickAddress: lowerTickAddress } = await this.getTickAddress(pair, lowerTick)
        //console.log(" lower tick addrses  ",  lowerTickAddress.toString())

        // console.log(" currency token mint ", this.currencyMint.publicKey.toString())
        // console.log(" x token mint ", this.tokens[current_idx].publicKey.toString())
        // console.log(" currency reseve  ", this.qPoolCurrencyAccount.toString())
        // console.log(" x reseve  ",  this.tokens[current_idx].publicKey.toString())
        // console.log(" accountCurrencyReserve  ",  accountCurrencyReserve.toString())
        // console.log(" accountXreserve  ",  accountXReserve.toString())
        // console.log(" admin  ",  admin.publicKey.toString())
        // this.qPoolQPAccount = await this.QPTokenMint!.createAccount(this.qPoolAccount);
        const reserveCurrencyTokenAcc = await this.currencyMint.createAccount(admin.publicKey)
        const registerInvariantInstruction = await this.solbondProgram.rpc.registerInvariantInstruction(
            bumpRegisterPosition,
            current_idx,
            max_idx,
            current_weight,
            {
                accounts: {
                    invariantPoolAccount: invariantPoolAccount,
                    pool: await pair.getAddress(this.invariantProgram.programId),
                    state: stateAddress,
                    tickmap: pool.tickmap,
                    currencyTokenMint: this.currencyMint.publicKey,
                    // need to do indexing ninja stuff
                    // or store only second part of swap?
                    tokenXMint: this.tokens[current_idx].publicKey,
                    reserveCurrencyToken: reserveCurrencyTokenAcc,
                    reserveX: this.tokens[current_idx].publicKey,
                    accountCurrencyReserve: accountCurrencyReserve,
                    accountXReserve: accountXReserve,
                    initializer: admin.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [admin]
            }
        )

        // const upperTick = createdPool.


    }

}
