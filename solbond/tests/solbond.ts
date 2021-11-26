import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, getBlockchainEpoch, getPayer} from "./utils";
import {Keypair, PublicKey} from "@solana/web3.js";
import {expect} from "chai";
import {endianness} from "os";
import {Mint} from "../../dapp/src/splpasta";

const BOND_LOCKUP_DURACTION_IN_SECONDS = 3;
const INITIALIZER_AMOUNT = 5 * web3.LAMPORTS_PER_SOL;
const REDEEM_AMOUNT = 2 * web3.LAMPORTS_PER_SOL;
const RENT = new BN("2784000");

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

describe('solbond', () => {

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solbond as Program<Solbond>;
    const payer = getPayer();

    it('Initialize the state-of-the-world', async () => {
        // Let's see if we even need to add anything into this.
        // Otherwise good to keep this as a sanity-check
    });

    let bondPoolRedeemableMint: Token | null = null;
    let bondPoolRedeemableTokenAccount: PublicKey | null = null;
    let bondPoolAccount: PublicKey | null = null;
    let bumpBondPoolAccount: number | null = null;
    let bondPoolSolanaAccount: PublicKey | null = null;
    let bumpBondPoolSolanaAccount: number | null = null;

    it('run function: initializeBondPool', async () => {
        console.log("Running initializeBondPool");

        // Generate a PDA
        [bondPoolAccount, bumpBondPoolAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            program.programId
        );
        [bondPoolSolanaAccount, bumpBondPoolSolanaAccount] = await PublicKey.findProgramAddress(
            [bondPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolSolanaAccount"))],
            program.programId
        );

        console.log("The two PDAs are: ");
        console.log(bondPoolAccount.toString());
        console.log(bondPoolSolanaAccount.toString());

        // Create a Mint that is owned by the bondPoolAccount
        bondPoolRedeemableMint = await createMint(provider, payer, bondPoolAccount, 9);

        // Create the corresponding accounts
        // TODO Should this be owned by `bondPoolAccount` or `bondPoolSolanaAccount`
        bondPoolRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(bondPoolAccount);

        /**
         * Run the RPC Call here
         */
        const initializeTx = await program.rpc.initializeBondPool(
            bumpBondPoolAccount,
            bumpBondPoolSolanaAccount,
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolSolanaAccount: bondPoolSolanaAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,

                    initializer: payer.publicKey,

                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [payer]
            }
        );
        await provider.connection.confirmTransaction(initializeTx);
        console.log("initializeTx signature", initializeTx);

    });

    let bondInstanceAccount: PublicKey | null = null;
    let bumpBondInstanceAccount: number | null = null;
    let purchaserRedeemableTokenAccount: PublicKey | null = null;

    let amount: number = 1_000_000_000;
    let startTime: BN = new BN(0);
    let endTime: BN = new BN(0);
    let purchaser: PublicKey | null = null;

    it('run function: purchaseBondInstance', async () => {

        // TODO: We should probably assume two different users for purchaser, and user (and also go with the case, that it is the same person ...)

        console.log("Purchasing a bond...");

        // Generate a random, new PDA
        console.log("Needs to be a different PDA!");
        // TODO: Generate a PDA, with a different seed!
        [bondInstanceAccount, bumpBondInstanceAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondInstanceAccount"))],
            program.programId
        );
        console.log("Third PDA is: ", bondInstanceAccount.toString());

        purchaser = payer.publicKey;
        purchaserRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(purchaser);

        console.log({
            bondPoolAccount: bondPoolAccount.toString(),
            purchaser: payer.publicKey.toString(),
            purchaserTokenAccount: purchaserRedeemableTokenAccount.toString(),
            bondInstanceAccount: bondInstanceAccount.toString(),
        })

        console.log("Bumps are: ");
        console.log(new BN(bumpBondPoolSolanaAccount).toString());
        console.log(new BN(bumpBondInstanceAccount).toString());

        const initializeTx = await program.rpc.purchaseBondInstance(
            new BN(amount),
            new BN(startTime),
            new BN(endTime),
            new BN(bumpBondPoolSolanaAccount),
            new BN(bumpBondInstanceAccount),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    purchaser: purchaser,
                    purchaserTokenAccount: purchaserRedeemableTokenAccount,
                    bondInstanceAccount: bondInstanceAccount,

                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [payer]
            }
        );
        await provider.connection.confirmTransaction(initializeTx);
        console.log("initializeTx signature", initializeTx);

    });

});
