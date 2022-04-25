import type { BigintIsh } from "@saberhq/token-utils";
import { Percent, Token as SToken, TokenAmount } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import JSBI from "jsbi";
import mapValues from "lodash.mapvalues";

import { SWAP_PROGRAM_ID, RECOMMENDED_FEES, ZERO_FEES } from "@saberhq/stableswap-sdk"; //"../constants";
import type { IExchangeInfo } from "@saberhq/stableswap-sdk";
import {
    calculateEstimatedMintAmount,
    calculateEstimatedSwapOutputAmount,
    calculateEstimatedWithdrawAmount,
    calculateEstimatedWithdrawOneAmount,
    calculateVirtualPrice,
} from "@saberhq/stableswap-sdk";
import {expect} from "chai";

const exchange = {
    swapAccount: new PublicKey("YAkoNb6HKmSxQN9L8hiBE5tPJRsniSSMzND1boHmZxe"),
    programID: SWAP_PROGRAM_ID,
    lpToken: new SToken({
        symbol: "LP",
        name: "StableSwap LP",
        address: "2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf",
        decimals: 6,
        chainId: 100,
    }),
    tokens: [
        new SToken({
            symbol: "TOKA",
            name: "Token A",
            address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
            chainId: 100,
        }),
        new SToken({
            symbol: "TOKB",
            name: "Token B",
            address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            decimals: 6,
            chainId: 100,
        }),
    ],
} as const;

const makeExchangeInfo = (
    {
        lpTotalSupply = JSBI.BigInt(200_000_000),
        tokenAAmount = JSBI.BigInt(100_000_000),
        tokenBAmount = JSBI.BigInt(100_000_000),
    }: {
        lpTotalSupply?: JSBI;
        tokenAAmount?: JSBI;
        tokenBAmount?: JSBI;
    } = {
        lpTotalSupply: JSBI.BigInt(200_000_000),
        tokenAAmount: JSBI.BigInt(100_000_000),
        tokenBAmount: JSBI.BigInt(100_000_000),
    }
): IExchangeInfo => ({
    ampFactor: JSBI.BigInt(100),
    fees: ZERO_FEES,
    lpTotalSupply: new TokenAmount(exchange.lpToken, lpTotalSupply),
    reserves: [
        {
            reserveAccount: new PublicKey(
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
            ),
            adminFeeAccount: new PublicKey(
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
            ),
            amount: new TokenAmount(exchange.tokens[0], tokenAAmount),
        },
        {
            reserveAccount: new PublicKey(
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
            ),
            adminFeeAccount: new PublicKey(
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
            ),
            amount: new TokenAmount(exchange.tokens[1], tokenBAmount),
        },
    ],
});

const exchangeInfo = makeExchangeInfo();

const exchangeInfoWithFees = {
    ...exchangeInfo,
    fees: RECOMMENDED_FEES,
} as const;

//cant get this to work IDK
describe("Calculated amounts", () => {

    describe("#calculateEstimatedWithdrawAmount", () => {
        it("works", () => {
            calculateEstimatedWithdrawAmount({
                ...exchangeInfo,
                poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
            });
        });

        it("works with fees", () => {
            calculateEstimatedWithdrawAmount({
                ...exchangeInfoWithFees,
                poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
            });
        });

        it("works zero with fees", () => {
            calculateEstimatedWithdrawAmount({
                ...exchangeInfoWithFees,
                poolTokenAmount: new TokenAmount(exchange.lpToken, 0),
            });
        });
    });

    describe("#calculateEstimatedWithdrawOneAmount", () => {
        it("works", () => {
            calculateEstimatedWithdrawOneAmount({
                exchange: exchangeInfo,
                poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
                withdrawToken: exchange.tokens[0],
            });
        });

        it("works with fees", () => {
            const result = calculateEstimatedWithdrawOneAmount({
                exchange: exchangeInfoWithFees,
                poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
                withdrawToken: exchange.tokens[0],
            });

            const resultMapped = mapValues(result, (q) => q.raw.toString());
            expect(resultMapped).toEqual({
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
            const result = calculateEstimatedWithdrawOneAmount({
                exchange: exchangeInfoWithFees,
                poolTokenAmount: new TokenAmount(exchange.lpToken, 0),
                withdrawToken: exchange.tokens[0],
            });

            const resultMapped = mapValues(result, (q) => q.raw.toString());
            expect(resultMapped).toEqual({
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
