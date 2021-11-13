import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, getBlockchainEpoch, getPayer} from "./utils";
import {Keypair, PublicKey} from "@solana/web3.js";
import {expect} from "chai";

const BOND_LOCKUP_DURACTION_IN_SECONDS = 7;
const INITIALIZER_AMOUNT = 5;

describe('solbond', () => {

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solbond as Program<Solbond>;
    const payer = getPayer();

    console.log("Payer is. ", payer);

    // Bond account is a random keypair

    it('Initialize the state-of-the-world', async () => {
        // Let's see if we even need to add anything into this.
    });

    it('Initialize the state-of-the-world', async () => {
        // Let's see if we even need to add anything into this.
    });

    it('Initialize the state-of-the-world', async () => {
        // Let's see if we even need to add anything into this.
    });

    // These are all variables the client will have to create to initialize the bond logic.
    // Practically, the client goes into a contract with himself, and locking it up in the time-domain
    let bondSigner: PublicKey | null = null;
    let redeemableMint: Token | null = null;
    let bondAccount: Keypair | null = null;
    let initializerSolanaAccount: PublicKey | null = null;
    let initializerTokenAccount: PublicKey | null = null;

    let bondTimeFrame: BN | null = null;
    let initializerAmount: BN | null = null

    it('Is initialized!', async () => {

        console.log("Getting bond signer");
        const [_poolSigner, _bump] = await PublicKey.findProgramAddress(
            [Uint8Array.from([42])],
            program.programId
        );
        bondSigner = _poolSigner;

        // All these will be controlled fully by the client
        console.log("Creating redeemable Mint");
        console.log("Provider is: ", provider);
        console.log("Payer is: ", payer);
        console.log("Bond Signer is: ", bondSigner);
        redeemableMint = await createMint(provider, payer, bondSigner);
        console.log("Done creating redeemable Mint");
        // We need to create an associated token account for the guy who has instantiated the redeemableMint
        initializerSolanaAccount = payer.publicKey;
        console.log("Getting initializer token account");
        initializerTokenAccount = await redeemableMint!.createAccount(initializerSolanaAccount);


        // This is the bond account which will have control over the entire logic.
        // This is ultimately the 'program' account
        console.log("Generating bond account");
        bondAccount = Keypair.generate();

        // Get latest Blockchain Epoch. Lock up the bond accordingly
        console.log("Getting Blockchain Epoch");
        const time = await getBlockchainEpoch(provider);
        console.log("Getting BN Sum");
        const nowBn = new BN(time);
        bondTimeFrame = nowBn.add(new BN(BOND_LOCKUP_DURACTION_IN_SECONDS));
        initializerAmount = new BN(INITIALIZER_AMOUNT);
        const bump = new BN(_bump);

        console.log("Payer: ", payer);

        const addressContext: any = {
            bondAccount: bondAccount.publicKey,
            bondAuthority: bondSigner,
            initializer: payer.publicKey,
            initializerTokenAccount: initializerTokenAccount,
            // solanaHoldingsAccount: initializerSolanaAccount,
            // initializerSolanaAccount: initializerSolanaAccount,
            redeemableMint: redeemableMint.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            clock: web3.SYSVAR_CLOCK_PUBKEY,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        };

        console.log("Getting RPC Call", addressContext);
        console.log("Arguments are: ", )
        const tx = await program.rpc.initialize(
            bondTimeFrame,
            initializerAmount,
            bump,
            {
                accounts: addressContext,
                signers: [bondAccount]
            }
        );
        console.log("Your transaction signature", tx);
        return;

    });


});
