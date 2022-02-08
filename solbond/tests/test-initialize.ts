import * as anchor from '@project-serum/anchor';
import {BN, Program, web3, Provider} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {Keypair, PublicKey, SYSVAR_RENT_PUBKEY, Transaction} from "@solana/web3.js";
import {createToken} from "@qpools/admin-sdk/lib/invariant-utils";
import {assert} from "chai";
import * as spl from 'easy-spl'
import {
    createAssociatedTokenAccountUnsigned,
    getAssociatedTokenAddressOffCurve,
} from "@qpools/sdk";
import {NETWORK} from "@qpools/sdk/lib/cluster";

import {
    createMint,
    getSolbondProgram,
} from "@qpools/sdk";
import {
    StableSwap,
    findSwapAuthorityKey,
  } from "@saberhq/stableswap-sdk";
import provider from '@project-serum/anchor/dist/cjs/provider';
const {
    ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const SOLANA_START_AMOUNT = 10_000_000_000;


describe('qPools!', () => {

    // Configure the client to use the local cluster.
    const provider = Provider.local("https://api.devnet.solana.com");
    //anchor.setProvider(provider);
    const connection = provider.connection;
    const solbondProgram = getSolbondProgram(connection, provider, NETWORK.DEVNET);
    
    const payer = Keypair.generate();
    // @ts-expect-error
    const genericPayer = provider.wallet.payer as Keypair;

    let mintAuthority: Keypair = Keypair.generate();
    let currencyMint: Token | null = null;
    let mintA: Token;
    let mintB: Token;
    let tokenAccountA: PublicKey;
    let tokenAccountB: PublicKey;
    //// Admin fee accounts
    let adminFeeAccountA: PublicKey;
    let adminFeeAccountB: PublicKey;
    //// Stable swap
    let swapAccount;
    let swapAuthority;
    let stableSwap: StableSwap;
    let fetchedStableSwap: StableSwap;
    let stableSwapAccount : Keypair;
    //stableSwapAccount=   Keypair.generate();
    let stableSwapProgramId: PublicKey;
    let stableSwapState;
    //stableSwapProgramId = SWAP_PROGRAM_ID;
    //console.log("Solbond Program");
    //console.log(solbondProgram.programId.toString());
    //console.log("Invariant Program");
    const AMP_FACTOR = 100;
    let QPTokenMint: Token;
    
    let qPoolCurrencyAccount;

    let USDC_USDT_pubkey: PublicKey;
    // Do some airdrop before we start the tests ...
    before(async () => {
        console.log("swapprogramid")
        stableSwapProgramId = new PublicKey(
            "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"
        );
        stableSwapAccount = Keypair.generate()
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");

      

        

    })

    it('#createStateOfTheWorld', async () => {

        fetchedStableSwap = await StableSwap.load(
            connection,
            USDC_USDT_pubkey,
            stableSwapProgramId
          );
        console.log("loaded")
        assert.ok(fetchedStableSwap.config.swapAccount.equals(
          USDC_USDT_pubkey)
        );
        swapAccount = fetchedStableSwap.config.swapAccount
        swapAuthority = fetchedStableSwap.config.authority
        const { state } = fetchedStableSwap;
        console.log(state);
        stableSwapState = state
          
        //const ATA_A = new Token(connection,state.tokenA.mint, TOKEN_PROGRAM_ID, genericPayer);
        //const ATA_B = new Token(connection,state.tokenB.mint, TOKEN_PROGRAM_ID, genericPayer);

        let tokenAMint = stableSwapState.tokenA.mint
        let tokenBMint = stableSwapState.tokenB.mint
  
        let poolTokenMint = stableSwapState.poolTokenMint
        //let ATA_lp = new Token(connection,poolTokenMint, TOKEN_PROGRAM_ID, genericPayer);

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
            solbondProgram.programId
        );

        console.log("poolPDA ", poolPDA.toString())
        console.log(solbondProgram)
        console.log(solbondProgram.programId.toString())
        //let finaltx = await solbondProgram.rpc.initializePoolAccount(
        //    poolBump,
        //    {
        //        accounts: {
        //            initializer: genericPayer.publicKey,
        //            poolPda: poolPDA,
        //            mintLp: poolTokenMint,
        //            mintA: stableSwapState.tokenA.mint,
        //            mintB: stableSwapState.tokenB.mint,
        //            poolTokenAccountA: stableSwapState.tokenA.reserve,
        //            poolTokenAccountB: stableSwapState.tokenB.reserve,
        //            clock:web3.SYSVAR_CLOCK_PUBKEY,
        //            systemProgram: web3.SystemProgram.programId,
        //            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        //            tokenProgram: TOKEN_PROGRAM_ID,
        //            // Create liquidity accounts
        //        },
        //        signers:[genericPayer]
        //    }
        //)
        //await provider.connection.confirmTransaction(finaltx);
        //console.log("did  it  Transaction id is: ", finaltx);

          
   

    });

    it('#createSinglePosition', async () => {
        let amountTokenA = new u64(1200);
        let amountTokenB = new u64(1200);

        let minMintAmount = new u64(0);


        let tokenAMint = stableSwapState.tokenA.mint
        let tokenBMint = stableSwapState.tokenB.mint

        let poolTokenMint = stableSwapState.poolTokenMint
        let poolMint = new Token(connection,poolTokenMint, TOKEN_PROGRAM_ID, genericPayer);


        const randomOwner = Keypair.generate()
        const alice = spl.Wallet.fromKeypair(connection, randomOwner)

        console.log(tokenAMint.toString())
        console.log(tokenBMint.toString())
        console.log(poolTokenMint.toString())

        //stableSwap.deposit({
        //    userAuthority: owner.publicKey,
        //    sourceA: userAccountA,
        //    sourceB: userAccountB,
        //    poolTokenAccount: userPoolAccount,
        //    tokenAmountA: new u64(depositAmountA),
        //    tokenAmountB: new u64(depositAmountB),
        //    minimumPoolTokenAmount: new u64(0), // To avoid slippage errors
        //  })
        //);

      

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
            solbondProgram.programId
        );

        let qPoolAccount: PublicKey = new PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs");
        let [positonPDA, bumpPositon] = await await PublicKey.findProgramAddress(
            [qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PositionAccount6"))],
            solbondProgram.programId
        );

        //let swapAuthority = stableSwapState.config.authority
        //console.log(swapAuthority.toString())
    
        const [authority] = await findSwapAuthorityKey(stableSwapState.adminAccount, stableSwapProgramId);
        console.log("authority ", authority.toString())
        
        //let txA = await spl.associatedTokenAccount.createAssociatedTokenAccountSigned(connection,tokenAMint, randomOwner.publicKey, alice);
        //let sg = await connection.sendTransaction(txA, [genericPayer]);
        //await connection.confirmTransaction(sg);
        //let userAccountA = await getAssociatedTokenAddressOffCurve(stableSwapState.tokenA.mint, positonPDA);

        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                connection,
                stableSwapState.tokenA.mint,
                null,
                positonPDA,
                provider.wallet
            );
            const sg = await connection.sendTransaction(tx, [genericPayer]);
            await connection.confirmTransaction(sg);
            console.log("Signature for token A is: ", sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }

        let userAccountA = await getAssociatedTokenAddressOffCurve(stableSwapState.tokenA.mint, positonPDA);
        //console.log("qpollcurrarr", qPoolCurrencyAccount.toString())
        //let userAccountA = await tokenAMint.createAccount(positonPDA)
        console.log("mint A")

        //await mintA.mintTo(userAccountA, genericPayer, [], amountTokenA);
        // Creating depositor token b account
 
        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                connection,
                stableSwapState.tokenB.mint,
                null,
                positonPDA,
                provider.wallet
            );
            const sg = await connection.sendTransaction(tx, [genericPayer]);
            await connection.confirmTransaction(sg);
            console.log("Signature for token B is: ", sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }
        // let userAccountB = await tokenBMint.createAccount(positonPDA)
        //let txB = await spl.associatedTokenAccount.createAssociatedTokenAccountSigned(connection,tokenBMint, randomOwner.publicKey, alice);
        //let txB = await spl.associatedTokenAccount.createAssociatedTokenAccountSigned(connection,tokenAMint, randomOwner.publicKey, alice);
        //let sg2 = await connection.sendTransaction(txB, [genericPayer]);
        //await connection.confirmTransaction(sg2);
        let userAccountB = await getAssociatedTokenAddressOffCurve(stableSwapState.tokenB.mint, positonPDA);

        //let userAccountB = await getAssociatedTokenAddressOffCurve(stableSwapState.tokenB.mint, positonPDA);
        console.log("user acc B info ", await connection.getAccountInfo(userAccountB))
        // try{
        //     await mintA.mintTo(userAccountA, genericPayer, [], amountTokenA);
        // } catch (e) {
        //     console.log("Error in mint A ", e)
        // }
        // try {
        //     await mintB.mintTo(userAccountB, genericPayer, [], amountTokenB);
        // } catch (e) {
        //     console.log("Error in mint B ", e)
        // }
        
        console.log("mint B")

        //let userAccountpoolToken  = await poolTokenMint.createAccount(positonPDA)
        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                connection,
                poolMint.publicKey,
                null,
                positonPDA,
                provider.wallet
            );
            const sg = await connection.sendTransaction(tx, [genericPayer]);
            await connection.confirmTransaction(sg);
            console.log("Signature for pool token is: ", sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }
        //let txP = await spl.associatedTokenAccount.createAssociatedTokenAccountSigned(connection,poolMint.publicKey, randomOwner.publicKey, alice);
        ////let txA = await spl.associatedTokenAccount.createAssociatedTokenAccountSigned(connection,tokenAMint, randomOwner.publicKey, alice);
        //let sg3 = await connection.sendTransaction(txP, [genericPayer]);
        //await connection.confirmTransaction(sg3);
        let userAccountpoolToken = await getAssociatedTokenAddressOffCurve(poolTokenMint, positonPDA);

        // let userAccountpoolToken = await getAssociatedTokenAddressOffCurve(poolTokenMint, positonPDA);
        let userAuthority = Keypair.generate()
        console.log("swap authority", authority.toString());
        console.log("swap spanishflowauthority", swapAuthority.toString());

        console.log("pool token Mint", poolTokenMint.toString())
        console.log("output lp", userAccountpoolToken.toString())
        console.log("userAuthority, ", qPoolAccount.toString())
        console.log("swap account", swapAccount.toString())
        console.log("user A", userAccountA.toString())
        console.log("reserve A", stableSwapState.tokenA.reserve.toString())

        console.log("position pda ", positonPDA.toString())
        console.log("pool pda ", poolPDA.toString())
        console.log("user B", userAccountB.toString())
        console.log("reserve B", stableSwapState.tokenB.reserve.toString())

        let finaltx = await solbondProgram.rpc.createPositionSaber(
            new BN(poolBump),
            new BN(bumpPositon),
            new BN(amountTokenA),
            new BN(amountTokenB),
            new BN(minMintAmount),
            {
                accounts: {
                    positionPda: positonPDA,
                    owner: qPoolAccount,//randomOwner.publicKey,
                    poolMint: poolTokenMint,
                    outputLp: userAccountpoolToken,
                    swapAuthority: swapAuthority,
                    poolPda: poolPDA,
                    swap:swapAccount,
                    qpoolsA: userAccountA,
                    poolTokenAccountA: stableSwapState.tokenA.reserve,
                    poolTokenAccountB: stableSwapState.tokenB.reserve,
                    qpoolsB: userAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    saberSwapProgram: stableSwapProgramId,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers:[genericPayer]
            }
        )

        await provider.connection.confirmTransaction(finaltx);
        console.log("did  it  Transaction id is: ", finaltx);
    })

 


  
});
