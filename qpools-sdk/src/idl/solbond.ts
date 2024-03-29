export type Solbond = {
  "version": "0.1.0",
  "name": "solbond",
  "instructions": [
    {
      "name": "createPortfolio",
      "accounts": [
        {
          "name": "owner",
          "isMut": false,
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
          "name": "bump",
          "type": "u8"
        },
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
          "name": "bumpPosition",
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
          "name": "bumpPosition",
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
          "name": "bumpPosition",
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
        },
        {
          "name": "bumpAta",
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
          "name": "bumpUserCurrency",
          "type": "u8"
        },
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
          "name": "bumpAtaA",
          "type": "u8"
        },
        {
          "name": "bumpAtaB",
          "type": "u8"
        },
        {
          "name": "bumpAtaLp",
          "type": "u8"
        },
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
          "name": "bumpAtaA",
          "type": "u8"
        },
        {
          "name": "bumpAtaLp",
          "type": "u8"
        },
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
  "errors": [
    {
      "code": 6000,
      "name": "PortfolioNotFullyCreated",
      "msg": "Position can't be set for redeem before portfolio completion"
    },
    {
      "code": 6001,
      "name": "IndexHigherThanNumPos",
      "msg": "Index of position surpasses approved number of positions"
    },
    {
      "code": 6002,
      "name": "MarinadeNeedsMoreThanOneSol",
      "msg": "Marinade needs more than 1 SOL"
    },
    {
      "code": 6003,
      "name": "RedeemNotApproved",
      "msg": "Redeem has not been approved yet!"
    },
    {
      "code": 6004,
      "name": "PositionAlreadyRedeemed",
      "msg": "Position has already been redeemed!"
    },
    {
      "code": 6005,
      "name": "RedeemAlreadyApproved",
      "msg": "Redeem already approved"
    },
    {
      "code": 6006,
      "name": "PositionNotFulfilledYet",
      "msg": "Position can't be redeemed before fulfillment"
    },
    {
      "code": 6007,
      "name": "AllPositionsRedeemed",
      "msg": "All positions have already been redeemed! You can transfer the funds back"
    },
    {
      "code": 6008,
      "name": "NotReadyForTransferBack",
      "msg": "Positions have to redeemed before the funds get transfered back"
    },
    {
      "code": 6009,
      "name": "ProvidedMintNotMatching",
      "msg": "Provided LP mints don't match!"
    },
    {
      "code": 6010,
      "name": "ProvidedPortfolioNotMatching",
      "msg": "Provided Portfolios don't match!"
    },
    {
      "code": 6011,
      "name": "PositionFullyCreatedError",
      "msg": "Position already fully created!"
    },
    {
      "code": 6012,
      "name": "PositionAlreadyFulfilledError",
      "msg": "Position already fulfilled!"
    },
    {
      "code": 6013,
      "name": "LowBondRedeemableAmount",
      "msg": "Redeemables to be paid out are somehow zero!"
    },
    {
      "code": 6014,
      "name": "LowBondTokAmount",
      "msg": "Token to be paid into the bond should not be zero"
    },
    {
      "code": 6015,
      "name": "RedeemCapacity",
      "msg": "Asking for too much SOL when redeeming!"
    },
    {
      "code": 6016,
      "name": "MinPurchaseAmount",
      "msg": "Not enough credits!"
    },
    {
      "code": 6017,
      "name": "TimeFrameIsNotAnInterval",
      "msg": "Provided times are not an interval (end-time before start-time!)"
    },
    {
      "code": 6018,
      "name": "TimeFrameIsInThePast",
      "msg": "Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts."
    },
    {
      "code": 6019,
      "name": "TimeFrameCannotPurchaseAdditionalBondAmount",
      "msg": "Bond is already locked, you cannot pay in more into this bond!"
    },
    {
      "code": 6020,
      "name": "TimeFrameNotPassed",
      "msg": "Bond has not gone past timeframe yet"
    },
    {
      "code": 6021,
      "name": "MarketRateOverflow",
      "msg": "There was an issue computing the market rate. MarketRateOverflow"
    },
    {
      "code": 6022,
      "name": "MarketRateUnderflow",
      "msg": "There was an issue computing the market rate. MarketRateUnderflow"
    },
    {
      "code": 6023,
      "name": "PayoutError",
      "msg": "Paying out more than was initially paid in"
    },
    {
      "code": 6024,
      "name": "Calculation",
      "msg": "Redeemable-calculation doesnt add up"
    },
    {
      "code": 6025,
      "name": "ReturningNoCurrency",
      "msg": "Returning no Tokens!"
    },
    {
      "code": 6026,
      "name": "CustomMathError1",
      "msg": "Custom Math Error 1!"
    },
    {
      "code": 6027,
      "name": "CustomMathError2",
      "msg": "Custom Math Error 2!"
    },
    {
      "code": 6028,
      "name": "CustomMathError3",
      "msg": "Custom Math Error 3!"
    },
    {
      "code": 6029,
      "name": "CustomMathError4",
      "msg": "Custom Math Error 4!"
    },
    {
      "code": 6030,
      "name": "CustomMathError5",
      "msg": "Custom Math Error 5!"
    },
    {
      "code": 6031,
      "name": "CustomMathError6",
      "msg": "Custom Math Error 6!"
    },
    {
      "code": 6032,
      "name": "CustomMathError7",
      "msg": "Custom Math Error 7!"
    },
    {
      "code": 6033,
      "name": "CustomMathError8",
      "msg": "Custom Math Error 8!"
    },
    {
      "code": 6034,
      "name": "CustomMathError9",
      "msg": "Custom Math Error 9!"
    },
    {
      "code": 6035,
      "name": "CustomMathError10",
      "msg": "Custom Math Error 10!"
    },
    {
      "code": 6036,
      "name": "CustomMathError11",
      "msg": "Custom Math Error 11!"
    },
    {
      "code": 6037,
      "name": "CustomMathError12",
      "msg": "Custom Math Error 12!"
    },
    {
      "code": 6038,
      "name": "CustomMathError13",
      "msg": "Custom Math Error 13!"
    },
    {
      "code": 6039,
      "name": "CustomMathError14",
      "msg": "Custom Math Error 14!"
    },
    {
      "code": 6040,
      "name": "CustomMathError15",
      "msg": "Custom Math Error 15!"
    },
    {
      "code": 6041,
      "name": "CustomMathError16",
      "msg": "Custom Math Error 16!"
    },
    {
      "code": 6042,
      "name": "CustomMathError17",
      "msg": "Custom Math Error 17!"
    },
    {
      "code": 6043,
      "name": "CustomMathError18",
      "msg": "Custom Math Error 18!"
    },
    {
      "code": 6044,
      "name": "CustomMathError19",
      "msg": "Custom Math Error 19!"
    },
    {
      "code": 6045,
      "name": "CustomMathError20",
      "msg": "Custom Math Error 20!"
    },
    {
      "code": 6046,
      "name": "CustomMathError21",
      "msg": "Custom Math Error 21!"
    },
    {
      "code": 6047,
      "name": "CustomMathError22",
      "msg": "Custom Math Error 22!"
    },
    {
      "code": 6048,
      "name": "EmptyTotalTokenSupply",
      "msg": "Total Token Supply seems empty!"
    },
    {
      "code": 6049,
      "name": "EmptyTotalCurrencySupply",
      "msg": "Total Currency Supply seems empty!"
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
          "isMut": false,
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
          "name": "bump",
          "type": "u8"
        },
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
          "name": "bumpPosition",
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
          "name": "bumpPosition",
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
          "name": "bumpPosition",
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
        },
        {
          "name": "bumpAta",
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
          "name": "bumpUserCurrency",
          "type": "u8"
        },
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
          "name": "bumpAtaA",
          "type": "u8"
        },
        {
          "name": "bumpAtaB",
          "type": "u8"
        },
        {
          "name": "bumpAtaLp",
          "type": "u8"
        },
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
          "name": "bumpAtaA",
          "type": "u8"
        },
        {
          "name": "bumpAtaLp",
          "type": "u8"
        },
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
  "errors": [
    {
      "code": 6000,
      "name": "PortfolioNotFullyCreated",
      "msg": "Position can't be set for redeem before portfolio completion"
    },
    {
      "code": 6001,
      "name": "IndexHigherThanNumPos",
      "msg": "Index of position surpasses approved number of positions"
    },
    {
      "code": 6002,
      "name": "MarinadeNeedsMoreThanOneSol",
      "msg": "Marinade needs more than 1 SOL"
    },
    {
      "code": 6003,
      "name": "RedeemNotApproved",
      "msg": "Redeem has not been approved yet!"
    },
    {
      "code": 6004,
      "name": "PositionAlreadyRedeemed",
      "msg": "Position has already been redeemed!"
    },
    {
      "code": 6005,
      "name": "RedeemAlreadyApproved",
      "msg": "Redeem already approved"
    },
    {
      "code": 6006,
      "name": "PositionNotFulfilledYet",
      "msg": "Position can't be redeemed before fulfillment"
    },
    {
      "code": 6007,
      "name": "AllPositionsRedeemed",
      "msg": "All positions have already been redeemed! You can transfer the funds back"
    },
    {
      "code": 6008,
      "name": "NotReadyForTransferBack",
      "msg": "Positions have to redeemed before the funds get transfered back"
    },
    {
      "code": 6009,
      "name": "ProvidedMintNotMatching",
      "msg": "Provided LP mints don't match!"
    },
    {
      "code": 6010,
      "name": "ProvidedPortfolioNotMatching",
      "msg": "Provided Portfolios don't match!"
    },
    {
      "code": 6011,
      "name": "PositionFullyCreatedError",
      "msg": "Position already fully created!"
    },
    {
      "code": 6012,
      "name": "PositionAlreadyFulfilledError",
      "msg": "Position already fulfilled!"
    },
    {
      "code": 6013,
      "name": "LowBondRedeemableAmount",
      "msg": "Redeemables to be paid out are somehow zero!"
    },
    {
      "code": 6014,
      "name": "LowBondTokAmount",
      "msg": "Token to be paid into the bond should not be zero"
    },
    {
      "code": 6015,
      "name": "RedeemCapacity",
      "msg": "Asking for too much SOL when redeeming!"
    },
    {
      "code": 6016,
      "name": "MinPurchaseAmount",
      "msg": "Not enough credits!"
    },
    {
      "code": 6017,
      "name": "TimeFrameIsNotAnInterval",
      "msg": "Provided times are not an interval (end-time before start-time!)"
    },
    {
      "code": 6018,
      "name": "TimeFrameIsInThePast",
      "msg": "Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts."
    },
    {
      "code": 6019,
      "name": "TimeFrameCannotPurchaseAdditionalBondAmount",
      "msg": "Bond is already locked, you cannot pay in more into this bond!"
    },
    {
      "code": 6020,
      "name": "TimeFrameNotPassed",
      "msg": "Bond has not gone past timeframe yet"
    },
    {
      "code": 6021,
      "name": "MarketRateOverflow",
      "msg": "There was an issue computing the market rate. MarketRateOverflow"
    },
    {
      "code": 6022,
      "name": "MarketRateUnderflow",
      "msg": "There was an issue computing the market rate. MarketRateUnderflow"
    },
    {
      "code": 6023,
      "name": "PayoutError",
      "msg": "Paying out more than was initially paid in"
    },
    {
      "code": 6024,
      "name": "Calculation",
      "msg": "Redeemable-calculation doesnt add up"
    },
    {
      "code": 6025,
      "name": "ReturningNoCurrency",
      "msg": "Returning no Tokens!"
    },
    {
      "code": 6026,
      "name": "CustomMathError1",
      "msg": "Custom Math Error 1!"
    },
    {
      "code": 6027,
      "name": "CustomMathError2",
      "msg": "Custom Math Error 2!"
    },
    {
      "code": 6028,
      "name": "CustomMathError3",
      "msg": "Custom Math Error 3!"
    },
    {
      "code": 6029,
      "name": "CustomMathError4",
      "msg": "Custom Math Error 4!"
    },
    {
      "code": 6030,
      "name": "CustomMathError5",
      "msg": "Custom Math Error 5!"
    },
    {
      "code": 6031,
      "name": "CustomMathError6",
      "msg": "Custom Math Error 6!"
    },
    {
      "code": 6032,
      "name": "CustomMathError7",
      "msg": "Custom Math Error 7!"
    },
    {
      "code": 6033,
      "name": "CustomMathError8",
      "msg": "Custom Math Error 8!"
    },
    {
      "code": 6034,
      "name": "CustomMathError9",
      "msg": "Custom Math Error 9!"
    },
    {
      "code": 6035,
      "name": "CustomMathError10",
      "msg": "Custom Math Error 10!"
    },
    {
      "code": 6036,
      "name": "CustomMathError11",
      "msg": "Custom Math Error 11!"
    },
    {
      "code": 6037,
      "name": "CustomMathError12",
      "msg": "Custom Math Error 12!"
    },
    {
      "code": 6038,
      "name": "CustomMathError13",
      "msg": "Custom Math Error 13!"
    },
    {
      "code": 6039,
      "name": "CustomMathError14",
      "msg": "Custom Math Error 14!"
    },
    {
      "code": 6040,
      "name": "CustomMathError15",
      "msg": "Custom Math Error 15!"
    },
    {
      "code": 6041,
      "name": "CustomMathError16",
      "msg": "Custom Math Error 16!"
    },
    {
      "code": 6042,
      "name": "CustomMathError17",
      "msg": "Custom Math Error 17!"
    },
    {
      "code": 6043,
      "name": "CustomMathError18",
      "msg": "Custom Math Error 18!"
    },
    {
      "code": 6044,
      "name": "CustomMathError19",
      "msg": "Custom Math Error 19!"
    },
    {
      "code": 6045,
      "name": "CustomMathError20",
      "msg": "Custom Math Error 20!"
    },
    {
      "code": 6046,
      "name": "CustomMathError21",
      "msg": "Custom Math Error 21!"
    },
    {
      "code": 6047,
      "name": "CustomMathError22",
      "msg": "Custom Math Error 22!"
    },
    {
      "code": 6048,
      "name": "EmptyTotalTokenSupply",
      "msg": "Total Token Supply seems empty!"
    },
    {
      "code": 6049,
      "name": "EmptyTotalCurrencySupply",
      "msg": "Total Currency Supply seems empty!"
    }
  ]
};
