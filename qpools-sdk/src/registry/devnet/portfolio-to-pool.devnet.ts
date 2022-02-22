// Because this is devnet, the address might not correspond with the pairs one-to-one
// Only consider the portfolio addresses that are included here
// All the underlying text etc. should be taken from the registry
export const PORTFOLIOID_TO_TOKEN = {
    "pairs": [
        {
            "portfolioApiId": "UST-USDC",
            // This is the swapAccount in saber
            "poolAddress": "B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA",
        },
        {
            "portfolioApiId": "wUST_v1-USDC",
            "poolAddress": "AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x",
        },
        {
            "portfolioApiId": "USDCpo-USDC",
            "poolAddress": "DoycojcYVwc42yCpGb4CvkbuKJkQ6KBTugLdJXv3U8ZE",
        }
    ]
}
