/**
 * 29. Dec. 2021
 * This script creates a qPool resere
 * and the corresponding associated token accounts
 *
 * It costs around
 */
import {Provider} from "@project-serum/anchor";
import {clusterApiUrl, Keypair, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";
import {QPoolsAdmin} from "@qpools/admin-sdk";
import {MOCK} from "@qpools/sdk";

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

    // Define the currency mint
    console.log("Initialize a qpool");
    const qPoolAdminTool = new QPoolsAdmin(
        connection,
        provider,
        MOCK.DEV.SOL
    );

    // Check if an account exists already
    const existingQPT = await qPoolAdminTool.loadExistingQPTReserve();
    if (existingQPT) {
        qPoolAdminTool.prettyPrintAccounts();
        return
    } else {
        console.log("Creating new pool!");
    }

    if (
        cluster.toString().includes("dev") ||
        cluster.toString().includes("test") ||
        cluster.toString().includes("localhost") || cluster.toString().includes("127.0.0.1")
    ) {
        console.log("Cluster is: ", cluster);
        console.log("Initializing the QPT Reserve");
        await qPoolAdminTool.initializeQPTReserve();
    } else {
        throw Error("mainnet definitely not implemented yet!!");
    }

    qPoolAdminTool.prettyPrintAccounts();
    console.log("Done!");
}

main();
