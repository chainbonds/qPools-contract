export type Solbond = {
  "version": "0.1.0",
  "name": "solbond",
  "instructions": [
    {
      "name": "createPortfolio",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "portfolioPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sumOfWeights",
          "type": "u64"
        },
        {
          "name": "numPositions",
          "type": "u32"
        },
        {
          "name": "numCurrencies",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approvePositionWeightSaber",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        },
        {
          "name": "maxInitialTokenAAmount",
          "type": "u64"
        },
        {
          "name": "maxInitialTokenBAmount",
          "type": "u64"
        },
        {
          "name": "minMintAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approvePositionWeightMarinade",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerSolPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpMarinade",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        },
        {
          "name": "initialSolAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approvePositionWeightSolend",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpCurrency",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        },
        {
          "name": "inputAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "transferToPortfolio",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userOwnedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaOwnedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpUserCurrency",
          "type": "u8"
        }
      ]
    },
    {
      "name": "approveWithdrawToUser",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "portfolioPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        }
      ]
    },
    {
      "name": "approveWithdrawAmountSaber",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpPosition",
          "type": "u8"
        },
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumTokenAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approveWithdrawMarinade",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaMsolAccount",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpPosition",
          "type": "u8"
        },
        {
          "name": "bumpMsolAta",
          "type": "u8"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approveWithdrawSolend",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpPosition",
          "type": "u8"
        },
        {
          "name": "withdrawAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approveInitialCurrencyAmount",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputAmountCurrency",
          "type": "u64"
        }
      ]
    },
    {
      "name": "approveCurrencyWithdrawAmount",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpUserCurrency",
          "type": "u8"
        },
        {
          "name": "withdrawAmountCurrency",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createPositionMarinade",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerSolPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpMarinade",
          "type": "u8"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createPositionSaber",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "outputLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swapAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swap",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "qpoolsA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccountA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccountB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "qpoolsB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberSwapProgram",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createPositionSolend",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "liquidityMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solendProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "redeemPositionOneSaber",
      "accounts": [
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "swapAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swap",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "inputLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feesA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberSwapProgram",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "redeemPositionSolend",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sourceCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liquidityMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solendProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAtaLiq",
          "type": "u8"
        },
        {
          "name": "bumpAtaCol",
          "type": "u8"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "transferRedeemedToUser",
      "accounts": [
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userOwnedUserA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaOwnedUserA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpUserCurrency",
          "type": "u8"
        },
        {
          "name": "bumpAta",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "portfolioAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "toBeRedeemed",
            "type": "bool"
          },
          {
            "name": "fullyCreated",
            "type": "bool"
          },
          {
            "name": "sumOfWeights",
            "type": "u64"
          },
          {
            "name": "numRedeemed",
            "type": "u32"
          },
          {
            "name": "numPositions",
            "type": "u32"
          },
          {
            "name": "numCreated",
            "type": "u32"
          },
          {
            "name": "numCurrencies",
            "type": "u32"
          },
          {
            "name": "numCurrenciesSentBack",
            "type": "u32"
          },
          {
            "name": "startTimestamp",
            "type": "i64"
          },
          {
            "name": "fulfilledTimestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionAccountMarinade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioPda",
            "type": "publicKey"
          },
          {
            "name": "isFulfilled",
            "type": "bool"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemApproved",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "initialSolAmount",
            "type": "u64"
          },
          {
            "name": "msolOutAmount",
            "type": "u64"
          },
          {
            "name": "withdrawSolAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionAccountSaber",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioPda",
            "type": "publicKey"
          },
          {
            "name": "poolAddress",
            "type": "publicKey"
          },
          {
            "name": "isFulfilled",
            "type": "bool"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemApproved",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "maxInitialTokenAAmount",
            "type": "u64"
          },
          {
            "name": "maxInitialTokenBAmount",
            "type": "u64"
          },
          {
            "name": "minMintAmount",
            "type": "u64"
          },
          {
            "name": "poolTokenAmount",
            "type": "u64"
          },
          {
            "name": "minimumTokenAmountOut",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionAccountSolend",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioPda",
            "type": "publicKey"
          },
          {
            "name": "currencyMint",
            "type": "publicKey"
          },
          {
            "name": "poolAddress",
            "type": "publicKey"
          },
          {
            "name": "isFulfilled",
            "type": "bool"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemApproved",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "initialAmount",
            "type": "u64"
          },
          {
            "name": "withdrawAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userCurrencyAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "initialAmount",
            "type": "u64"
          },
          {
            "name": "withdrawAmount",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PortfolioNotFullyCreated"
          },
          {
            "name": "IndexHigherThanNumPos"
          },
          {
            "name": "MarinadeNeedsMoreThanOneSol"
          },
          {
            "name": "RedeemNotApproved"
          },
          {
            "name": "PositionAlreadyRedeemed"
          },
          {
            "name": "RedeemAlreadyApproved"
          },
          {
            "name": "PositionNotFulfilledYet"
          },
          {
            "name": "AllPositionsRedeemed"
          },
          {
            "name": "NotReadyForTransferBack"
          },
          {
            "name": "ProvidedMintNotMatching"
          },
          {
            "name": "ProvidedPortfolioNotMatching"
          },
          {
            "name": "PositionFullyCreatedError"
          },
          {
            "name": "PositionAlreadyFulfilledError"
          },
          {
            "name": "LowBondRedeemableAmount"
          },
          {
            "name": "LowBondTokAmount"
          },
          {
            "name": "RedeemCapacity"
          },
          {
            "name": "MinPurchaseAmount"
          },
          {
            "name": "TimeFrameIsNotAnInterval"
          },
          {
            "name": "TimeFrameIsInThePast"
          },
          {
            "name": "TimeFrameCannotPurchaseAdditionalBondAmount"
          },
          {
            "name": "TimeFrameNotPassed"
          },
          {
            "name": "MarketRateOverflow"
          },
          {
            "name": "MarketRateUnderflow"
          },
          {
            "name": "PayoutError"
          },
          {
            "name": "Calculation"
          },
          {
            "name": "ReturningNoCurrency"
          },
          {
            "name": "CustomMathError1"
          },
          {
            "name": "CustomMathError2"
          },
          {
            "name": "CustomMathError3"
          },
          {
            "name": "CustomMathError4"
          },
          {
            "name": "CustomMathError5"
          },
          {
            "name": "CustomMathError6"
          },
          {
            "name": "CustomMathError7"
          },
          {
            "name": "CustomMathError8"
          },
          {
            "name": "CustomMathError9"
          },
          {
            "name": "CustomMathError10"
          },
          {
            "name": "CustomMathError11"
          },
          {
            "name": "CustomMathError12"
          },
          {
            "name": "CustomMathError13"
          },
          {
            "name": "CustomMathError14"
          },
          {
            "name": "CustomMathError15"
          },
          {
            "name": "CustomMathError16"
          },
          {
            "name": "CustomMathError17"
          },
          {
            "name": "CustomMathError18"
          },
          {
            "name": "CustomMathError19"
          },
          {
            "name": "CustomMathError20"
          },
          {
            "name": "CustomMathError21"
          },
          {
            "name": "CustomMathError22"
          },
          {
            "name": "EmptyTotalTokenSupply"
          },
          {
            "name": "EmptyTotalCurrencySupply"
          }
        ]
      }
    }
  ]
};

export const IDL: Solbond = {
  "version": "0.1.0",
  "name": "solbond",
  "instructions": [
    {
      "name": "createPortfolio",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "portfolioPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sumOfWeights",
          "type": "u64"
        },
        {
          "name": "numPositions",
          "type": "u32"
        },
        {
          "name": "numCurrencies",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approvePositionWeightSaber",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        },
        {
          "name": "maxInitialTokenAAmount",
          "type": "u64"
        },
        {
          "name": "maxInitialTokenBAmount",
          "type": "u64"
        },
        {
          "name": "minMintAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approvePositionWeightMarinade",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerSolPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpMarinade",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        },
        {
          "name": "initialSolAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approvePositionWeightSolend",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpCurrency",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        },
        {
          "name": "inputAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "transferToPortfolio",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userOwnedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaOwnedTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpUserCurrency",
          "type": "u8"
        }
      ]
    },
    {
      "name": "approveWithdrawToUser",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "portfolioPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        }
      ]
    },
    {
      "name": "approveWithdrawAmountSaber",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpPosition",
          "type": "u8"
        },
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumTokenAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approveWithdrawMarinade",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userMsolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaMsolAccount",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpPosition",
          "type": "u8"
        },
        {
          "name": "bumpMsolAta",
          "type": "u8"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approveWithdrawSolend",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpPosition",
          "type": "u8"
        },
        {
          "name": "withdrawAmount",
          "type": "u64"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "approveInitialCurrencyAmount",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "inputAmountCurrency",
          "type": "u64"
        }
      ]
    },
    {
      "name": "approveCurrencyWithdrawAmount",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpPortfolio",
          "type": "u8"
        },
        {
          "name": "bumpUserCurrency",
          "type": "u8"
        },
        {
          "name": "withdrawAmountCurrency",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createPositionMarinade",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolSolLegPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLeg",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liqPoolMsolLegAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reservePda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "msolMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerSolPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marinadeProgram",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpMarinade",
          "type": "u8"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createPositionSaber",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "outputLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swapAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swap",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "qpoolsA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccountA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccountB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "qpoolsB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberSwapProgram",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createPositionSolend",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "liquidityMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destinationCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solendProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "redeemPositionOneSaber",
      "accounts": [
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "swapAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swap",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "inputLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feesA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reserveB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "saberSwapProgram",
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "redeemPositionSolend",
      "accounts": [
        {
          "name": "positionPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sourceCollateral",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liquidityMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationLiquidity",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveCollateralMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveLiquiditySupply",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lendingMarket",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lendingMarketAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solendProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": true,
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
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAtaLiq",
          "type": "u8"
        },
        {
          "name": "bumpAtaCol",
          "type": "u8"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "transferRedeemedToUser",
      "accounts": [
        {
          "name": "portfolioPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "puller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userCurrencyPdaAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userOwnedUserA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pdaOwnedUserA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "currencyMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpUserCurrency",
          "type": "u8"
        },
        {
          "name": "bumpAta",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "portfolioAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "toBeRedeemed",
            "type": "bool"
          },
          {
            "name": "fullyCreated",
            "type": "bool"
          },
          {
            "name": "sumOfWeights",
            "type": "u64"
          },
          {
            "name": "numRedeemed",
            "type": "u32"
          },
          {
            "name": "numPositions",
            "type": "u32"
          },
          {
            "name": "numCreated",
            "type": "u32"
          },
          {
            "name": "numCurrencies",
            "type": "u32"
          },
          {
            "name": "numCurrenciesSentBack",
            "type": "u32"
          },
          {
            "name": "startTimestamp",
            "type": "i64"
          },
          {
            "name": "fulfilledTimestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionAccountMarinade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioPda",
            "type": "publicKey"
          },
          {
            "name": "isFulfilled",
            "type": "bool"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemApproved",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "initialSolAmount",
            "type": "u64"
          },
          {
            "name": "msolOutAmount",
            "type": "u64"
          },
          {
            "name": "withdrawSolAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionAccountSaber",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioPda",
            "type": "publicKey"
          },
          {
            "name": "poolAddress",
            "type": "publicKey"
          },
          {
            "name": "isFulfilled",
            "type": "bool"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemApproved",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "maxInitialTokenAAmount",
            "type": "u64"
          },
          {
            "name": "maxInitialTokenBAmount",
            "type": "u64"
          },
          {
            "name": "minMintAmount",
            "type": "u64"
          },
          {
            "name": "poolTokenAmount",
            "type": "u64"
          },
          {
            "name": "minimumTokenAmountOut",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "positionAccountSolend",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "portfolioPda",
            "type": "publicKey"
          },
          {
            "name": "currencyMint",
            "type": "publicKey"
          },
          {
            "name": "poolAddress",
            "type": "publicKey"
          },
          {
            "name": "isFulfilled",
            "type": "bool"
          },
          {
            "name": "isRedeemed",
            "type": "bool"
          },
          {
            "name": "redeemApproved",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "initialAmount",
            "type": "u64"
          },
          {
            "name": "withdrawAmount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userCurrencyAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "initialAmount",
            "type": "u64"
          },
          {
            "name": "withdrawAmount",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PortfolioNotFullyCreated"
          },
          {
            "name": "IndexHigherThanNumPos"
          },
          {
            "name": "MarinadeNeedsMoreThanOneSol"
          },
          {
            "name": "RedeemNotApproved"
          },
          {
            "name": "PositionAlreadyRedeemed"
          },
          {
            "name": "RedeemAlreadyApproved"
          },
          {
            "name": "PositionNotFulfilledYet"
          },
          {
            "name": "AllPositionsRedeemed"
          },
          {
            "name": "NotReadyForTransferBack"
          },
          {
            "name": "ProvidedMintNotMatching"
          },
          {
            "name": "ProvidedPortfolioNotMatching"
          },
          {
            "name": "PositionFullyCreatedError"
          },
          {
            "name": "PositionAlreadyFulfilledError"
          },
          {
            "name": "LowBondRedeemableAmount"
          },
          {
            "name": "LowBondTokAmount"
          },
          {
            "name": "RedeemCapacity"
          },
          {
            "name": "MinPurchaseAmount"
          },
          {
            "name": "TimeFrameIsNotAnInterval"
          },
          {
            "name": "TimeFrameIsInThePast"
          },
          {
            "name": "TimeFrameCannotPurchaseAdditionalBondAmount"
          },
          {
            "name": "TimeFrameNotPassed"
          },
          {
            "name": "MarketRateOverflow"
          },
          {
            "name": "MarketRateUnderflow"
          },
          {
            "name": "PayoutError"
          },
          {
            "name": "Calculation"
          },
          {
            "name": "ReturningNoCurrency"
          },
          {
            "name": "CustomMathError1"
          },
          {
            "name": "CustomMathError2"
          },
          {
            "name": "CustomMathError3"
          },
          {
            "name": "CustomMathError4"
          },
          {
            "name": "CustomMathError5"
          },
          {
            "name": "CustomMathError6"
          },
          {
            "name": "CustomMathError7"
          },
          {
            "name": "CustomMathError8"
          },
          {
            "name": "CustomMathError9"
          },
          {
            "name": "CustomMathError10"
          },
          {
            "name": "CustomMathError11"
          },
          {
            "name": "CustomMathError12"
          },
          {
            "name": "CustomMathError13"
          },
          {
            "name": "CustomMathError14"
          },
          {
            "name": "CustomMathError15"
          },
          {
            "name": "CustomMathError16"
          },
          {
            "name": "CustomMathError17"
          },
          {
            "name": "CustomMathError18"
          },
          {
            "name": "CustomMathError19"
          },
          {
            "name": "CustomMathError20"
          },
          {
            "name": "CustomMathError21"
          },
          {
            "name": "CustomMathError22"
          },
          {
            "name": "EmptyTotalTokenSupply"
          },
          {
            "name": "EmptyTotalCurrencySupply"
          }
        ]
      }
    }
  ]
};
