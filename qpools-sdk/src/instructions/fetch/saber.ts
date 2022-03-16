import {StableSwapState} from "@saberhq/stableswap-sdk";
import {Connection, PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";

/**
 * Get the supply of all the LP tokens, as well as the USDC value of the reserve tokens
 * We don't return a float, so we can do safe arithmetic later
 *
 * @param state The saber StableSwapState based on the liquidity pool that we are currently looking into
 */
export async function getLpTokenExchangeRateItems(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    state: StableSwapState
) {

    console.log("Token account address is: ", state.tokenA.reserve);
    let amountReserveA = (await connection.getTokenAccountBalance(state.tokenA.reserve)).value.uiAmount;
    console.log("Token account address is: ", state.tokenA.reserve);
    let amountReserveB = (await connection.getTokenAccountBalance(state.tokenB.reserve)).value.uiAmount;
    if (!amountReserveA || !amountReserveB) {
        throw Error("One of the reserve values is null!" + String(amountReserveA) + " " +  String(amountReserveB));
    }
    // We skip these right now, because we are based on USDC
    // Convert Reserve A to it's USD value using Pyth oracle
    // Convert Reserve B to it's USD value using Pyth oracle
    // Convert to the USD currency (We can skip this step because we focus on USD stablecoins for now..)

    console.log("Amount A and Amount B are: ", amountReserveA.toString(), amountReserveB.toString());
    // Add these up, to get an idea of how much total value is in the pool
    let poolContentsInUsdc = amountReserveA + amountReserveB;
    let supplyLpToken = (await connection.getTokenSupply(state.poolTokenMint)).value.uiAmount;
    console.log("Supply of all LP tokens is: ", supplyLpToken.toString());

    return {
        supplyLpToken: supplyLpToken,
        poolContentsInUsdc: poolContentsInUsdc
    };
}