import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint,createMint2, getPayer, createTokenAccount} from "./utils";
import {PublicKey} from "@solana/web3.js";
const {
    ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const SOLANA_START_AMOUNT = 10_000_000_000;
// const TOKEN_START_AMOUNT = 10_000_000_000;

describe('solbond', () => {

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solbond as Program<Solbond>;
    const payer = getPayer();

    let bondPoolRedeemableMint: Token | null = null;
    let bondPoolTokenMint: Token | null = null;
    let bondPoolRedeemableTokenAccount: PublicKey | null = null;
    //let bondPoolTokenAccount: PublicKey | null = null;
    let bondPoolAccount: PublicKey | null = null;
    let bumpBondPoolAccount: number | null = null;
    let bondPoolTokenAccount: PublicKey | null = null;

    // Do some airdrop before we start the tests ...
    it('Initialize the state-of-the-world', async () => {
        console.log("Running Initialize Token mints etc.");

        // Airdrop some solana for computation purposes
        await provider.connection.requestAirdrop(payer.publicKey, SOLANA_START_AMOUNT);

        // Create the bondPoolAccount as a PDA
        [bondPoolAccount, bumpBondPoolAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            program.programId
        );
        // Token account has to be another PDA, I guess

        // Create the Mints that we will be using
        bondPoolTokenMint = await createMint(provider, payer);
        bondPoolRedeemableMint = await createMint(provider, payer, bondPoolAccount, 9);

        bondPoolRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(bondPoolAccount);
        bondPoolTokenAccount = await bondPoolTokenMint.createAccount(bondPoolAccount);

    });

    const send_toke_amount = new anchor.BN(5000000);

    it('run function: initializeBondPool', async () => {
        console.log("Running initializeBondPool");

        /**
         * Run the RPC Call here
         */
        const initializeTx = await program.rpc.initializeBondPool(
            bumpBondPoolAccount,
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolTokenMint: bondPoolTokenMint.publicKey,
                    bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
                    bondPoolTokenAccount: bondPoolTokenAccount,
                    initializer: payer.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [payer]
            }
        );
        const tx = await provider.connection.confirmTransaction(initializeTx);
        console.log(tx);
        console.log("initializeTx signature", initializeTx);

    });

    //let bondInstanceAccount: PublicKey | null = null;
    //let bumpBondInstanceAccount: number | null = null;

    let purchaserRedeemableTokenAccount: PublicKey | null = null;
    let purchaserTokenAccount: PublicKey | null = null;

    //let bondInstanceRedeemableTokenAccount: PublicKey | null = null;
    //let bondInstanceSolanaAccount: PublicKey | null = null;
    //let bumpBondInstanceSolanaAccount: number | null = null;

    // Get current UTC, or so

    // let startTime: BN = new BN(startTimeJS);
    // let endTime: BN = new BN(endTimeJS);
    // let purchaser: PublicKey | null = null;

    // purchaser = payer.publicKey;
    // it('run function: purchaseBond', async () => {
    //     console.log("Purchasin bond...");
    //     purchaser = payer.publicKey;
    //     purchaserRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(purchaser);
    //     purchaserTokenAccount = await bondPoolTokenMint!.createAccount(purchaser);
    //     const initRA = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount)
    //     const initTA = new BN((await bondPoolTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
    //     // Solana Account Before
    //     const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
    //     const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolTokenAccount)));
    //     console.log("Initial and final are: ");
    //     console.log("Initial Payer SOL", initRA.toString());
    //     console.log("Initial Bond SOL (reserve)", initTA.toString());
    //     // Mint Before
    //     //const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);
    //     console.log("Running accounts...");
    //     console.log({
    //         bondPoolAccount: bondPoolAccount.toString(),
    //         bondPoolTokenAccount: bondPoolTokenAccount.toString(),
    //         bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey.toString(),
    //         purchaser: purchaser.toString(),
    //         purchaserTokenAccount: purchaserRedeemableTokenAccount.toString(),
    //
    //     });
    //     await bondPoolTokenMint.mintTo(purchaserTokenAccount, purchaser, [], 1000000000);
    //     const twoRA = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount)
    //     const twoTA = new BN((await bondPoolTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
    //     console.log("CHICKEN CHICKEN: ");
    //     console.log("Initial Payer SOL", twoRA.toString());
    //     console.log("Initial Bond SOL (reserve)", twoTA.toString());
    //     const initializeTx = await program.rpc.purchaseBond(
    //         new BN(2500000),
    //         {
    //             accounts: {
    //                 bondPoolAccount: bondPoolAccount,
    //                 bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
    //                 bondPoolTokenMint: bondPoolTokenMint.publicKey,
    //                 bondPoolTokenAccount: bondPoolTokenAccount,
    //                 bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
    //                 purchaser: purchaser,
    //                 purchaserTokenAccount: purchaserTokenAccount,
    //                 purchaserRedeemableTokenAccount: purchaserRedeemableTokenAccount,
    //                 //bondInstanceAccount: bondInstanceAccount,
    //                 //bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,
    //
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //                 clock: web3.SYSVAR_CLOCK_PUBKEY,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 tokenProgram: TOKEN_PROGRAM_ID
    //             },
    //             signers: [payer]
    //         }
    //     );
    //     await provider.connection.confirmTransaction(initializeTx);
    //     console.log("initializeTx signature", initializeTx);
    //
    //     const finalPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
    //     const finalBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolTokenAccount)));
    //     //const finalBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);
    //
    //     console.log("Initial and final are: ");
    //     console.log("Initial Payer SOL", initialPayerSol.toString());
    //     console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
    //     //console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());
    //
    //     console.log("Final Payer SOL", finalPayerSol.toString());
    //     console.log("Final Bond SOL (reserve)", finalBondSol.toString());
    //     //console.log("Final Bond Redeemable", finalBondRedeemableTok.toString());
    //
    // });

    // TODO: Do two tests where the interest is paid out

    // it('run function: redeemBondInstance (before interest was paid out)', async () => {
    //     console.log("Redeeming bond...");
    //
    //     // Do a small airdrop to the solana account ...
    //     // Assume it compounds by 2 in the meantime
    //     console.log("Airdropping..",  2 * AMOUNT);
    //     await provider.connection.requestAirdrop(bondPoolTokenAccount, 2 * AMOUNT);
    //
    //     // Solana Account Before
    //     const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
    //     const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolTokenAccount)));
    //     const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
    //
    //     console.log("Initial and final are: ");
    //     console.log("Initial Payer SOL", initialPayerSol.toString());
    //     console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
    //     //console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());
    //
    //     console.log("Running accounts...");
    //     console.log({
    //         bondPoolAccount: bondPoolAccount.toString(),
    //         bondPoolSolanaAccount: bondPoolTokenAccount.toString(),
    //         bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey.toString(),
    //         purchaserTokenAccount: purchaserRedeemableTokenAccount.toString(),
    //
    //         purchaser: purchaser.toString(),
    //         //bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount.toString(),
    //     });
    //
    //     console.log("Taking out all the redeemables that were paid in so far...", initialBondRedeemableTok.toString());
    //
    //     console.log("Asking for this much SOL");
    //     const initializeTx = await program.rpc.redeemBond(
    //         // Need to assign less than there is ...
    //         initialBondRedeemableTok.div(new BN(2)),
    //         {
    //             accounts: {
    //                 bondPoolAccount: bondPoolAccount,
    //                 bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
    //                 bondPoolTokenMint: bondPoolTokenMint.publicKey,
    //                 bondPoolTokenAccount: bondPoolTokenAccount,
    //                 bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
    //                 purchaser: purchaser,
    //                 purchaserTokenAccount: purchaserTokenAccount,
    //                 purchaserRedeemableTokenAccount: purchaserRedeemableTokenAccount,
    //                 //bondInstanceAccount: bondInstanceAccount,
    //                 //bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,
    //
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //                 clock: web3.SYSVAR_CLOCK_PUBKEY,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 tokenProgram: TOKEN_PROGRAM_ID
    //             },
    //             signers: [payer]
    //         }
    //     );
    //     await provider.connection.confirmTransaction(initializeTx);
    //     console.log("initializeTx signature", initializeTx);
    //
    //     const finalPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
    //     const finalBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolTokenAccount)));
    //
    //     //const finalBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);
    //
    //     console.log("Initial and final are: ");
    //     console.log("Initial Payer SOL", initialPayerSol.toString());
    //     console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
    //     //console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());
    //
    //     console.log("Final Payer SOL", finalPayerSol.toString());
    //     console.log("Final Bond SOL (reserve)", finalBondSol.toString());
    //     //console.log("Final Bond Redeemable", finalBondRedeemableTok.toString());
    //
    // });
    /*
    it('run function: redeemBondInstance (after interest was paid out)', async () => {
        console.log("Redeeming bond...");

        // Solana Account Before
        const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));
        const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);

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
            // bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount.toString(),
        });

        // console.log("Taking out all the redeemables that were paid in so far...", initialBondRedeemableTok.toString());

        console.log("Asking for this much SOL");
        const initializeTx = await program.rpc.redeemBond(
            // Need to assign less than there is ...
            initialBondRedeemableTok.div(new BN(2)),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolSolanaAccount: bondPoolSolanaAccount,
                    //bondInstanceAccount: bondInstanceAccount,
                    //bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,
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

        //const finalBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);

        console.log("Initial and final are: ");
        console.log("Initial Payer SOL", initialPayerSol.toString());
        console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
        //console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());

        console.log("Final Payer SOL", finalPayerSol.toString());
        console.log("Final Bond SOL (reserve)", finalBondSol.toString());
        //console.log("Final Bond Redeemable", finalBondRedeemableTok.toString());

    });
    */
});
