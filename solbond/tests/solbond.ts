import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, createMint2, getPayer} from "./utils";
import {PublicKey} from "@solana/web3.js";
const {
    ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const SOLANA_START_AMOUNT = 10_000_000_000;
const CURRENCY_TOKEN_START_AMOUNT = 7_000_000_000;
const CURRENCY_TOKEN_PAYIN_AMOUNT = 5_000_000_000;
const RESERVE_INCREASE_PHASE_1 = 10_000_000_000;
const RESERVE_INCREASE_PHASE_2 = 13_000_000_000;
const REDEEM_AMOUNT_TOKENS_PHASE_1 = 1_000_000_000;

describe('solbond', () => {

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solbond as Program<Solbond>;
    const payer = getPayer();

    let bondPoolRedeemableMint: Token | null = null;
    let bondPoolCurrencyTokenMint: Token | null = null;
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
        bondPoolCurrencyTokenMint = await createMint(provider, payer);
        bondPoolRedeemableMint = await createMint(provider, payer, bondPoolAccount, 9);

        bondPoolRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(bondPoolAccount);
        bondPoolTokenAccount = await bondPoolCurrencyTokenMint.createAccount(bondPoolAccount);

    });

    // Initialize the bond
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
                    bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
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

    let purchaser: PublicKey | null = null;
    let purchaserRedeemableTokenAccount: PublicKey | null = null;
    let purchaserCurrencyTokenAccount: PublicKey | null = null;

    // Make a purchase of the bond / staking
    it('run function: purchaseBond', async () => {
        console.log("Purchasing bond...");

        purchaser = payer.publicKey;
        purchaserRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(purchaser);
        purchaserCurrencyTokenAccount = await bondPoolCurrencyTokenMint!.createAccount(purchaser);

        // Do some currenty airdrop
        console.log("Before currency airdrop");
        await bondPoolCurrencyTokenMint.mintTo(purchaserCurrencyTokenAccount, purchaser, [], CURRENCY_TOKEN_START_AMOUNT);
        console.log("After currency airdrop");

        // BEGIN Some statistics BEFORE
        const RedeemableAmount_0 = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount);
        const TokenAmount_0 = new BN((await bondPoolCurrencyTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
        const PayerSolAmount_0: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const PayerTokenAmount_0 = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
        console.log("Initial and final are: ");
        console.log("Initial Redeemable Amount", RedeemableAmount_0.toString());
        console.log("Initial Token Amount", TokenAmount_0.toString());
        console.log("Initial Payer Sol Amount", PayerSolAmount_0.toString());
        console.log("Initial Payer Token Amount", PayerTokenAmount_0.toString());
        // END Some statistics BEFORE

        const initializeTx = await program.rpc.purchaseBond(
            new BN(CURRENCY_TOKEN_PAYIN_AMOUNT),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
                    bondPoolTokenAccount: bondPoolTokenAccount,
                    bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
                    purchaser: payer.publicKey,
                    purchaserTokenAccount: purchaserCurrencyTokenAccount,
                    purchaserRedeemableTokenAccount: purchaserRedeemableTokenAccount,

                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [payer]
            }
        );
        const tx = await provider.connection.confirmTransaction(initializeTx);
        console.log("initializeTx signature", initializeTx);
        console.log(tx);

        // BEGIN Some statistics AFTER
        const RedeemableAmount_1 = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount);
        const TokenAmount_1 = new BN((await bondPoolCurrencyTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
        const PayerSolAmount_1: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const PayerTokenAmount_1 = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
        console.log("Final Redeemable Amount", RedeemableAmount_1.toString());
        console.log("Final Bond Token Amount", TokenAmount_1.toString());
        console.log("Final Payer Sol Amount", PayerSolAmount_1.toString());
        console.log("Final Payer Token Amount", PayerTokenAmount_1.toString());
        // END Some statistics AFTER

    });

    // Redeem part of the bond, and simulate that the bond has generated yields
    it('run function: redeemBondInstance (after reserve generated some money out)', async () => {
        console.log("Redeeming bond...");

        // Do a small airdrop to the solana account ...
        // This simulates that the reserve generates yields ...
        await provider.connection.requestAirdrop(bondPoolTokenAccount, RESERVE_INCREASE_PHASE_1);

        // BEGIN Some statistics BEFORE
        const RedeemableAmount_2 = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount);
        const TokenAmount_2 = new BN((await bondPoolCurrencyTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
        const PayerSolAmount_2: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const PayerTokenAmount_2 = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
        console.log("Initial Redeemable Amount", RedeemableAmount_2.toString());
        console.log("Initial Token Amount", TokenAmount_2.toString());
        console.log("Initial Payer Sol Amount", PayerSolAmount_2.toString());
        console.log("Initial Payer Token Amount", PayerTokenAmount_2.toString());
        // END Some statistics BEGIN

        const initializeTx = await program.rpc.redeemBond(
            // Need to assign less than there is ...
            new BN(REDEEM_AMOUNT_TOKENS_PHASE_1),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
                    bondPoolTokenAccount: bondPoolTokenAccount,
                    bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
                    purchaser: payer.publicKey,
                    purchaserTokenAccount: purchaserCurrencyTokenAccount,
                    purchaserRedeemableTokenAccount: purchaserRedeemableTokenAccount,
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


        // BEGIN Some statistics BEFORE
        const RedeemableAmount_3 = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount);
        const TokenAmount_3 = new BN((await bondPoolCurrencyTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
        const PayerSolAmount_3: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const PayerTokenAmount_3 = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
        console.log("Final Redeemable Amount", RedeemableAmount_3.toString());
        console.log("Final Token Amount", TokenAmount_3.toString());
        console.log("Final Payer Sol Amount", PayerSolAmount_3.toString());
        console.log("Final Payer Token Amount", PayerTokenAmount_3.toString());
        // END Some statistics BEGIN


    });

    // Redeem part of the bond, and simulate that the bond has generated yields
    it('run function: redeemBondInstance full', async () => {
        console.log("Redeeming bond...");

        // Do a small airdrop to the solana account ...
        // This simulates that the reserve generates yields ...
        await provider.connection.requestAirdrop(bondPoolTokenAccount, RESERVE_INCREASE_PHASE_2);

        // BEGIN Some statistics BEFORE
        const RedeemableAmount_4 = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount);
        const TokenAmount_4 = new BN((await bondPoolCurrencyTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
        const PayerSolAmount_4: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const PayerTokenAmount_4 = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
        console.log("Initial Redeemable Amount", RedeemableAmount_4.toString());
        console.log("Initial Token Amount", TokenAmount_4.toString());
        console.log("Initial Payer Sol Amount", PayerSolAmount_4.toString());
        console.log("Initial Payer Token Amount", PayerTokenAmount_4.toString());
        // END Some statistics BEGIN

        const initializeTx = await program.rpc.redeemBond(
            // Need to assign less than there is ...
            new BN(PayerTokenAmount_4),
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
                    bondPoolTokenAccount: bondPoolTokenAccount,
                    bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
                    purchaser: payer.publicKey,
                    purchaserTokenAccount: purchaserCurrencyTokenAccount,
                    purchaserRedeemableTokenAccount: purchaserRedeemableTokenAccount,
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


        // BEGIN Some statistics BEFORE
        const RedeemableAmount_5 = new BN((await bondPoolRedeemableMint.getAccountInfo(bondPoolRedeemableTokenAccount)).amount);
        const TokenAmount_5 = new BN((await bondPoolCurrencyTokenMint.getAccountInfo(bondPoolTokenAccount)).amount)
        const PayerSolAmount_5: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        const PayerTokenAmount_5 = new BN((await bondPoolRedeemableMint.getAccountInfo(purchaserRedeemableTokenAccount)).amount);
        console.log("Final Redeemable Amount", RedeemableAmount_5.toString());
        console.log("Final Token Amount", TokenAmount_5.toString());
        console.log("Final Payer Sol Amount", PayerSolAmount_5.toString());
        console.log("Final Payer Token Amount", PayerTokenAmount_5.toString());
        // END Some statistics BEGIN


    });



});
