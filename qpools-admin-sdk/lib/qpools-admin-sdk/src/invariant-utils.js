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
exports.setInitialized = exports.createPoolWithLiquidity = exports.createUserWithTokens = exports.createTokensAndPool = exports.createStandardFeeTiers = exports.positionWithoutOwnerEquals = exports.positionEquals = exports.createToken = exports.eqDecimal = exports.assertThrowsAsync = void 0;
const web3_js_1 = require("@solana/web3.js");
const serum_1 = require("@project-serum/serum");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("@invariant-labs/sdk/src/utils");
const utils_2 = require("@invariant-labs/sdk/lib/utils");
const sdk_1 = require("@invariant-labs/sdk");
const sdk_2 = require("@invariant-labs/sdk");
const sdk_3 = require("@invariant-labs/sdk");
const anchor_1 = require("@project-serum/anchor");
function assertThrowsAsync(fn, word) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fn;
        }
        catch (e) {
            let err;
            if (e.code) {
                err = '0x' + e.code.toString(16);
            }
            else {
                err = e.toString();
            }
            if (word) {
                const regex = new RegExp(`${word}$`);
                if (!regex.test(err)) {
                    console.log(err);
                    throw new Error('Invalid Error message');
                }
            }
            return;
        }
        throw new Error('Function did not throw error');
    });
}
exports.assertThrowsAsync = assertThrowsAsync;
const eqDecimal = (x, y) => {
    return x.v.eq(y.v);
};
exports.eqDecimal = eqDecimal;
const createToken = (connection, payer, mintAuthority, decimals = 6) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield spl_token_1.Token.createMint(connection, payer, mintAuthority.publicKey, null, decimals, serum_1.TokenInstructions.TOKEN_PROGRAM_ID);
    return token;
});
exports.createToken = createToken;
// do not compare bump
const positionEquals = (a, b) => {
    return (0, exports.positionWithoutOwnerEquals)(a, b) && a.owner == b.owner;
};
exports.positionEquals = positionEquals;
const positionWithoutOwnerEquals = (a, b) => {
    return ((0, exports.eqDecimal)(a.feeGrowthInsideX, b.feeGrowthInsideX) &&
        (0, exports.eqDecimal)(a.feeGrowthInsideY, b.feeGrowthInsideY) &&
        (0, exports.eqDecimal)(a.liquidity, b.liquidity) &&
        a.lowerTickIndex == b.lowerTickIndex &&
        a.upperTickIndex == b.upperTickIndex &&
        a.pool.equals(b.pool) &&
        a.id.eq(b.id) &&
        (0, exports.eqDecimal)(a.tokensOwedX, b.tokensOwedX) &&
        (0, exports.eqDecimal)(a.tokensOwedY, b.tokensOwedY));
};
exports.positionWithoutOwnerEquals = positionWithoutOwnerEquals;
const createStandardFeeTiers = (market, payer) => __awaiter(void 0, void 0, void 0, function* () {
    Promise.all(utils_1.FEE_TIERS.map((feeTier) => __awaiter(void 0, void 0, void 0, function* () {
        yield market.createFeeTier(feeTier, payer);
    })));
});
exports.createStandardFeeTiers = createStandardFeeTiers;
const createTokensAndPool = (market, connection, payer, initTick = 0, fee = new anchor_1.BN(600), tickSpacing = 10) => __awaiter(void 0, void 0, void 0, function* () {
    const mintAuthority = web3_js_1.Keypair.generate();
    const promiseResults = yield Promise.all([
        (0, exports.createToken)(connection, payer, mintAuthority),
        (0, exports.createToken)(connection, payer, mintAuthority),
        connection.requestAirdrop(mintAuthority.publicKey, 1e9)
    ]);
    const feeTier = {
        fee: (0, utils_2.fromFee)(fee),
        tickSpacing
    };
    const pair = new sdk_1.Pair(promiseResults[0].publicKey, promiseResults[1].publicKey, feeTier);
    const tokenX = new spl_token_1.Token(connection, pair.tokenX, spl_token_1.TOKEN_PROGRAM_ID, payer);
    const tokenY = new spl_token_1.Token(connection, pair.tokenY, spl_token_1.TOKEN_PROGRAM_ID, payer);
    const feeTierAccount = yield connection.getAccountInfo((yield market.getFeeTierAddress(feeTier)).address);
    if (feeTierAccount === null) {
        yield market.createFeeTier(pair.feeTier, payer);
    }
    yield market.create({
        pair,
        signer: payer,
        initTick
    });
    return { tokenX, tokenY, pair, mintAuthority };
});
exports.createTokensAndPool = createTokensAndPool;
const createUserWithTokens = (pair, connection, mintAuthority, mintAmount = new anchor_1.BN(1e9)) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenX = new spl_token_1.Token(connection, pair.tokenX, spl_token_1.TOKEN_PROGRAM_ID, mintAuthority);
    const tokenY = new spl_token_1.Token(connection, pair.tokenY, spl_token_1.TOKEN_PROGRAM_ID, mintAuthority);
    const owner = web3_js_1.Keypair.generate();
    const [userAccountX, userAccountY] = yield Promise.all([
        tokenX.createAssociatedTokenAccount(owner.publicKey),
        tokenY.createAssociatedTokenAccount(owner.publicKey),
        connection.requestAirdrop(owner.publicKey, 1e9)
    ]);
    yield Promise.all([
        tokenX.mintTo(userAccountX, mintAuthority.publicKey, [mintAuthority], (0, sdk_2.tou64)(mintAmount)),
        tokenY.mintTo(userAccountY, mintAuthority.publicKey, [mintAuthority], (0, sdk_2.tou64)(mintAmount))
    ]);
    return { owner, userAccountX, userAccountY };
});
exports.createUserWithTokens = createUserWithTokens;
const createPoolWithLiquidity = (market, connection, payer, liquidity = { v: new anchor_1.BN(10).pow(new anchor_1.BN(22)) }, initialTick = 0, lowerTick = -1000, upperTick = 1000) => __awaiter(void 0, void 0, void 0, function* () {
    const { pair, mintAuthority } = yield (0, exports.createTokensAndPool)(market, connection, payer, initialTick);
    const { owner, userAccountX, userAccountY } = yield (0, exports.createUserWithTokens)(pair, connection, mintAuthority, new anchor_1.BN(10).pow(new anchor_1.BN(14)));
    yield market.initPosition({
        pair,
        owner: owner.publicKey,
        userTokenX: userAccountX,
        userTokenY: userAccountY,
        lowerTick,
        upperTick,
        liquidityDelta: liquidity
    }, owner);
    return { pair, mintAuthority };
});
exports.createPoolWithLiquidity = createPoolWithLiquidity;
const setInitialized = (bitmap, index) => {
    bitmap[Math.floor((index + sdk_3.TICK_LIMIT) / 8)] |= 1 << (index + sdk_3.TICK_LIMIT) % 8;
};
exports.setInitialized = setInitialized;
