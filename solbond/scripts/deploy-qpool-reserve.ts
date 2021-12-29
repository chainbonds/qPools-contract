/**
 * 29. Dec. 2021
 * This script creates a qPool resere
 * and the corresponding associated token accounts
 *
 * It costs around
 */
import {Provider} from "@project-serum/anchor";
import {clusterApiUrl, Keypair, PublicKey} from "@solana/web3.js";
import {QPoolsAdmin} from "../../dapp-nextjs/src/qpools-sdk/qpools-admin";
import {Token} from "@solana/spl-token";
import {createMint, delay} from "../../dapp-nextjs/src/qpools-sdk/utils";

const main = async () => {

    let cluster: string = clusterApiUrl('devnet');
    console.log("Cluster is: ", cluster);
    const provider = Provider.local(cluster,
        {
            skipPreflight: true
        }
    );
    const connection = provider.connection;
    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair;

    //
    console.log("Initialize a qpool");
    const qPoolAdminTool = new QPoolsAdmin(
        wallet,
        connection,
        provider,
        null
    );

    // TODO: Before all else,
    // double check if an account exists already
    await qPoolAdminTool.loadExistingQPTReserve();
    qPoolAdminTool.prettyPrintAccounts();
    return;

    // TODO: Only execute the following code if the accounts do not exist yet

    let currencyMint: Token;
    if (
        cluster.toString().includes("dev") ||
        cluster.toString().includes("test") ||
        cluster.toString().includes("localhost") || cluster.toString().includes("127.0.0.1")
    ) {
        // TODO: Take some hardcoded mint
        // Airdrop some stuff to the wallet
        // console.log("Requesting airdrop...");
        // const tx = await connection.requestAirdrop(wallet.publicKey, 1e9);
        // await connection.confirmTransaction(tx);

        // Create a currency mint,
        // that is currently owned by us
        // if and only if devnet
        // console.log("Creating a currency mint...");
        // currencyMint = await createMint(
        //     provider,
        //     wallet,
        //     wallet.publicKey,
        //     9
        // );
        // await delay(1_000);
        // console.log("Currency mint is: ", currencyMint.publicKey.toString());
    } else {
        throw Error("mainnet definitely not implemented yet!!");
    }
    currencyMint = new Token(
        connection,
        new PublicKey("68wyW3CDdreuwxxE8VcbhdZSGodfrEHQqVWTzuzYp4ZK"),
        new PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"),
        wallet
    );

    console.log("Initializing the QPT Reserve");
    // await qPoolAdminTool.initializeQPTReserve();

    // console.log("Initialize a qpool");
    // const qPoolAdminTool = new QPoolsAdmin(
    //     wallet,
    //     connection,
    //     provider,
    //     currencyMint
    // );

    console.log("Account data is:");
    console.log()

    console.log("Done!");
}

main();
