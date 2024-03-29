export const DEV_POOLS_INFO_SABER = [
    {
        "id": "btc",
        "name": "renBTC-WBTC",
        "tokens": [
            {
                "name": "Test RenBTC",
                "address": "Ren3RLPCG6hpKay86d2fQccQLuGG331UNxwn2VTw3GJ",
                "decimals": 8,
                "chainId": 103,
                "symbol": "renBTC",
                "logoURI": "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/assets/0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D/logo.png",
                "tags": ["saber-mkt-btc"],
                "extensions": {
                    "currency": "BTC"
                }
            },
            {
                "name": "Saber Wrapped Test WBTC (8 decimals)",
                "address": "BtceyXMo5kwg8u6es4NoukBWQuMwtcBCZpFWUfZgVuZs",
                "decimals": 8,
                "symbol": "sWBTC-8",
                "chainId": 103,
                "logoURI": "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/bitcoin/info/logo.png",
                "tags": ["saber-mkt-btc", "saber-dec-wrapped"],
                "extensions": {
                    "currency": "BTC",
                    "website": "https://app.saber.so",
                    "assetContract": "Wbt2CgkkD3eVckD5XxWJmT8pTnFTyWrwvGM7bUMLvsM",
                    "underlyingTokens": ["Wbt2CgkkD3eVckD5XxWJmT8pTnFTyWrwvGM7bUMLvsM"]
                }
            }
        ],
        "currency": "BTC",
        "lpToken": {
            "symbol": "renBTC-WBTC",
            "name": "Saber renBTC-WBTC LP",
            "logoURI": "https://registry.saber.so/token-icons/slp.png",
            "decimals": 8,
            "address": "bLpASoWNdsz5DsjCaxpbM2FrkMowTJCydpwiDP4Vdzm",
            "chainId": 103,
            "tags": ["saber-stableswap-lp"],
            "extensions": {
                "website": "https://app.saber.so/#/pools/btc",
                "underlyingTokens": [
                    "Ren3RLPCG6hpKay86d2fQccQLuGG331UNxwn2VTw3GJ",
                    "BtceyXMo5kwg8u6es4NoukBWQuMwtcBCZpFWUfZgVuZs"
                ],
                "source": "saber"
            }
        },
        "plotKey": "8c6AgGFMUT6cuU23FJuyfBtug98axAwPNXaHp6pbrqG2",
        "swap": {
            "config": {
                "swapAccount": "AQsYrKkFLuv9Jw7kCcPH7SkeMQ2aZkP1KcBs4RYegHbv",
                "swapProgramID": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
                "tokenProgramID": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "authority": "ChFJZQK4gNpmcrbF71e5Wo2HzF8qePYGnqsgZ6u7anFA"
            },
            "state": {
                "isInitialized": true,
                "isPaused": false,
                "nonce": 255,
                "futureAdminDeadline": 0,
                "futureAdminAccount": "11111111111111111111111111111111",
                "adminAccount": "8U8GbmSKjygwdqmFH9rYaWxkD9G13T1RsCYfcxqkHaiy",
                "tokenA": {
                    "adminFeeAccount": "4bCW6q6LjWmt1YgCSdFXRq9hg5vqPeLDkf4fcDeBUMVy",
                    "reserve": "GT9JcsFPaeDJRCeysNHWT76nvN9EWDj7z7psaADSn8QS",
                    "mint": "Ren3RLPCG6hpKay86d2fQccQLuGG331UNxwn2VTw3GJ"
                },
                "tokenB": {
                    "adminFeeAccount": "F1yiwRWfjFNyVzYUEo4o9AbAF3JRUruZMSsckMMUK22c",
                    "reserve": "6jRUeyuRyaG1BfV5Y7fRCRhUk8P9CJwS1s5qybG6HPti",
                    "mint": "BtceyXMo5kwg8u6es4NoukBWQuMwtcBCZpFWUfZgVuZs"
                },
                "poolTokenMint": "bLpASoWNdsz5DsjCaxpbM2FrkMowTJCydpwiDP4Vdzm",
                "initialAmpFactor": "32",
                "targetAmpFactor": "32",
                "startRampTimestamp": 0,
                "stopRampTimestamp": 0,
                "fees": {
                    "adminTrade": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "adminWithdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "trade": {
                        "formatted": "0.0400000000",
                        "numerator": "4",
                        "denominator": "10000"
                    },
                    "withdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    }
                }
            }
        },
        "quarry": "CeE8rNxCFx2RAgpS7trsmcTz7ydyun33wbNY7r2nEvPi"
    },
    {
        "id": "usdc_cash",
        "name": "USDC-CASH",
        "tokens": [
            {
                "symbol": "USDC",
                "name": "USD Coin (Saber Devnet)",
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/103/2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8.png",
                "address": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd", "stablecoin"],
                "extensions": {
                    "currency": "USD",
                    "coingeckoId": "usd-coin",
                    "website": "https://saber.so/"
                }
            },
            {
                "address": "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT",
                "chainId": 103,
                "decimals": 6,
                "extensions": {
                    "coingeckoId": "usd-coin",
                    "currency": "USD",
                    "discord": "https://discord.com/invite/GmkRRKJkuh",
                    "medium": "https://medium.com/@cashioapp",
                    "source": "cashio",
                    "sourceUrl": "https://cashio.app/#/print",
                    "twitter": "https://twitter.com/CashioApp",
                    "website": "https://cashio.app"
                },
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/101/CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT.png",
                "name": "Cashio Dollar",
                "symbol": "CASH",
                "tags": ["stablecoin", "saber-mkt-usd"]
            }
        ],
        "currency": "USD",
        "lpToken": {
            "symbol": "USDC-CASH",
            "name": "Saber USDC-CASH LP",
            "logoURI": "https://registry.saber.so/token-icons/slp.png",
            "decimals": 6,
            "address": "DALfPHRc2eKmnsEDs8fkHKNA37FwVSD6AbrLZXn1oTtJ",
            "chainId": 103,
            "tags": ["saber-stableswap-lp"],
            "extensions": {
                "website": "https://app.saber.so/#/pools/usdc_cash",
                "underlyingTokens": [
                    "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                    "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT"
                ],
                "source": "saber"
            }
        },
        "plotKey": "AoijvP2yrE1H9C4K1Z6TrpkjsQjfPnBVn1yKeh5Y7uyJ",
        "swap": {
            "config": {
                "swapAccount": "B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA",
                "swapProgramID": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
                "tokenProgramID": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "authority": "BgktRz16U7M7gnT2mzeL1idLyndxKFHeWRdKXUD9VGRz"
            },
            "state": {
                "isInitialized": true,
                "isPaused": false,
                "nonce": 255,
                "futureAdminDeadline": 0,
                "futureAdminAccount": "11111111111111111111111111111111",
                "adminAccount": "AgsR6hUZitMsT7EXkJ5ahxSSui3dAtQReKsyxs2nUwNH",
                "tokenA": {
                    "adminFeeAccount": "Am4RG99CzFaPqFUizYq66K2BxcBp3FcdxoBxM3P1FZ6w",
                    "reserve": "DjX8KKu5bHz3zz7oJDhZbSDoksGbDr6EZFaooYFrPK4u",
                    "mint": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8"
                },
                "tokenB": {
                    "adminFeeAccount": "VfZCJhqCtxW6WbZCTHgotRwmDbnrXibQ1XgLgWTbAAg",
                    "reserve": "654z3VDWzK7BuehVQSmyftqm6TxHnJDDJF8eHdCXUEcs",
                    "mint": "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT"
                },
                "poolTokenMint": "DALfPHRc2eKmnsEDs8fkHKNA37FwVSD6AbrLZXn1oTtJ",
                "initialAmpFactor": "07d0",
                "targetAmpFactor": "07d0",
                "startRampTimestamp": 0,
                "stopRampTimestamp": 0,
                "fees": {
                    "adminTrade": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "adminWithdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "trade": {
                        "formatted": "0.0400000000",
                        "numerator": "4",
                        "denominator": "10000"
                    },
                    "withdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    }
                }
            }
        },
        "quarry": "2xs4gZpawFvgUojWrqWPyFERRtu7F569VvRLeFS29jpm"
    },
    {
        "id": "usdc_pai",
        "name": "USDC-PAI",
        "tokens": [
            {
                "symbol": "USDC",
                "name": "USD Coin (Saber Devnet)",
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/103/2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8.png",
                "address": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd", "stablecoin"],
                "extensions": {
                    "currency": "USD",
                    "coingeckoId": "usd-coin",
                    "website": "https://saber.so/"
                }
            },
            {
                "symbol": "PAI",
                "name": "PAI",
                "logoURI": "https://registry.saber.so/token-icons/pai.svg",
                "address": "4ry1pMstKzMJvMZSms62HduTyCbbqkUyrz17x1dajBmL",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd"],
                "extensions": {
                    "currency": "USD"
                }
            }
        ],
        "currency": "USD",
        "lpToken": {
            "symbol": "USDC-PAI",
            "name": "Saber USDC-PAI LP",
            "logoURI": "https://registry.saber.so/token-icons/slp.png",
            "decimals": 6,
            "address": "J8fDLz5bfef14jDNC32nJLbVzpS9Rj1LBHwaSGfYn83J",
            "chainId": 103,
            "tags": ["saber-stableswap-lp"],
            "extensions": {
                "website": "https://app.saber.so/#/pools/usdc_pai",
                "underlyingTokens": [
                    "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                    "4ry1pMstKzMJvMZSms62HduTyCbbqkUyrz17x1dajBmL"
                ],
                "source": "saber"
            }
        },
        "plotKey": "ByDbnkzqj3QmaTmjAfgDgK4YofpQZ7cNSgkLUm8i26TS",
        "swap": {
            "config": {
                "swapAccount": "DoycojcYVwc42yCpGb4CvkbuKJkQ6KBTugLdJXv3U8ZE",
                "swapProgramID": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
                "tokenProgramID": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "authority": "8BC6eAF59beKMctxpH7jkx8faR6jdyKc5doHB7Tiffig"
            },
            "state": {
                "isInitialized": true,
                "isPaused": false,
                "nonce": 255,
                "futureAdminDeadline": 0,
                "futureAdminAccount": "11111111111111111111111111111111",
                "adminAccount": "HRSUYmvwyhy8SEYvvBvwpjpTdmRiYGAEqGDbWUKT2QY",
                "tokenA": {
                    "adminFeeAccount": "DW7sA9UxkB8GrnJAXzH28wS4G6jR34SJb38tFapsUjJD",
                    "reserve": "3hqDsGEp4Zp8PhXhx37ub94bHYfkjjHvZG5YJKyJ17no",
                    "mint": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8"
                },
                "tokenB": {
                    "adminFeeAccount": "defQcSvSKgXFMEBnE1WuGfnfbLFmBp29agdYr3s3Bvp",
                    "reserve": "FLX3nBuu77Ld4KG9nTLgNnaqfT8BFnTRGtkwaBYWSXLQ",
                    "mint": "4ry1pMstKzMJvMZSms62HduTyCbbqkUyrz17x1dajBmL"
                },
                "poolTokenMint": "J8fDLz5bfef14jDNC32nJLbVzpS9Rj1LBHwaSGfYn83J",
                "initialAmpFactor": "64",
                "targetAmpFactor": "64",
                "startRampTimestamp": 0,
                "stopRampTimestamp": 0,
                "fees": {
                    "adminTrade": {
                        "formatted": "50.0000000000",
                        "numerator": "50",
                        "denominator": "100"
                    },
                    "adminWithdraw": {
                        "formatted": "50.0000000000",
                        "numerator": "50",
                        "denominator": "100"
                    },
                    "trade": {
                        "formatted": "0.2000000000",
                        "numerator": "20",
                        "denominator": "10000"
                    },
                    "withdraw": {
                        "formatted": "0.5000000000",
                        "numerator": "50",
                        "denominator": "10000"
                    }
                }
            }
        },
        "quarry": "Cae9hW42nD1G89LCheaSczN6CzngYYWQ6KbZMQXhMwyq"
    },
    {
        "id": "usdc_test",
        "name": "TEST-USDC",
        "tokens": [
            {
                "symbol": "TEST",
                "name": "Test USD",
                "logoURI": "https://registry.saber.so/token-icons/candy-usd.png",
                "address": "4QgnWUPQmfGB5dTDCcc4ZFeZDK7xNVhCUFoNmmYFwAme",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd"],
                "extensions": {
                    "currency": "USD"
                }
            },
            {
                "symbol": "USDC",
                "name": "USD Coin (Saber Devnet)",
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/103/2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8.png",
                "address": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd", "stablecoin"],
                "extensions": {
                    "currency": "USD",
                    "coingeckoId": "usd-coin",
                    "website": "https://saber.so/"
                }
            }
        ],
        "currency": "USD",
        "lpToken": {
            "symbol": "TEST-USDC",
            "name": "Saber TEST-USDC LP",
            "logoURI": "https://registry.saber.so/token-icons/slp.png",
            "decimals": 6,
            "address": "E2XcZ3WR9Qt19JLNjCEWkbtfJiYhWbpTbw3wZbmj2AQo",
            "chainId": 103,
            "tags": ["saber-stableswap-lp"],
            "extensions": {
                "website": "https://app.saber.so/#/pools/usdc_test",
                "underlyingTokens": [
                    "4QgnWUPQmfGB5dTDCcc4ZFeZDK7xNVhCUFoNmmYFwAme",
                    "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8"
                ],
                "source": "saber"
            }
        },
        "plotKey": "CoYqTqHeZsuQqiXRdvx7TiSp7VVy8dNgWf8JM83h8bw",
        "swap": {
            "config": {
                "swapAccount": "AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x",
                "swapProgramID": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
                "tokenProgramID": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "authority": "CzyZPuuszgHNyxcPxWKw6r1nrVKB7LdkGZMyQx6Tohpa"
            },
            "state": {
                "isInitialized": true,
                "isPaused": false,
                "nonce": 254,
                "futureAdminDeadline": 0,
                "futureAdminAccount": "11111111111111111111111111111111",
                "adminAccount": "EfYCi3Uv4zg4PZqrnzXpWDbow3UuBKTudb4PdB5g9n1R",
                "tokenA": {
                    "adminFeeAccount": "EDdsbAnrpnHWbHPHZmXhuZPScXyueCnW6dw6V7dk8vjN",
                    "reserve": "5t9v3eYu4qY7g9AMZ7DbxZ5feb5HcHSyKcgG9DhcJam4",
                    "mint": "4QgnWUPQmfGB5dTDCcc4ZFeZDK7xNVhCUFoNmmYFwAme"
                },
                "tokenB": {
                    "adminFeeAccount": "FbZsySqXDztj5cqU5DuJoa8yyXHsjWBkzTNeuHMMrY7t",
                    "reserve": "Cbbs13w3R9BQhtd4BLfsAUsh1VtjM2La8chxxv5fn9by",
                    "mint": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8"
                },
                "poolTokenMint": "E2XcZ3WR9Qt19JLNjCEWkbtfJiYhWbpTbw3wZbmj2AQo",
                "initialAmpFactor": "64",
                "targetAmpFactor": "64",
                "startRampTimestamp": 0,
                "stopRampTimestamp": 0,
                "fees": {
                    "adminTrade": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "adminWithdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "trade": {
                        "formatted": "0.0400000000",
                        "numerator": "4",
                        "denominator": "10000"
                    },
                    "withdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    }
                }
            }
        },
        "quarry": "5cX41FTaqRwdMBh1eenEKsQ1J1GwxA7sirnKsmP4i5mz"
    },
    {
        "id": "usdc_usdt",
        "name": "USDC-USDT",
        "tokens": [
            {
                "symbol": "USDC",
                "name": "USD Coin (Saber Devnet)",
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/103/2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8.png",
                "address": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd", "stablecoin"],
                "extensions": {
                    "currency": "USD",
                    "coingeckoId": "usd-coin",
                    "website": "https://saber.so/"
                }
            },
            {
                "symbol": "USDT",
                "name": "USDT (Saber Devnet)",
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/103/EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS.svg",
                "address": "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd", "stablecoin"],
                "extensions": {
                    "currency": "USD",
                    "coingeckoId": "tether",
                    "website": "https://saber.so/"
                }
            }
        ],
        "currency": "USD",
        "lpToken": {
            "symbol": "USDC-USDT",
            "name": "Saber USDC-USDT LP",
            "logoURI": "https://registry.saber.so/token-icons/slp.png",
            "decimals": 6,
            "address": "YakofBo4X3zMxa823THQJwZ8QeoU8pxPdFdxJs7JW57",
            "chainId": 103,
            "tags": ["saber-stableswap-lp"],
            "extensions": {
                "website": "https://app.saber.so/#/pools/usdc_usdt",
                "underlyingTokens": [
                    "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
                    "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS"
                ],
                "source": "saber"
            }
        },
        "plotKey": "99CaY6yjPLJzAJU3y2qhuLMFcfoCof4tnbR21FrtiGJd",
        "swap": {
            "config": {
                "swapAccount": "VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL",
                "swapProgramID": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
                "tokenProgramID": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "authority": "72E8LfHqoxQCxnxmBbDG6WSHnDx1rWPUHNKwYvoL5qDm"
            },
            "state": {
                "isInitialized": true,
                "isPaused": false,
                "nonce": 254,
                "futureAdminDeadline": 0,
                "futureAdminAccount": "11111111111111111111111111111111",
                "adminAccount": "GSmjrpT8zNtp6Ke8y2xS5P1kREEjqZCjwxF8VbxDJAV8",
                "tokenA": {
                    "adminFeeAccount": "6RPzht581g8QLdKaT8CSuCnj9yBhR2u6mxKFFK6Dbhgx",
                    "reserve": "6aFutFMWR7PbWdBQhdfrcKrAor9WYa2twtSinTMb9tXv",
                    "mint": "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8"
                },
                "tokenB": {
                    "adminFeeAccount": "5Z4M2yHn6LUWaK9Ka8QqByM1NimGGRMdEk7roHoQbDb9",
                    "reserve": "HXbhpnLTxSDDkTg6deDpsXzJRBf8j7T6Dc3GidwrLWeo",
                    "mint": "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS"
                },
                "poolTokenMint": "YakofBo4X3zMxa823THQJwZ8QeoU8pxPdFdxJs7JW57",
                "initialAmpFactor": "64",
                "targetAmpFactor": "64",
                "startRampTimestamp": 0,
                "stopRampTimestamp": 0,
                "fees": {
                    "adminTrade": {
                        "formatted": "50.0000000000",
                        "numerator": "50",
                        "denominator": "100"
                    },
                    "adminWithdraw": {
                        "formatted": "50.0000000000",
                        "numerator": "50",
                        "denominator": "100"
                    },
                    "trade": {
                        "formatted": "0.2000000000",
                        "numerator": "20",
                        "denominator": "10000"
                    },
                    "withdraw": {
                        "formatted": "0.5000000000",
                        "numerator": "50",
                        "denominator": "10000"
                    }
                }
            }
        },
        "quarry": "8QfbpS8fBNcqee9qHjYG5pgBWTKyM193E7zjwzxeUZ3X"
    },
    {
        "id": "usdt_cash",
        "name": "USDT-CASH",
        "tokens": [
            {
                "symbol": "USDT",
                "name": "USDT (Saber Devnet)",
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/103/EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS.svg",
                "address": "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
                "decimals": 6,
                "chainId": 103,
                "tags": ["saber-mkt-usd", "stablecoin"],
                "extensions": {
                    "currency": "USD",
                    "coingeckoId": "tether",
                    "website": "https://saber.so/"
                }
            },
            {
                "address": "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT",
                "chainId": 103,
                "decimals": 6,
                "extensions": {
                    "coingeckoId": "usd-coin",
                    "currency": "USD",
                    "discord": "https://discord.com/invite/GmkRRKJkuh",
                    "medium": "https://medium.com/@cashioapp",
                    "source": "cashio",
                    "sourceUrl": "https://cashio.app/#/print",
                    "twitter": "https://twitter.com/CashioApp",
                    "website": "https://cashio.app"
                },
                "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/101/CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT.png",
                "name": "Cashio Dollar",
                "symbol": "CASH",
                "tags": ["stablecoin", "saber-mkt-usd"]
            }
        ],
        "currency": "USD",
        "lpToken": {
            "symbol": "USDT-CASH",
            "name": "Saber USDT-CASH LP",
            "logoURI": "https://registry.saber.so/token-icons/slp.png",
            "decimals": 6,
            "address": "JEETZ6QBjvtu8UYYwGWrfLiLj6hjaW4YyErxZ1NC3Fk4",
            "chainId": 103,
            "tags": ["saber-stableswap-lp"],
            "extensions": {
                "website": "https://app.saber.so/#/pools/usdt_cash",
                "underlyingTokens": [
                    "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
                    "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT"
                ],
                "source": "saber"
            }
        },
        "plotKey": "Awc4HaWid9Ev8iqWMPkDwaaB5jYxQSKRHuyi2YiGscmQ",
        "swap": {
            "config": {
                "swapAccount": "TEJVTFTsqFEuoNNGu864ED4MJuZr8weByrsYYpZGCfQ",
                "swapProgramID": "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
                "tokenProgramID": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "authority": "52ZVLaKbh1jumxHWxiNpv4igyUvfMz8TbP7Vogcw2VDE"
            },
            "state": {
                "isInitialized": true,
                "isPaused": false,
                "nonce": 255,
                "futureAdminDeadline": 0,
                "futureAdminAccount": "11111111111111111111111111111111",
                "adminAccount": "2Wdnp1YTGwfiDLLgZ7wJFs6ySThFbMqRJzsbZCw2XcMR",
                "tokenA": {
                    "adminFeeAccount": "HS4ht1Fu5kuwL9nQuN9nkg83Yia3STjfYLyor33oYhjV",
                    "reserve": "F9tk55FWRKMQFJqh9nX3ro9ePsZK6AFiNCnah3q42UQB",
                    "mint": "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS"
                },
                "tokenB": {
                    "adminFeeAccount": "GSWNHcmVJV6as7GdpsAPT7YoRHNMBEvuTGNDbjiVAgxq",
                    "reserve": "5gmJrKK9BvEs1FtkrZBwwyok1a3cU6TLcFTwrJ7Lg7PU",
                    "mint": "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT"
                },
                "poolTokenMint": "JEETZ6QBjvtu8UYYwGWrfLiLj6hjaW4YyErxZ1NC3Fk4",
                "initialAmpFactor": "07d0",
                "targetAmpFactor": "07d0",
                "startRampTimestamp": 0,
                "stopRampTimestamp": 0,
                "fees": {
                    "adminTrade": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "adminWithdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    },
                    "trade": {
                        "formatted": "0.0400000000",
                        "numerator": "4",
                        "denominator": "10000"
                    },
                    "withdraw": {
                        "formatted": "0.0000000000",
                        "numerator": "0",
                        "denominator": "10000"
                    }
                }
            }
        },
        "quarry": "HTRAA85HHxsRmozFiZYv2AwQWjqHo1XnPWsc76zPbiFE"
    }
]
