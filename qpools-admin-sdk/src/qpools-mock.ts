import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
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
import {FEE_TIERS, fromFee} from "@invariant-labs/sdk/lib/utils";

import {assert} from "chai";
import {PoolStructure, Position, PositionList} from "@invariant-labs/sdk/lib/market";
import {QPoolsAdmin} from "./qpools-admin";
import {getLiquidityByX} from "@invariant-labs/sdk/lib/math";
import {QPair} from "./q-pair";
import {createToken} from "./invariant-utils";
import {getAssociatedTokenAddress} from "easy-spl/dist/tx/associated-token-account";

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
            return pair
        });
        // Assert
        this.pairs.map((pairs: Pair) => {
            assert.ok(
                pairs.tokenX.equals(this.currencyMint.publicKey) ||
                pairs.tokenY.equals(this.currencyMint.publicKey)
            );
        });
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

                // Create token account first
                await tokenX.createAssociatedTokenAccount(liquidityProvider.publicKey);
                await tokenY.createAssociatedTokenAccount(liquidityProvider.publicKey);

                // Then get the token accounts
                const tokenXAccount = await getAssociatedTokenAddress(tokenX.publicKey, liquidityProvider.publicKey);
                const tokenYAccount = await getAssociatedTokenAddress(tokenY.publicKey, liquidityProvider.publicKey);

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

}
