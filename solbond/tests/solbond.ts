import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, getPayer} from "./utils";
import {PublicKey} from "@solana/web3.js";

const AMOUNT = 10_000_000_000;

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
        await provider.connection.requestAirdrop(payer.publicKey, 30_000_000_000);
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

    //let bondInstanceAccount: PublicKey | null = null;
    //let bumpBondInstanceAccount: number | null = null;
    let purchaserRedeemableTokenAccount: PublicKey | null = null;
    //let bondInstanceRedeemableTokenAccount: PublicKey | null = null;
    //let bondInstanceSolanaAccount: PublicKey | null = null;
    //let bumpBondInstanceSolanaAccount: number | null = null;

    // Get current UTC, or so

    // let startTime: BN = new BN(startTimeJS);
    // let endTime: BN = new BN(endTimeJS);
    let purchaser: PublicKey | null = null;

    purchaser = payer.publicKey;
    it('run function: purchaseBond', async () => {
        console.log("Purchasin bond...");
        purchaser = payer.publicKey;
        purchaserRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(purchaser);

        // Solana Account Before
        const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));

        // Mint Before
        //const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(bondInstanceRedeemableTokenAccount)).amount);
        console.log("Running accounts...");
        console.log({
            bondPoolAccount: bondPoolAccount.toString(),
            bondPoolSolanaAccount: bondPoolSolanaAccount.toString(),
            bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey.toString(),
            purchaser: purchaser.toString(),
            purchaserTokenAccount: purchaserRedeemableTokenAccount.toString(),

        });

        const initializeTx = await program.rpc.purchaseBond(
            new BN(AMOUNT),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolSolanaAccount: bondPoolSolanaAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,

                    purchaser: purchaser,
                    purchaserTokenAccount: purchaserRedeemableTokenAccount,
                    //bondInstanceAccount: bondInstanceAccount,
                    //bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount,

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

    // TODO: Do two tests where the interest is paid out

    it('run function: redeemBondInstance (before interest was paid out)', async () => {
        console.log("Redeeming bond...");

        // Do a small airdrop to the solana account ...
        // Assume it compounds by 2 in the meantime
        console.log("Airdropping..",  2 * AMOUNT);
        await provider.connection.requestAirdrop(bondPoolSolanaAccount, 2 * AMOUNT);

        // Solana Account Before
        const initialPayerSol: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const initialBondSol: BN = new BN(String(await provider.connection.getBalance(bondPoolSolanaAccount)));
        const initialBondRedeemableTok = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);

        console.log("Initial and final are: ");
        console.log("Initial Payer SOL", initialPayerSol.toString());
        console.log("Initial Bond SOL (reserve)", initialBondSol.toString());
        //console.log("Initial Bond Redeemable", initialBondRedeemableTok.toString());

        console.log("Running accounts...");
        console.log({
            bondPoolAccount: bondPoolAccount.toString(),
            bondPoolSolanaAccount: bondPoolSolanaAccount.toString(),
            bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey.toString(),
            purchaserTokenAccount: purchaserRedeemableTokenAccount.toString(),

            purchaser: purchaser.toString(),
            //bondInstanceTokenAccount: bondInstanceRedeemableTokenAccount.toString(),
        });

        console.log("Taking out all the redeemables that were paid in so far...", initialBondRedeemableTok.toString());

        console.log("Asking for this much SOL");
        const initializeTx = await program.rpc.redeemBond(
            // Need to assign less than there is ...
            initialBondRedeemableTok.div(new BN(2)),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolSolanaAccount: bondPoolSolanaAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,

                    purchaser: purchaser,
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

});
