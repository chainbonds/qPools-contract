/**
 * File to calculate the exchange rate logic
 *
 * As well as other statistics, such as
 * - total qSOL minted,
 * - 7-day APY
 * - Total Value Locked (in SOL)
 */
import {getPythProgramKeyForCluster, PriceData, Product, PythConnection} from "@pythnetwork/client";
import {Connection, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";

export const calculateTotalQSolMinted = async () => {

}
/**
 *
 * @param connection
 * @param pair
 * @param priceSetter is a setter function which sets the variable to this price
 */
export const calculateTVL = async (
    connection: Connection,
    pair: String,
    currencyTokenMint: Token,
    currencyTokenAccount: PublicKey,
) => {

    // Iterate over all
    // (1) reserve accounts
    // (2) locked liquidity accounts
    // (2.1) over all exchanges
    // (3) all currencies
    // and convert each one into USDC

    let TVL = 0.;

    // For each token provided, calculate the

    // Get total amount of currency token in account
    let reserveSol = (await currencyTokenMint.getAccountInfo(currencyTokenAccount)).amount;

    console.log("Reserve SOL is: ", reserveSol);


    // const pythConnection = new PythConnection(connection, getPythProgramKeyForCluster("devnet"))
    // // Product: ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj
    // // Price: H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
    // pythConnection.onPriceChange((product: Product, price: PriceData) => {
    //     // sample output:
    //     // SRM/USD: $8.68725 ±$0.0131
    //     if (product.symbol == "SOL/USDC") {
    //         console.log(`${product.symbol}: $${price.price - price.confidence}`)
    //     }
    //     // Also just wait for a bit ...
    // })
    // // Start listening for price change events.
    // pythConnection.start().then(() => {
    //     pythConnection.stop().then(() => {
    //
    //     });
    // });

    return 0.
}