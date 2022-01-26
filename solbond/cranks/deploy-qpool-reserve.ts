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
import {createAssociatedTokenAccountSendUnsigned, getAssociatedTokenAddressOffCurve, MOCK} from "@qpools/sdk";
import {delay} from "@qpools/sdk/lib/utils";

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
        MOCK.DEV.SABER_USDC
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
        // Create an associated token account for the currency ...
        await delay(10000);
        console.log("Creating associated toke accounts ...");
        // Create all associated token accounts ...
        await createAssociatedTokenAccountSendUnsigned(
            connection,
            MOCK.DEV.SABER_USDC,
            qPoolAdminTool.qPoolAccount,
            provider.wallet
        );
        await createAssociatedTokenAccountSendUnsigned(
            connection,
            MOCK.DEV.SABER_USDT,
            qPoolAdminTool.qPoolAccount,
            provider.wallet
        );
        await createAssociatedTokenAccountSendUnsigned(
            connection,
            MOCK.DEV.SABER_CASH,
            qPoolAdminTool.qPoolAccount,
            provider.wallet
        );
        await createAssociatedTokenAccountSendUnsigned(
            connection,
            MOCK.DEV.SABER_PAI,
            qPoolAdminTool.qPoolAccount,
            provider.wallet
        );
        await createAssociatedTokenAccountSendUnsigned(
            connection,
            MOCK.DEV.SABER_TESTUSD,
            qPoolAdminTool.qPoolAccount,
            provider.wallet
        );

    } else {
        throw Error("mainnet definitely not implemented yet!!");
    }

    qPoolAdminTool.prettyPrintAccounts();
    console.log("Done!");
}

main();
