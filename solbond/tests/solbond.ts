import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, getBlockchainEpoch, getPayer} from "./utils";
import {Keypair, PublicKey} from "@solana/web3.js";
import {expect} from "chai";
import {endianness} from "os";

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

    let bondPoolRedeemableMint: any = null;
    let bondPoolRedeemableTokenAccount: any = null;
    let bondPoolAccount: any = null;
    let bumpBondPoolAccount: any = null;
    let bondPoolSolanaAccount: any = null;
    let bumpBondPoolSolanaAccount: any = null;

    it('run function: initializeBondPool', async () => {
        console.log("Running initializeBondPool");

        // Generate a PDA
        [bondPoolAccount, bumpBondPoolAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer()],
            program.programId
        );
        [bondPoolSolanaAccount, bumpBondPoolSolanaAccount] = await PublicKey.findProgramAddress(
            [bondPoolAccount.toBuffer()],
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

    });

});
