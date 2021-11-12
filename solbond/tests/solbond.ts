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

    // Bond account is a random keypair

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
        const [_poolSigner, bump] = await PublicKey.findProgramAddress(
            [payer!.publicKey.toBuffer()],
            program.programId
        );
        bondSigner = _poolSigner;

        // All these will be controlled fully by the client
        console.log("Creating redeemable Mint");
        redeemableMint = await createMint(provider, payer, bondSigner);
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

        console.log("Payer: ", payer);

        const addressContext: any = {
            bondAccount: payer.publicKey,
            // bondSigner: payer,
            // initializer: payer,
            // initializerTokenAccount: initializerTokenAccount,
            // solanaHoldingsAccount: initializerSolanaAccount,
            // initializerSolanaAccount: initializerSolanaAccount,
            clock: web3.SYSVAR_CLOCK_PUBKEY,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        };

        console.log("Getting RPC Call", addressContext);
        const tx = await program.rpc.initialize(
            bondTimeFrame,
            initializerAmount,
            bump,
            {accounts: addressContext}
        );
        console.log("Your transaction signature", tx);
    });


});
