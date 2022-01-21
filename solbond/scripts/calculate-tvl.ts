import {clusterApiUrl, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";
import {Provider, workspace} from "@project-serum/anchor";
import {QPoolsStats} from "@qpools/sdk/lib/qpools-stats";
import {getSolbondProgram, MOCK} from "@qpools/sdk";
import {Token} from "@solana/spl-token";
import {NETWORK} from "@qpools/sdk/lib/cluster";

/**
 * Calculate TVL and
 *
 */

const main = async () => {

    // I guess wrap this in a setInterval call?
    // Or do the setInterval through bash

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

    // Create a new currency mint token
    let currencyMint: Token = new Token(
        connection,
        MOCK.DEV.SOL,
        workspace.solbondProgram.programId,
        wallet
    );

    // Calculate TVL
    let qpoolsStats: QPoolsStats = new QPoolsStats(
        connection,
        currencyMint
    );

    let {tvl} = await qpoolsStats.calculateTVL();

    // Get the rpc calls
    let solbondProgram = await getSolbondProgram(
        connection, provider, NETWORK.DEVNET
    );

    // Run the RPC call

    // Get the qPoolAccount
    let [qPoolAccount, bumpQPoolAccount] = await PublicKey.findProgramAddress(
        [currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))],
        solbondProgram.programId
    );

    // Get the account addresses
    let [tvlAccount, tvlAccountBump] = await PublicKey.findProgramAddress(
        [qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("tvlInfoAccount1"))],
        solbondProgram.programId
    );

    solbondProgram.rpc.setTvl(
        tvl,
        tvlAccountBump, {
            accounts: {
                tvlAccount: tvlAccount,
                initializer: wallet.publicKey,
                poolAccount: qPoolAccount,
                rent: anchor.web3.rent,
                clock: anchor.web3.clock,
                systemProgram: SystemProgram
            },
            signers: [wallet]
        }
    )

}