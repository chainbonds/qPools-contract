// Because this is devnet, the address might not correspond with the pairs one-to-one
// Only consider the portfolio addresses that are included here
// All the underlying text etc. should be taken from the registry
// export const DEV_PORTFOLIOID_TO_TOKEN = {
//     "pairs": [
//         {
//             "portfolioApiId": "UST-USDC",
//             // This is the swapAccount in saber
//             "poolAddress": "B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA",
//         },
//         {
//             "portfolioApiId": "wUST_v1-USDC",
//             "poolAddress": "AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x",
//         },
//         {
//             "portfolioApiId": "USDCpo-USDC",
//             "poolAddress": "DoycojcYVwc42yCpGb4CvkbuKJkQ6KBTugLdJXv3U8ZE",
//         }
//     ]
// }

export const DEV_PORTFOLIOID_TO_TOKEN = {
    "pairs": [
        {
            "portfolioApiId": "renBTC-WBTC",
            "poolAddress": "AQsYrKkFLuv9Jw7kCcPH7SkeMQ2aZkP1KcBs4RYegHbv"
        },
        {
            "portfolioApiId": "USDC-CASH",
            "poolAddress": "B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA"
        },
        {
            "portfolioApiId": "USDC-PAI",
            "poolAddress": "DoycojcYVwc42yCpGb4CvkbuKJkQ6KBTugLdJXv3U8ZE"
        },
        {
            "portfolioApiId": "TEST-USDC",
            "poolAddress": "AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x"
        },
        {
            "portfolioApiId": "USDC-USDT",
            "poolAddress": "VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL"
        },
        {
            "portfolioApiId": "USDT-CASH",
            "poolAddress": "TEJVTFTsqFEuoNNGu864ED4MJuZr8weByrsYYpZGCfQ"
        }
    ]
}