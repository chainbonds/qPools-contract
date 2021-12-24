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
import {QPoolsAdmin} from "./qpools-admin";
import {Mint} from "../../../dapp/src/splpasta";
import {getLiquidityByX} from "@invariant-labs/sdk/lib/math";
import {QPair} from "./q-pair";

// some invariant seeds
const POSITION_SEED = 'positionv1'
const TICK_SEED = 'tickv1'
const POSITION_LIST_SEED = 'positionlistv1'

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class MockQPools extends QPoolsAdmin {

    public tokens: Token[];

    // We have a single fee tier across all pools, for simplicity
    public protocolFee: Decimal;

    // TODO: Number pools should be part of the constructor!
    async createTokens(number_pools: number, mintAuthority: Keypair) {
        // Every second token should be the same!
        this.tokens = await Promise.all(
            Array.from({length: number_pools}).map((_) => {
                return createToken(this.connection, this.wallet, mintAuthority)
            })
        );
        // Assert
        assert.ok(this.tokens.map((token: Token) => {
            return token.getMintInfo().then((mintInfo) => {return mintInfo.mintAuthority.equals(mintAuthority.publicKey)})
        }));
        assert.ok(this.tokens.length == number_pools);
    }

    async createPairs() {
        // Call this after all tokens were created!
        if (!this.tokens) {
            throw Error("Token Mints were not generated yet");
        }
        if (!this.feeTier) {
            throw Error("Token Mints were not generated yet");
        }

        this.pairs = this.tokens.map((token: Token) => {
            let pair: QPair = new QPair(
                this.currencyMint.publicKey,
                token.publicKey,
                this.feeTier
            );
            // Make the currency always tokenX
            pair.setCurrencyMint(this.currencyMint.publicKey);
            console.log("(Currency Mint PK) First pair mint is: ", pair.tokenX.toString());
            console.log("(Other Mint PK) First pair mint is: ", pair.tokenY.toString());
            return pair
        });
        // Assert
        assert.ok(this.pairs.map((pairs: Pair) => {
            return pairs.tokenX.equals(this.currencyMint.publicKey)
        }));
        assert.ok(this.pairs.length == this.tokens.length);
    }

    async createState(admin: Keypair) {
        this.protocolFee = {v: fromFee(new BN(10000))};
        await this.mockMarket.createState(admin, this.protocolFee);
    }

    async createFeeTier(admin: Keypair) {
        await this.mockMarket.createFeeTier(this.feeTier, admin);
        // Get fee tier
        assert.ok((await this.mockMarket.getFeeTierAddress(this.feeTier)).address)
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

    async createMockMarket(
        network: Network,
        marketAuthority: IWallet,
        ammProgramId: PublicKey,
    ) {
        this.mockMarket = await Market.build(
            network,
            marketAuthority,
            this.connection,
            ammProgramId
        );
    }

    async creatMarketsFromPairs(
        admin: Keypair,
    ) {

        await Promise.all(
                this.pairs.map(async (pair: Pair) => {

                    console.log("(Currency Mint PK) First pair mint is: ", pair.tokenX.toString());
                    console.log("(Target Mint PK) when swapping to Pairs: ", pair.tokenY.toString());

                // 0.6% / 10 Fees, according to pair
                await this.mockMarket.create({
                    pair: pair,
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

                const tickmapData = await this.mockMarket.getTickmap(pair)
                assert.ok(tickmapData.bitmap.length == TICK_LIMIT / 4, "tickmapData.bitmap.length == TICK_LIMIT / 4")
                assert.ok(tickmapData.bitmap.every((v) => v == 0), "tickmapData.bitmap.every((v) => v == 0)")

            })
        );

    }

    async provideThirdPartyLiquidityToAllPairs(
        liquidityProvider: Keypair,
        tokenMintAuthority: Keypair,
        airdropAmountX: BN,
    ) {
        await this.mockMarket.createPositionList(liquidityProvider);

        // Generate the upper and lower ticks, if they don't exist yet
        const upperTick = 50;
        const lowerTick = -50;

        // For each pair, provide some liquidity
        await Promise.all(
            this.pairs.map(async (pair: Pair) => {

                const tokenX = new Token(this.connection, pair.tokenX, TOKEN_PROGRAM_ID, liquidityProvider);
                const tokenY = new Token(this.connection, pair.tokenY, TOKEN_PROGRAM_ID, liquidityProvider);

                const tokenXAccount = await tokenX.createAccount(liquidityProvider.publicKey);
                const tokenYAccount = await tokenY.createAccount(liquidityProvider.publicKey);

                // 100_000_000_000
                // 75_018_745_971
                const pool = await this.mockMarket.get(pair);

                // Calculate how much to airdrop, etc.
                // Calculate liquidity based
                // on how much airdrop is made
                // liquidityDelta = 1_000_000
                // returns {liquidity: Decimal, y: BN}
                // console.log("SQRT Price is: ", pool.sqrtPrice.v.div(DENOMINATOR).toString());
                // console.log("airdropAmountX", airdropAmountX.toString());
                const {liquidity, y} = getLiquidityByX(
                    airdropAmountX,
                    lowerTick,
                    upperTick,
                    pool.sqrtPrice,
                    true
                );
                const airdropAmountY = y;
                const liquidityDelta = liquidity;
                // console.log("Airdrop amount y", airdropAmountY);
                // console.log("Liquidity delta :", liquidityDelta.v.toString());

                // console.log("Airdrop amounts and liquidity are: ");
                // console.log(airdropAmountX);
                // console.log(airdropAmountY);
                // console.log(liquidity.v.toString());

                // Also make an airdrop to provide some of this liquidity to the token holders ...
                await tokenX.mintTo(tokenXAccount, tokenMintAuthority.publicKey, [tokenMintAuthority], tou64(airdropAmountX));
                await tokenY.mintTo(tokenYAccount, tokenMintAuthority.publicKey, [tokenMintAuthority], tou64(airdropAmountY));

                // console.log("Before get amount")
                // Do a bunch of asserts, to check if tokens were successfully minted
                const amountX = (await tokenX.getAccountInfo(tokenXAccount)).amount;
                const amountY = (await tokenY.getAccountInfo(tokenYAccount)).amount;
                // console.log("After get amount")

                // console.log("Assert 1: ", (String(amountX) + " Assert (1) " + airdropAmountX.toString()))
                assert.ok(amountX.eq(airdropAmountX), (String(amountX) + " Assert (1) " + airdropAmountX.toString()));
                // console.log("Assert 2: ", (String(amountY) + " Assert (2) " + airdropAmountY.toString()))
                assert.ok(amountY.eq(airdropAmountY), (String(amountY) + " Assert (2) " + airdropAmountY.toString()));

                // Now initialize the position
                await this.mockMarket.initPosition(
                    {
                        pair: pair,
                        owner: liquidityProvider.publicKey,
                        userTokenX: tokenXAccount,
                        userTokenY: tokenYAccount,
                        lowerTick: lowerTick,
                        upperTick: upperTick,
                        liquidityDelta: liquidityDelta
                    },
                    liquidityProvider
                )

                // console.log("First (9)");
                // Do a bunch of tests to check if liquidity was successfully provided
                const poolData = await this.mockMarket.get(pair);

                // console.log(String(" Assert (3) " + poolData.feeGrowthGlobalX.v.toString()));
                // console.log(String(" Assert (4) " + poolData.feeGrowthGlobalY.v.toString()));
                // console.log(String(" Assert (5) " + poolData.feeProtocolTokenX.v.toString()));
                // console.log(String(" Assert (6) " + poolData.feeProtocolTokenY.v.toString()));
                // console.log(String(" Assert (7) " + (await this.mockMarket.get(pair)).liquidity) + " " + liquidityDelta.v.toString());
                assert.ok(poolData.feeGrowthGlobalX.v.eqn(0), String(" Assert (3) " + poolData.feeGrowthGlobalX.v.toString()));
                assert.ok(poolData.feeGrowthGlobalY.v.eqn(0), String(" Assert (4) " + poolData.feeGrowthGlobalY.v.toString()));
                assert.ok(poolData.feeProtocolTokenX.v.eqn(0), String(" Assert (5) " + poolData.feeProtocolTokenX.v.toString()));
                assert.ok(poolData.feeProtocolTokenY.v.eqn(0), String(" Assert (6) " + poolData.feeProtocolTokenY.v.toString()));
                assert.ok((await this.mockMarket.get(pair)).liquidity.v.eq(liquidityDelta.v), String(" Assert (7) " + (await this.mockMarket.get(pair)).liquidity) + " " + liquidityDelta.v.toString());

            })
        );

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
