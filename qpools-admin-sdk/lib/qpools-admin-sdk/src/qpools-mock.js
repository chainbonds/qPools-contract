"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockQPools = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const sdk_1 = require("@invariant-labs/sdk");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("@invariant-labs/sdk/lib/utils");
const chai_1 = require("chai");
const qpools_admin_1 = require("./qpools-admin");
const math_1 = require("@invariant-labs/sdk/lib/math");
const q_pair_1 = require("./q-pair");
const invariant_utils_1 = require("./invariant-utils");
const associated_token_account_1 = require("easy-spl/dist/tx/associated-token-account");
// some invariant seeds
const POSITION_SEED = 'positionv1';
const TICK_SEED = 'tickv1';
const POSITION_LIST_SEED = 'positionlistv1';
// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
class MockQPools extends qpools_admin_1.QPoolsAdmin {
    // TODO: Number pools should be part of the constructor!
    createTokens(number_pools, mintAuthority) {
        return __awaiter(this, void 0, void 0, function* () {
            // Every second token should be the same!
            this.tokens = yield Promise.all(Array.from({ length: number_pools }).map((_) => {
                return (0, invariant_utils_1.createToken)(this.connection, this.wallet, mintAuthority);
            }));
            // Assert
            chai_1.assert.ok(this.tokens.map((token) => {
                return token.getMintInfo().then((mintInfo) => { return mintInfo.mintAuthority.equals(mintAuthority.publicKey); });
            }));
            chai_1.assert.ok(this.tokens.length == number_pools);
        });
    }
    createPairs() {
        return __awaiter(this, void 0, void 0, function* () {
            // Call this after all tokens were created!
            if (!this.tokens) {
                throw Error("Token Mints were not generated yet");
            }
            if (!this.feeTier) {
                throw Error("Token Mints were not generated yet");
            }
            this.pairs = this.tokens.map((token) => {
                let pair = new q_pair_1.QPair(this.currencyMint.publicKey, token.publicKey, this.feeTier);
                // Make the currency always tokenX
                pair.setCurrencyMint(this.currencyMint.publicKey);
                return pair;
            });
            // Assert
            this.pairs.map((pairs) => {
                chai_1.assert.ok(pairs.tokenX.equals(this.currencyMint.publicKey) ||
                    pairs.tokenY.equals(this.currencyMint.publicKey));
            });
            chai_1.assert.ok(this.pairs.length == this.tokens.length);
        });
    }
    createState(admin) {
        return __awaiter(this, void 0, void 0, function* () {
            this.protocolFee = { v: (0, utils_1.fromFee)(new anchor_1.BN(10000)) };
            yield this.mockMarket.createState(admin, this.protocolFee);
        });
    }
    createFeeTier(admin) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mockMarket.createFeeTier(this.feeTier, admin);
            // Get fee tier
            chai_1.assert.ok((yield this.mockMarket.getFeeTierAddress(this.feeTier)).address);
        });
    }
    getPositionAddress(owner, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const indexBuffer = Buffer.alloc(4);
            indexBuffer.writeInt32LE(index);
            const [positionAddress, positionBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(anchor_1.utils.bytes.utf8.encode(POSITION_SEED)), owner.toBuffer(), indexBuffer], this.invariantProgram.programId);
            return {
                positionAddress,
                positionBump
            };
        });
    }
    getPositionListAddress(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const [positionListAddress, positionListBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(anchor_1.utils.bytes.utf8.encode(POSITION_LIST_SEED)), owner.toBuffer()], this.invariantProgram.programId);
            return {
                positionListAddress,
                positionListBump
            };
        });
    }
    getPositionList(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const { positionListAddress } = yield this.getPositionListAddress(owner);
            return (yield this.invariantProgram.account.positionList.fetch(positionListAddress));
        });
    }
    getPosition(owner, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const { positionAddress } = yield this.getPositionAddress(owner, index);
            return (yield this.invariantProgram.account.position.fetch(positionAddress));
        });
    }
    getTickAddress(pair, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const poolAddress = yield pair.getAddress(this.invariantProgram.programId);
            const indexBuffer = Buffer.alloc(4);
            indexBuffer.writeInt32LE(index);
            const [tickAddress, tickBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(anchor_1.utils.bytes.utf8.encode(TICK_SEED)), poolAddress.toBuffer(), indexBuffer], this.invariantProgram.programId);
            return {
                tickAddress,
                tickBump
            };
        });
    }
    createMockMarket(network, marketAuthority, ammProgramId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mockMarket = yield sdk_1.Market.build(network, marketAuthority, this.connection, ammProgramId);
        });
    }
    creatMarketsFromPairs(admin) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.pairs.map((pair) => __awaiter(this, void 0, void 0, function* () {
                console.log("(Currency Mint PK) First pair mint is: ", pair.tokenX.toString());
                console.log("(Target Mint PK) when swapping to Pairs: ", pair.tokenY.toString());
                // 0.6% / 10 Fees, according to pair
                yield this.mockMarket.create({
                    pair: pair,
                    signer: admin
                });
                const createdPool = yield this.mockMarket.get(pair);
                const tokenX = new spl_token_1.Token(this.connection, pair.tokenX, spl_token_1.TOKEN_PROGRAM_ID, admin);
                const tokenY = new spl_token_1.Token(this.connection, pair.tokenY, spl_token_1.TOKEN_PROGRAM_ID, admin);
                // Run a bunch of tests to make sure the market creation went through successfully
                chai_1.assert.ok(createdPool.tokenX.equals(tokenX.publicKey), ("createdPool.tokenX === tokenX.publicKey) " + createdPool.tokenX.toString() + " " + tokenX.publicKey.toString()));
                chai_1.assert.ok(createdPool.tokenY.equals(tokenY.publicKey), ("createdPool.tokenY === tokenY.publicKey) " + createdPool.tokenY.toString() + " " + tokenY.publicKey.toString()));
                // Passed in through the pair
                chai_1.assert.ok(createdPool.fee.v.eq(this.feeTier.fee), ("createdPool.fee.v.eq(feeTier.fee)"));
                chai_1.assert.equal(createdPool.tickSpacing, this.feeTier.tickSpacing, ("createdPool.tickSpacing, feeTier.tickSpacing"));
                chai_1.assert.ok(createdPool.liquidity.v.eqn(0), ("createdPool.liquidity.v.eqn(0)"));
                chai_1.assert.ok(createdPool.sqrtPrice.v.eq(sdk_1.DENOMINATOR), ("createdPool.sqrtPrice.v.eq(DENOMINATOR)"));
                chai_1.assert.ok(createdPool.currentTickIndex == 0, ("createdPool.currentTickIndex == 0"));
                chai_1.assert.ok(createdPool.feeGrowthGlobalX.v.eqn(0), ("createdPool.feeGrowthGlobalX.v.eqn(0)"));
                chai_1.assert.ok(createdPool.feeGrowthGlobalY.v.eqn(0), ("createdPool.feeGrowthGlobalY.v.eqn(0)"));
                chai_1.assert.ok(createdPool.feeProtocolTokenX.v.eqn(0), ("createdPool.feeProtocolTokenX.v.eqn(0)"));
                chai_1.assert.ok(createdPool.feeProtocolTokenY.v.eqn(0), ("createdPool.feeProtocolTokenY.v.eqn(0)"));
                const tickmapData = yield this.mockMarket.getTickmap(pair);
                chai_1.assert.ok(tickmapData.bitmap.length == sdk_1.TICK_LIMIT / 4, "tickmapData.bitmap.length == TICK_LIMIT / 4");
                chai_1.assert.ok(tickmapData.bitmap.every((v) => v == 0), "tickmapData.bitmap.every((v) => v == 0)");
            })));
        });
    }
    provideThirdPartyLiquidityToAllPairs(liquidityProvider, tokenMintAuthority, airdropAmountX) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.mockMarket.createPositionList(liquidityProvider);
            // Generate the upper and lower ticks, if they don't exist yet
            const upperTick = 50;
            const lowerTick = -50;
            // For each pair, provide some liquidity
            yield Promise.all(this.pairs.map((pair) => __awaiter(this, void 0, void 0, function* () {
                const tokenX = new spl_token_1.Token(this.connection, pair.tokenX, spl_token_1.TOKEN_PROGRAM_ID, liquidityProvider);
                const tokenY = new spl_token_1.Token(this.connection, pair.tokenY, spl_token_1.TOKEN_PROGRAM_ID, liquidityProvider);
                // Create token account first
                yield tokenX.createAssociatedTokenAccount(liquidityProvider.publicKey);
                yield tokenY.createAssociatedTokenAccount(liquidityProvider.publicKey);
                // Then get the token accounts
                const tokenXAccount = yield (0, associated_token_account_1.getAssociatedTokenAddress)(tokenX.publicKey, liquidityProvider.publicKey);
                const tokenYAccount = yield (0, associated_token_account_1.getAssociatedTokenAddress)(tokenY.publicKey, liquidityProvider.publicKey);
                const pool = yield this.mockMarket.get(pair);
                // Calculate how much to airdrop, etc.
                // Calculate liquidity based
                // on how much airdrop is made
                // liquidityDelta = 1_000_000
                // returns {liquidity: Decimal, y: BN}
                // console.log("SQRT Price is: ", pool.sqrtPrice.v.div(DENOMINATOR).toString());
                // console.log("airdropAmountX", airdropAmountX.toString());
                const { liquidity, y } = (0, math_1.getLiquidityByX)(airdropAmountX, lowerTick, upperTick, pool.sqrtPrice, true);
                const airdropAmountY = y;
                const liquidityDelta = liquidity;
                // console.log("Airdrop amount y", airdropAmountY);
                // console.log("Liquidity delta :", liquidityDelta.v.toString());
                // console.log("Airdrop amounts and liquidity are: ");
                // console.log(airdropAmountX);
                // console.log(airdropAmountY);
                // console.log(liquidity.v.toString());
                // Also make an airdrop to provide some of this liquidity to the token holders ...
                yield tokenX.mintTo(tokenXAccount, tokenMintAuthority.publicKey, [tokenMintAuthority], (0, sdk_1.tou64)(airdropAmountX));
                yield tokenY.mintTo(tokenYAccount, tokenMintAuthority.publicKey, [tokenMintAuthority], (0, sdk_1.tou64)(airdropAmountY));
                // console.log("Before get amount")
                // Do a bunch of asserts, to check if tokens were successfully minted
                const amountX = (yield tokenX.getAccountInfo(tokenXAccount)).amount;
                const amountY = (yield tokenY.getAccountInfo(tokenYAccount)).amount;
                // console.log("After get amount")
                // console.log("Assert 1: ", (String(amountX) + " Assert (1) " + airdropAmountX.toString()))
                chai_1.assert.ok(amountX.eq(airdropAmountX), (String(amountX) + " Assert (1) " + airdropAmountX.toString()));
                // console.log("Assert 2: ", (String(amountY) + " Assert (2) " + airdropAmountY.toString()))
                chai_1.assert.ok(amountY.eq(airdropAmountY), (String(amountY) + " Assert (2) " + airdropAmountY.toString()));
                // Now initialize the position
                yield this.mockMarket.initPosition({
                    pair: pair,
                    owner: liquidityProvider.publicKey,
                    userTokenX: tokenXAccount,
                    userTokenY: tokenYAccount,
                    lowerTick: lowerTick,
                    upperTick: upperTick,
                    liquidityDelta: liquidityDelta
                }, liquidityProvider);
                // console.log("First (9)");
                // Do a bunch of tests to check if liquidity was successfully provided
                const poolData = yield this.mockMarket.get(pair);
                // console.log(String(" Assert (3) " + poolData.feeGrowthGlobalX.v.toString()));
                // console.log(String(" Assert (4) " + poolData.feeGrowthGlobalY.v.toString()));
                // console.log(String(" Assert (5) " + poolData.feeProtocolTokenX.v.toString()));
                // console.log(String(" Assert (6) " + poolData.feeProtocolTokenY.v.toString()));
                // console.log(String(" Assert (7) " + (await this.mockMarket.get(pair)).liquidity) + " " + liquidityDelta.v.toString());
                chai_1.assert.ok(poolData.feeGrowthGlobalX.v.eqn(0), String(" Assert (3) " + poolData.feeGrowthGlobalX.v.toString()));
                chai_1.assert.ok(poolData.feeGrowthGlobalY.v.eqn(0), String(" Assert (4) " + poolData.feeGrowthGlobalY.v.toString()));
                chai_1.assert.ok(poolData.feeProtocolTokenX.v.eqn(0), String(" Assert (5) " + poolData.feeProtocolTokenX.v.toString()));
                chai_1.assert.ok(poolData.feeProtocolTokenY.v.eqn(0), String(" Assert (6) " + poolData.feeProtocolTokenY.v.toString()));
                chai_1.assert.ok((yield this.mockMarket.get(pair)).liquidity.v.eq(liquidityDelta.v), String(" Assert (7) " + (yield this.mockMarket.get(pair)).liquidity) + " " + liquidityDelta.v.toString());
            })));
        });
    }
}
exports.MockQPools = MockQPools;
