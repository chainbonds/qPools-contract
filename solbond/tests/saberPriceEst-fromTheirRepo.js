"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const token_utils_1 = require("@saberhq/token-utils");
const web3_js_1 = require("@solana/web3.js");
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_mapvalues_1 = __importDefault(require("lodash.mapvalues"));
const stableswap_sdk_1 = require("@saberhq/stableswap-sdk"); //"../constants";
const stableswap_sdk_2 = require("@saberhq/stableswap-sdk");
const chai_1 = require("chai");
const exchange = {
    swapAccount: new web3_js_1.PublicKey("YAkoNb6HKmSxQN9L8hiBE5tPJRsniSSMzND1boHmZxe"),
    programID: stableswap_sdk_1.SWAP_PROGRAM_ID,
    lpToken: new token_utils_1.Token({
        symbol: "LP",
        name: "StableSwap LP",
        address: "2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf",
        decimals: 6,
        chainId: 100,
    }),
    tokens: [
        new token_utils_1.Token({
            symbol: "TOKA",
            name: "Token A",
            address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
            chainId: 100,
        }),
        new token_utils_1.Token({
            symbol: "TOKB",
            name: "Token B",
            address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            decimals: 6,
            chainId: 100,
        }),
    ],
};
const makeExchangeInfo = ({ lpTotalSupply = jsbi_1.default.BigInt(200000000), tokenAAmount = jsbi_1.default.BigInt(100000000), tokenBAmount = jsbi_1.default.BigInt(100000000), } = {
    lpTotalSupply: jsbi_1.default.BigInt(200000000),
    tokenAAmount: jsbi_1.default.BigInt(100000000),
    tokenBAmount: jsbi_1.default.BigInt(100000000),
}) => ({
    ampFactor: jsbi_1.default.BigInt(100),
    fees: stableswap_sdk_1.ZERO_FEES,
    lpTotalSupply: new token_utils_1.TokenAmount(exchange.lpToken, lpTotalSupply),
    reserves: [
        {
            reserveAccount: new web3_js_1.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
            adminFeeAccount: new web3_js_1.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
            amount: new token_utils_1.TokenAmount(exchange.tokens[0], tokenAAmount),
        },
        {
            reserveAccount: new web3_js_1.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
            adminFeeAccount: new web3_js_1.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
            amount: new token_utils_1.TokenAmount(exchange.tokens[1], tokenBAmount),
        },
    ],
});
const exchangeInfo = makeExchangeInfo();
const exchangeInfoWithFees = Object.assign(Object.assign({}, exchangeInfo), { fees: stableswap_sdk_1.RECOMMENDED_FEES });
//cant get this to work IDK
describe("Calculated amounts", () => {
    describe("#calculateEstimatedWithdrawAmount", () => {
        it("works", () => {
            (0, stableswap_sdk_2.calculateEstimatedWithdrawAmount)(Object.assign(Object.assign({}, exchangeInfo), { poolTokenAmount: new token_utils_1.TokenAmount(exchange.lpToken, 100000) }));
        });
        it("works with fees", () => {
            (0, stableswap_sdk_2.calculateEstimatedWithdrawAmount)(Object.assign(Object.assign({}, exchangeInfoWithFees), { poolTokenAmount: new token_utils_1.TokenAmount(exchange.lpToken, 100000) }));
        });
        it("works zero with fees", () => {
            (0, stableswap_sdk_2.calculateEstimatedWithdrawAmount)(Object.assign(Object.assign({}, exchangeInfoWithFees), { poolTokenAmount: new token_utils_1.TokenAmount(exchange.lpToken, 0) }));
        });
    });
    describe("#calculateEstimatedWithdrawOneAmount", () => {
        it("works", () => {
            (0, stableswap_sdk_2.calculateEstimatedWithdrawOneAmount)({
                exchange: exchangeInfo,
                poolTokenAmount: new token_utils_1.TokenAmount(exchange.lpToken, 100000),
                withdrawToken: exchange.tokens[0],
            });
        });
        it("works with fees", () => {
            const result = (0, stableswap_sdk_2.calculateEstimatedWithdrawOneAmount)({
                exchange: exchangeInfoWithFees,
                poolTokenAmount: new token_utils_1.TokenAmount(exchange.lpToken, 100000),
                withdrawToken: exchange.tokens[0],
            });
            const resultMapped = (0, lodash_mapvalues_1.default)(result, (q) => q.raw.toString());
            (0, chai_1.expect)(resultMapped).toEqual({
                withdrawAmount: "99301",
                withdrawAmountBeforeFees: "99900",
                swapFee: "100",
                withdrawFee: "500",
                lpSwapFee: "50",
                lpWithdrawFee: "250",
                adminSwapFee: "50",
                adminWithdrawFee: "250",
            });
        });
        it("works zero with fees", () => {
            const result = (0, stableswap_sdk_2.calculateEstimatedWithdrawOneAmount)({
                exchange: exchangeInfoWithFees,
                poolTokenAmount: new token_utils_1.TokenAmount(exchange.lpToken, 0),
                withdrawToken: exchange.tokens[0],
            });
            const resultMapped = (0, lodash_mapvalues_1.default)(result, (q) => q.raw.toString());
            (0, chai_1.expect)(resultMapped).toEqual({
                withdrawAmount: "0",
                withdrawAmountBeforeFees: "0",
                swapFee: "0",
                withdrawFee: "0",
                lpSwapFee: "0",
                lpWithdrawFee: "0",
                adminSwapFee: "0",
                adminWithdrawFee: "0",
            });
        });
    });
});
