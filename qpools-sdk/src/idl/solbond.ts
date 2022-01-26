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
                    "name": "tvlAccount",
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
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "bumpTvlAccount",
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
                    "name": "tvlAccount",
                    "isMut": false,
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
                },
                {
                    "name": "bumpTvlAccount",
                    "type": "u8"
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
                    "name": "tvlAccount",
                    "isMut": false,
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
                },
                {
                    "name": "bumpTvlAccount",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "setTvl",
            "accounts": [
                {
                    "name": "tvlAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "poolAccount",
                    "isMut": false,
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
                }
            ],
            "args": [
                {
                    "name": "newTvlInUsd",
                    "type": "u64"
                },
                {
                    "name": "tvlAccountBump",
                    "type": "u8"
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
        },
        {
            "name": "TvlInfoAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "tvlMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tvlInUsdc",
                        "type": "u64"
                    },
                    {
                        "name": "decimals",
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
            "msg": "Not enough credits!"
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
            "msg": "Custom Math Error 1!"
        },
        {
            "code": 6014,
            "name": "CustomMathError2",
            "msg": "Custom Math Error 2!"
        },
        {
            "code": 6015,
            "name": "CustomMathError3",
            "msg": "Custom Math Error 3!"
        },
        {
            "code": 6016,
            "name": "CustomMathError4",
            "msg": "Custom Math Error 4!"
        },
        {
            "code": 6017,
            "name": "CustomMathError5",
            "msg": "Custom Math Error 5!"
        },
        {
            "code": 6018,
            "name": "CustomMathError6",
            "msg": "Custom Math Error 6!"
        },
        {
            "code": 6019,
            "name": "CustomMathError7",
            "msg": "Custom Math Error 7!"
        },
        {
            "code": 6020,
            "name": "CustomMathError8",
            "msg": "Custom Math Error 8!"
        },
        {
            "code": 6021,
            "name": "CustomMathError9",
            "msg": "Custom Math Error 9!"
        },
        {
            "code": 6022,
            "name": "CustomMathError10",
            "msg": "Custom Math Error 10!"
        },
        {
            "code": 6023,
            "name": "CustomMathError11",
            "msg": "Custom Math Error 11!"
        },
        {
            "code": 6024,
            "name": "CustomMathError12",
            "msg": "Custom Math Error 12!"
        },
        {
            "code": 6025,
            "name": "CustomMathError13",
            "msg": "Custom Math Error 13!"
        },
        {
            "code": 6026,
            "name": "CustomMathError14",
            "msg": "Custom Math Error 14!"
        },
        {
            "code": 6027,
            "name": "CustomMathError15",
            "msg": "Custom Math Error 15!"
        },
        {
            "code": 6028,
            "name": "CustomMathError16",
            "msg": "Custom Math Error 16!"
        },
        {
            "code": 6029,
            "name": "CustomMathError17",
            "msg": "Custom Math Error 17!"
        },
        {
            "code": 6030,
            "name": "CustomMathError18",
            "msg": "Custom Math Error 18!"
        },
        {
            "code": 6031,
            "name": "CustomMathError19",
            "msg": "Custom Math Error 19!"
        },
        {
            "code": 6032,
            "name": "CustomMathError20",
            "msg": "Custom Math Error 20!"
        },
        {
            "code": 6033,
            "name": "CustomMathError21",
            "msg": "Custom Math Error 21!"
        },
        {
            "code": 6034,
            "name": "CustomMathError22",
            "msg": "Custom Math Error 22!"
        },
        {
            "code": 6035,
            "name": "EmptyTotalTokenSupply",
            "msg": "Total Token Supply seems empty!"
        }
    ],
    "metadata": {
        "address": "32jEsmA7t9yiX8MTr6TXmyKDC32rHBQ62ANciJA4g6wt"
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
                    "name": "tvlAccount",
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
                    "name": "bumpBondPoolAccount",
                    "type": "u8"
                },
                {
                    "name": "bumpTvlAccount",
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
                    "name": "tvlAccount",
                    "isMut": false,
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
                },
                {
                    "name": "bumpTvlAccount",
                    "type": "u8"
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
                    "name": "tvlAccount",
                    "isMut": false,
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
                },
                {
                    "name": "bumpTvlAccount",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "setTvl",
            "accounts": [
                {
                    "name": "tvlAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "initializer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "poolAccount",
                    "isMut": false,
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
                }
            ],
            "args": [
                {
                    "name": "newTvlInUsd",
                    "type": "u64"
                },
                {
                    "name": "tvlAccountBump",
                    "type": "u8"
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
        },
        {
            "name": "TvlInfoAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "tvlMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tvlInUsdc",
                        "type": "u64"
                    },
                    {
                        "name": "decimals",
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
            "msg": "Not enough credits!"
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
            "msg": "Custom Math Error 1!"
        },
        {
            "code": 6014,
            "name": "CustomMathError2",
            "msg": "Custom Math Error 2!"
        },
        {
            "code": 6015,
            "name": "CustomMathError3",
            "msg": "Custom Math Error 3!"
        },
        {
            "code": 6016,
            "name": "CustomMathError4",
            "msg": "Custom Math Error 4!"
        },
        {
            "code": 6017,
            "name": "CustomMathError5",
            "msg": "Custom Math Error 5!"
        },
        {
            "code": 6018,
            "name": "CustomMathError6",
            "msg": "Custom Math Error 6!"
        },
        {
            "code": 6019,
            "name": "CustomMathError7",
            "msg": "Custom Math Error 7!"
        },
        {
            "code": 6020,
            "name": "CustomMathError8",
            "msg": "Custom Math Error 8!"
        },
        {
            "code": 6021,
            "name": "CustomMathError9",
            "msg": "Custom Math Error 9!"
        },
        {
            "code": 6022,
            "name": "CustomMathError10",
            "msg": "Custom Math Error 10!"
        },
        {
            "code": 6023,
            "name": "CustomMathError11",
            "msg": "Custom Math Error 11!"
        },
        {
            "code": 6024,
            "name": "CustomMathError12",
            "msg": "Custom Math Error 12!"
        },
        {
            "code": 6025,
            "name": "CustomMathError13",
            "msg": "Custom Math Error 13!"
        },
        {
            "code": 6026,
            "name": "CustomMathError14",
            "msg": "Custom Math Error 14!"
        },
        {
            "code": 6027,
            "name": "CustomMathError15",
            "msg": "Custom Math Error 15!"
        },
        {
            "code": 6028,
            "name": "CustomMathError16",
            "msg": "Custom Math Error 16!"
        },
        {
            "code": 6029,
            "name": "CustomMathError17",
            "msg": "Custom Math Error 17!"
        },
        {
            "code": 6030,
            "name": "CustomMathError18",
            "msg": "Custom Math Error 18!"
        },
        {
            "code": 6031,
            "name": "CustomMathError19",
            "msg": "Custom Math Error 19!"
        },
        {
            "code": 6032,
            "name": "CustomMathError20",
            "msg": "Custom Math Error 20!"
        },
        {
            "code": 6033,
            "name": "CustomMathError21",
            "msg": "Custom Math Error 21!"
        },
        {
            "code": 6034,
            "name": "CustomMathError22",
            "msg": "Custom Math Error 22!"
        },
        {
            "code": 6035,
            "name": "EmptyTotalTokenSupply",
            "msg": "Total Token Supply seems empty!"
        }
    ],
    "metadata": {
        "address": "32jEsmA7t9yiX8MTr6TXmyKDC32rHBQ62ANciJA4g6wt"
    }
}
