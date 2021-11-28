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

    // Do some airdrop before we start the tests ...
    it('Initialize the state-of-the-world', async () => {
        // Let's see if we even need to add anything into this.
        // Otherwise good to keep this as a sanity-check
        await provider.connection.requestAirdrop(payer.publicKey, 10_000_000_000);
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
    let bondInstanceRedeemableTokenAccount: PublicKey | null = null;
    let bondInstanceSolanaAccount: PublicKey | null = null;
    let bumpBondInstanceSolanaAccount: number | null = null;

    let amount: number = 2_000_000_000;

    // Get current UTC, or so
    let bondTimeInSeconds = 10;
    let elapseTimeBeforeBondBuyCloses = 10;
    let startTime = Date.now() + elapseTimeBeforeBondBuyCloses;
    let endTime = Date.now() + elapseTimeBeforeBondBuyCloses + bondTimeInSeconds;
    // let startTime: BN = new BN(startTimeJS);
    // let endTime: BN = new BN(endTimeJS);
    let purchaser: PublicKey | null = null;

    it('run function: initializeBondInstance', async () => {

        // TODO: We should probably assume two different users for purchaser, and user (and also go with the case, that it is the same person ...)
        console.log("Purchasing a bond...");
        console.log("Bond starts on: ", startTime);
        console.log("And ends on: ", endTime);
        // console.log("Bond starts on: ", new Date(startTime.toNumber()).getUTCDate());
        // console.log("And ends on: ", new Date(endTime.toNumber()).getUTCDate());

        // Generate a random, new PDA
        [bondInstanceAccount, bumpBondInstanceAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondInstanceAccount"))],
            program.programId
        );
        console.log("Third PDA is: ", bondInstanceAccount.toString());

        // Create a token account for the bond instance
        bondInstanceRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(bondInstanceAccount);

        // Create a PDA which stores all the (excess) solana for this account
        [bondInstanceSolanaAccount, bumpBondInstanceSolanaAccount] = await PublicKey.findProgramAddress(
            [bondInstanceAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondInstanceSolanaAccount"))],
            program.programId
        );

        purchaser = payer.publicKey;
        purchaserRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(purchaser);

        console.log({
            bondPoolAccount: bondPoolAccount.toString(),

            // Purchaser
            purchaser: purchaser.toString(),
            purchaserTokenAccount: purchaserRedeemableTokenAccount.toString(),

            // Bond Instance
            bondInstanceAccount: bondInstanceAccount.toString(),
            bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount.toString(),
            bondInstanceSolanaAccount: bondInstanceSolanaAccount.toString(),
        })

        console.log("Bumps are: ");
        console.log(new BN(bumpBondPoolSolanaAccount).toString());
        console.log(new BN(bumpBondInstanceAccount).toString());
        console.log(new BN(bumpBondInstanceSolanaAccount).toString());

        const initializeTx = await program.rpc.initializeBondInstance(
            new BN(startTime),
            new BN(endTime),
            new BN(bumpBondInstanceAccount),
            new BN(bumpBondInstanceSolanaAccount),
            {
                accounts: {
                    // Pool
                    bondPoolAccount: bondPoolAccount,

                    // Purchaser
                    purchaser: purchaser,
                    purchaserTokenAccount: purchaserRedeemableTokenAccount,

                    // Bond Instance
                    bondInstanceAccount: bondInstanceAccount,
                    bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,
                    bondInstanceSolanaAccount: bondInstanceSolanaAccount,

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

    it('run function: purchaseBond', async () => {
        console.log("Puraching bond...");

        // Solana Account Before
        const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));

        // Mint Before
        const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);

        console.log("Running accounts...");
        console.log({
            bondPoolAccount: bondPoolAccount.toString(),
            bondPoolSolanaAccount: bondPoolSolanaAccount.toString(),
            bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey.toString(),

            purchaser: purchaser.toString(),
            bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount.toString(),
        });

        const initializeTx = await program.rpc.purchaseBondInstance(
            new BN(amount),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolSolanaAccount: bondPoolSolanaAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,

                    purchaser: purchaser,
                    bondInstanceAccount: bondInstanceAccount,
                    bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,

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

        const finalPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const finalBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));
        const finalBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);

        console.log("Initial and final are: ");
        console.log("Total bond redeemable Mint supply is: ", bondPoolRedeemableMint);
        console.log("Initial Payer SOL", initialPayerSol.toString());
        console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
        console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());

        console.log("Final Payer SOL", finalPayerSol.toString());
        console.log("Final Bond SOL (reserve)", finalBondSol.toString());
        console.log("Final Bond Redeemable", finalBondRedeemableTok.toString());

    });

    it('run function: redeemBondInstance', async () => {
        console.log("Redeeming bond...");

        // Solana Account Before
        const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));
        const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);

        console.log("Initial and final are: ");
        console.log("Initial Payer SOL", initialPayerSol.toString());
        console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
        console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());

        console.log("Running accounts...");
        console.log({
            bondPoolAccount: bondPoolAccount.toString(),
            bondPoolSolanaAccount: bondPoolSolanaAccount.toString(),
            bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey.toString(),

            purchaser: purchaser.toString(),
            bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount.toString(),
        });

        console.log("Taking out all the redeemables that were paid in so far...", initialBondRedeemableTok.toString());

        console.log("Asking for this much SOL");
        const initializeTx = await program.rpc.redeemBondInstance(
            // Need to assign less than there is ...
            initialBondRedeemableTok.div(new BN(2)),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolSolanaAccount: bondPoolSolanaAccount,
                    bondInstanceAccount: bondInstanceAccount,
                    bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,
                    purchaser: payer.publicKey,
                    purchaserTokenAccount: purchaserRedeemableTokenAccount,

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

        const finalPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const finalBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));

        const finalBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);

        console.log("Initial and final are: ");
        console.log("Initial Payer SOL", initialPayerSol.toString());
        console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
        console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());

        console.log("Final Payer SOL", finalPayerSol.toString());
        console.log("Final Bond SOL (reserve)", finalBondSol.toString());
        console.log("Final Bond Redeemable", finalBondRedeemableTok.toString());

    });

});
