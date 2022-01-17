export type SolbondIdl = {
    "version": "0.1.0",
    "name": "solbond",
    "instructions": [
        {
            "name": "healthcheck",
            "accounts": [
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "initializeBondPool",
            "accounts": [
                {
                    "name": "bondPoolAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "purchaseBond",
            "accounts": [
                {
                    "name": "bondPoolAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaser",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "purchaserCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaserRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amountRaw",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "redeemBond",
            "accounts": [
                {
                    "name": "bondPoolAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaser",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "purchaserRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaserCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "redeemableAmountRaw",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "swapPair",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "state",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tickmap",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenXMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenYMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "reserveAccountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveAccountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "xToY",
                    "type": "bool"
                },
                {
                    "name": "amount",
                    "type": "u64"
                },
                {
                    "name": "byAmountIn",
                    "type": "bool"
                },
                {
                    "name": "sqrtPriceLimit",
                    "type": "u128"
                }
            ]
        },
        {
            "name": "createLiquidityPosition",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "state",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionList",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tickmap",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lowerTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "upperTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "positionBump",
                    "type": "u8"
                },
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "lowerTickIndex",
                    "type": "i32"
                },
                {
                    "name": "upperTickIndex",
                    "type": "i32"
                },
                {
                    "name": "liquidityDelta",
                    "type": "u128"
                }
            ]
        },
        {
            "name": "collectFees",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "state",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lowerTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "upperTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenX",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenY",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "index",
                    "type": "u32"
                },
                {
                    "name": "lowerTickIndex",
                    "type": "i32"
                },
                {
                    "name": "upperTickIndex",
                    "type": "i32"
                }
            ]
        },
        {
            "name": "closeLiquidityPosition",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "state",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "removedPosition",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lastPosition",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionList",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tickmap",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lowerTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "upperTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "positionBump",
                    "type": "u8"
                },
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "positionIndex",
                    "type": "u32"
                },
                {
                    "name": "lowerTickIndex",
                    "type": "i32"
                },
                {
                    "name": "upperTickIndex",
                    "type": "i32"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "BondPoolAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "generator",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolRedeemableMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolCurrencyTokenMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolRedeemableTokenAccount",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolCurrencyTokenAccount",
                        "type": "publicKey"
                    },
                    {
                        "name": "bumpBondPoolAccount",
                        "type": "u8"
                    },
                    {
                        "name": "bumpBondPoolTokenAccount",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "InvariantPoolAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "idx",
                        "type": "u32"
                    },
                    {
                        "name": "maxIdx",
                        "type": "u32"
                    },
                    {
                        "name": "pool",
                        "type": "publicKey"
                    },
                    {
                        "name": "state",
                        "type": "publicKey"
                    },
                    {
                        "name": "poolWeight",
                        "type": "u32"
                    },
                    {
                        "name": "tickmap",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenCurrencyMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenXMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "poolTokenCurrencyAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "poolTokenXAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "qpoolTokenCurrencyAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "qpoolTokenXAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "positionInPool",
                        "type": "publicKey"
                    },
                    {
                        "name": "positionListInPool",
                        "type": "publicKey"
                    },
                    {
                        "name": "upperTick",
                        "type": "publicKey"
                    },
                    {
                        "name": "lowerTick",
                        "type": "publicKey"
                    },
                    {
                        "name": "initializer",
                        "type": "publicKey"
                    },
                    {
                        "name": "bumpPoolList",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "LowBondRedeemableAmount",
            "msg": "Redeemables to be paid out are somehow zero!"
        },
        {
            "code": 6001,
            "name": "LowBondTokAmount",
            "msg": "Token to be paid into the bond should not be zero"
        },
        {
            "code": 6002,
            "name": "RedeemCapacity",
            "msg": "Asking for too much SOL when redeeming!"
        },
        {
            "code": 6003,
            "name": "MinPurchaseAmount",
            "msg": "Need to send more than 0 SOL!"
        },
        {
            "code": 6004,
            "name": "TimeFrameIsNotAnInterval",
            "msg": "Provided times are not an interval (end-time before start-time!)"
        },
        {
            "code": 6005,
            "name": "TimeFrameIsInThePast",
            "msg": "Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts."
        },
        {
            "code": 6006,
            "name": "TimeFrameCannotPurchaseAdditionalBondAmount",
            "msg": "Bond is already locked, you cannot pay in more into this bond!"
        },
        {
            "code": 6007,
            "name": "TimeFrameNotPassed",
            "msg": "Bond has not gone past timeframe yet"
        },
        {
            "code": 6008,
            "name": "MarketRateOverflow",
            "msg": "There was an issue computing the market rate. MarketRateOverflow"
        },
        {
            "code": 6009,
            "name": "MarketRateUnderflow",
            "msg": "There was an issue computing the market rate. MarketRateUnderflow"
        },
        {
            "code": 6010,
            "name": "PayoutError",
            "msg": "Paying out more than was initially paid in"
        },
        {
            "code": 6011,
            "name": "Calculation",
            "msg": "Redeemable-calculation doesnt add up"
        },
        {
            "code": 6012,
            "name": "ReturningNoCurrency",
            "msg": "Returning no Tokens!"
        },
        {
            "code": 6013,
            "name": "CustomMathError1",
            "msg": "Custom Error 1!"
        },
        {
            "code": 6014,
            "name": "CustomMathError2",
            "msg": "Custom Error 2!"
        },
        {
            "code": 6015,
            "name": "CustomMathError3",
            "msg": "Custom Error 3!"
        },
        {
            "code": 6016,
            "name": "CustomMathError4",
            "msg": "Custom Error 4!"
        },
        {
            "code": 6017,
            "name": "CustomMathError5",
            "msg": "Custom Error 5!"
        },
        {
            "code": 6018,
            "name": "CustomMathError6",
            "msg": "Custom Error 6!"
        },
        {
            "code": 6019,
            "name": "CustomMathError7",
            "msg": "Custom Error 7!"
        },
        {
            "code": 6020,
            "name": "CustomMathError8",
            "msg": "Custom Error 8!"
        },
        {
            "code": 6021,
            "name": "EmptyTotalTokenSupply",
            "msg": "Total Token Supply seems empty!"
        }
    ],
    "metadata": {
        "address": "3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"
    }
}

export const IDL: SolbondIdl = {
    "version": "0.1.0",
    "name": "solbond",
    "instructions": [
        {
            "name": "healthcheck",
            "accounts": [
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "initializeBondPool",
            "accounts": [
                {
                    "name": "bondPoolAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "purchaseBond",
            "accounts": [
                {
                    "name": "bondPoolAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaser",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "purchaserCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaserRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amountRaw",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "redeemBond",
            "accounts": [
                {
                    "name": "bondPoolAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaser",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "purchaserRedeemableTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "purchaserCurrencyTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "clock",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "redeemableAmountRaw",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "swapPair",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "state",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tickmap",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenXMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenYMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "reserveAccountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveAccountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "xToY",
                    "type": "bool"
                },
                {
                    "name": "amount",
                    "type": "u64"
                },
                {
                    "name": "byAmountIn",
                    "type": "bool"
                },
                {
                    "name": "sqrtPriceLimit",
                    "type": "u128"
                }
            ]
        },
        {
            "name": "createLiquidityPosition",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "state",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionList",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tickmap",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lowerTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "upperTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "positionBump",
                    "type": "u8"
                },
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "lowerTickIndex",
                    "type": "i32"
                },
                {
                    "name": "upperTickIndex",
                    "type": "i32"
                },
                {
                    "name": "liquidityDelta",
                    "type": "u128"
                }
            ]
        },
        {
            "name": "collectFees",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "state",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "position",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lowerTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "upperTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenX",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenY",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "index",
                    "type": "u32"
                },
                {
                    "name": "lowerTickIndex",
                    "type": "i32"
                },
                {
                    "name": "upperTickIndex",
                    "type": "i32"
                }
            ]
        },
        {
            "name": "closeLiquidityPosition",
            "accounts": [
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "state",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "removedPosition",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lastPosition",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "pool",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "positionList",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "bondPoolCurrencyTokenMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tickmap",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "lowerTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "upperTick",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "accountY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveX",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "reserveY",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "programAuthority",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "invariantProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "positionBump",
                    "type": "u8"
                },
                {
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "positionIndex",
                    "type": "u32"
                },
                {
                    "name": "lowerTickIndex",
                    "type": "i32"
                },
                {
                    "name": "upperTickIndex",
                    "type": "i32"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "BondPoolAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "generator",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolRedeemableMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolCurrencyTokenMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolRedeemableTokenAccount",
                        "type": "publicKey"
                    },
                    {
                        "name": "bondPoolCurrencyTokenAccount",
                        "type": "publicKey"
                    },
                    {
                        "name": "bumpBondPoolAccount",
                        "type": "u8"
                    },
                    {
                        "name": "bumpBondPoolTokenAccount",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "InvariantPoolAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "idx",
                        "type": "u32"
                    },
                    {
                        "name": "maxIdx",
                        "type": "u32"
                    },
                    {
                        "name": "pool",
                        "type": "publicKey"
                    },
                    {
                        "name": "state",
                        "type": "publicKey"
                    },
                    {
                        "name": "poolWeight",
                        "type": "u32"
                    },
                    {
                        "name": "tickmap",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenCurrencyMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenXMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "poolTokenCurrencyAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "poolTokenXAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "qpoolTokenCurrencyAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "qpoolTokenXAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "positionInPool",
                        "type": "publicKey"
                    },
                    {
                        "name": "positionListInPool",
                        "type": "publicKey"
                    },
                    {
                        "name": "upperTick",
                        "type": "publicKey"
                    },
                    {
                        "name": "lowerTick",
                        "type": "publicKey"
                    },
                    {
                        "name": "initializer",
                        "type": "publicKey"
                    },
                    {
                        "name": "bumpPoolList",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "LowBondRedeemableAmount",
            "msg": "Redeemables to be paid out are somehow zero!"
        },
        {
            "code": 6001,
            "name": "LowBondTokAmount",
            "msg": "Token to be paid into the bond should not be zero"
        },
        {
            "code": 6002,
            "name": "RedeemCapacity",
            "msg": "Asking for too much SOL when redeeming!"
        },
        {
            "code": 6003,
            "name": "MinPurchaseAmount",
            "msg": "Need to send more than 0 SOL!"
        },
        {
            "code": 6004,
            "name": "TimeFrameIsNotAnInterval",
            "msg": "Provided times are not an interval (end-time before start-time!)"
        },
        {
            "code": 6005,
            "name": "TimeFrameIsInThePast",
            "msg": "Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts."
        },
        {
            "code": 6006,
            "name": "TimeFrameCannotPurchaseAdditionalBondAmount",
            "msg": "Bond is already locked, you cannot pay in more into this bond!"
        },
        {
            "code": 6007,
            "name": "TimeFrameNotPassed",
            "msg": "Bond has not gone past timeframe yet"
        },
        {
            "code": 6008,
            "name": "MarketRateOverflow",
            "msg": "There was an issue computing the market rate. MarketRateOverflow"
        },
        {
            "code": 6009,
            "name": "MarketRateUnderflow",
            "msg": "There was an issue computing the market rate. MarketRateUnderflow"
        },
        {
            "code": 6010,
            "name": "PayoutError",
            "msg": "Paying out more than was initially paid in"
        },
        {
            "code": 6011,
            "name": "Calculation",
            "msg": "Redeemable-calculation doesnt add up"
        },
        {
            "code": 6012,
            "name": "ReturningNoCurrency",
            "msg": "Returning no Tokens!"
        },
        {
            "code": 6013,
            "name": "CustomMathError1",
            "msg": "Custom Error 1!"
        },
        {
            "code": 6014,
            "name": "CustomMathError2",
            "msg": "Custom Error 2!"
        },
        {
            "code": 6015,
            "name": "CustomMathError3",
            "msg": "Custom Error 3!"
        },
        {
            "code": 6016,
            "name": "CustomMathError4",
            "msg": "Custom Error 4!"
        },
        {
            "code": 6017,
            "name": "CustomMathError5",
            "msg": "Custom Error 5!"
        },
        {
            "code": 6018,
            "name": "CustomMathError6",
            "msg": "Custom Error 6!"
        },
        {
            "code": 6019,
            "name": "CustomMathError7",
            "msg": "Custom Error 7!"
        },
        {
            "code": 6020,
            "name": "CustomMathError8",
            "msg": "Custom Error 8!"
        },
        {
            "code": 6021,
            "name": "EmptyTotalTokenSupply",
            "msg": "Total Token Supply seems empty!"
        }
    ],
    "metadata": {
        "address": "3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"
    }
}
