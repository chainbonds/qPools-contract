import * as anchor from "@project-serum/anchor";
import {clusterApiUrl, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction} from "@solana/web3.js";
import {BN, Provider, workspace} from "@project-serum/anchor";
import {QPoolsStats} from "@qpools/sdk/lib/qpools-stats";
import {
    createAssociatedTokenAccountSendUnsigned,
    getAssociatedTokenAddressOffCurve,
    getSolbondProgram,
    MOCK
} from "@qpools/sdk";
import {Token} from "@solana/spl-token";
import {NETWORK} from "@qpools/sdk/lib/cluster";
import {delay} from "@qpools/sdk/lib/utils";
import {TvlInUsdc} from "@qpools/sdk/lib/types/tvlAccount";
import {SEED} from "@qpools/sdk/lib/seeds";
import {createAssociatedTokenAccountSend} from "easy-spl/dist/tx/associated-token-account";

/**
 * Calculate TVL and
 *
 */

const main = async () => {

    // I guess wrap this in a setInterval call?
    // Or do the setInterval through bash

    // Get all accounts before the interval, so we don't spam the RPC provide too much ...
    console.log("Triggering TVL Calculation and writing ...");
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
    // const walletSigner = provider.wallet;
    // // @ts-expect-error
    // const walletPayer = provider.wallet.payer as Signer;

    // Get the rpc calls
    console.log("GetSolbondProgram");
    let solbondProgram = await getSolbondProgram(
        connection, provider, NETWORK.DEVNET
    );

    // Create a new currency mint token
    console.log("Create Token");
    let currencyMint: Token = new Token(
        connection,
        MOCK.DEV.SABER_USDC,
        solbondProgram.programId,
        wallet
    );

    // Also make error check on pyth, s.t. we don't overwrite "undefined" if this should ever happen
    console.log("Create QPoolsStats");
    let qpoolsStats: QPoolsStats = new QPoolsStats(
        connection,
        currencyMint
    );

    // Get the qPoolAccount
    console.log("QPoolAccount");
    let [qPoolAccount, bumpQPoolAccount] = await PublicKey.findProgramAddress(
        [currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.BOND_POOL_ACCOUNT))],
        solbondProgram.programId
    );
    // Get the account addresses
    let [tvlAccount, tvlAccountBump] = await PublicKey.findProgramAddress(
        [qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.TVL_INFO_ACCOUNT))],
        solbondProgram.programId
    );

    await createAssociatedTokenAccountSendUnsigned(
        connection,
        MOCK.DEV.SABER_USDC,
        qPoolAccount,
        provider.wallet
    );
    const usdc_account = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, qPoolAccount);
    await createAssociatedTokenAccountSendUnsigned(
        connection,
        MOCK.DEV.SABER_USDT,
        qPoolAccount,
        provider.wallet
    );
    const usdt_account = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDT, qPoolAccount);
    await createAssociatedTokenAccountSendUnsigned(
        connection,
        MOCK.DEV.SABER_CASH,
        qPoolAccount,
        provider.wallet
    );
    const cash_account = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_CASH, qPoolAccount);
    await createAssociatedTokenAccountSendUnsigned(
        connection,
        MOCK.DEV.SABER_PAI,
        qPoolAccount,
        provider.wallet
    );
    const pai_account = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_PAI, qPoolAccount);
    await createAssociatedTokenAccountSendUnsigned(
        connection,
        MOCK.DEV.SABER_TESTUSD,
        qPoolAccount,
        provider.wallet
    );
    const testUsd_account = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_TESTUSD, qPoolAccount);

    /** Periodically calculate the TVL */
    setInterval(async () => {

        // TODO: The program address inside is not finishing when this is triggered!!
        // Maybe put this in a separately
        await qpoolsStats.collectPriceFeed();
        await delay(5000);
        // Damn, dafuq, this was it really! I guess this is also what caused issues on the frontend!

        console.log("Calculate TVL");
        let {tvl} = await qpoolsStats.calculateTVL();

        // Create associated token account for the respective
        console.log("RPC");
        console.log("Writing TVL: ", tvl.toString());
        let txs = new Transaction();
        const tx1 = solbondProgram.instruction.setTvl(
            new BN(tvl),
            tvlAccountBump,
            {
                accounts: {
                    tvlAccount: tvlAccount,
                    initializer: wallet.publicKey,
                    poolAccount: qPoolAccount,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId
                },
            }
        )
        txs.add(tx1);
        let sg = await connection.sendTransaction(txs, [wallet]);
        await connection.confirmTransaction(sg);
        console.log("Transaction is: ", sg);

        console.log("Tvl set!");
        console.log("TVL Account is:", tvlAccount.toString());

        let tvlInUsdc = (await solbondProgram.account.tvlInfoAccount.fetch(tvlAccount)) as TvlInUsdc;
        console.log("TVL in USDC is: ", tvlInUsdc.tvlInUsdc.toString());

    }, 10000);

}

main();