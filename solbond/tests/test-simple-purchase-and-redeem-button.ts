import {BN, Provider} from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {Keypair, PublicKey, SystemProgram} from "@solana/web3.js";
import {
    Transaction,
} from '@solana/web3.js';
import {SolendMarket, SolendAction, syncNative} from "@solendprotocol/solend-sdk";
import {getAssociatedTokenAddress} from "easy-spl/dist/tx/associated-token-account";
import {
    Cluster,
    CrankRpcCalls,
    delay,
    getSolbondProgram, MOCK,
    PortfolioFrontendFriendlyChainedInstructions,
    Registry,
    sendAndConfirmTransaction
} from '@qpools/sdk';
import { TokenInstructions } from "@project-serum/serum";
const SOLANA_START_AMOUNT = 10_000_000_000;

// interface SyncNativeInstructionData {
//     instruction: TokenInstruction.SyncNative;
// }
// export const syncNativeInstructionData = struct<SyncNativeInstructionData>([u8('instruction')]);
//
// function createSyncNativeInstruction(account: PublicKey, programId = TOKEN_PROGRAM_ID): TransactionInstruction {
//     const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
//
//     const data = Buffer.alloc(syncNativeInstructionData.span);
//     syncNativeInstructionData.encode({ instruction: TokenInstruction.SyncNative }, data);
//
//     return new TransactionInstruction({ keys, programId, data });
// }

describe('qPools!', () => {

    // Configure the client to use the local cluster.
    //// @ts-expect-error
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);    //const provider = Provider.local("http://localhost:8899");
    //const provider = Provider.local();
    //anchor.setProvider(provider);
    //console.log("provider jsadkjjsdfjk ", provider);
    const connection = provider.connection;
    const solbondProgram = getSolbondProgram(connection, provider, Cluster.LOCALNET);
    //console.log("got the solbond program ", solbondProgram);
    const genericPayer = provider.wallet.publicKey;
    console.log("got the generic ", genericPayer.toString());

    let weights: BN[];
    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;

    let poolAddresses: PublicKey[];
    let USDC_mint: PublicKey;
    let mSOLLpToken: PublicKey;
    let wrappedSolMint: PublicKey;
    let mSOL: PublicKey;

    let portfolioObject: PortfolioFrontendFriendlyChainedInstructions;
    let crankRpcTool: CrankRpcCalls;
    let registry: Registry;
    let valueInUsdc: number;
    let AmountUsdc: BN;
    let valueInSol: number;
    // I guess mSOL has 9 decimal points
    let AmountSol: BN;
    let solendmarket;
    const tokenSymbolSolend = 'SOL'
    let solSolendMint;
    // Do some airdrop before we start the tests ...
    before(async () => {

        // TODO: For the crank, create a new keypair who runs these cranks ... (as is done on the front-end)

        registry = new Registry(connection);
        portfolioObject = new PortfolioFrontendFriendlyChainedInstructions(
            connection,
            provider,
            solbondProgram,
            registry
        );
        await portfolioObject.initializeState();
        // TODO: Create a new provider for the crank ... (?), and airdrop them some SOL

        // Send some SOL to the tmpKeypair
        let tmpKeypair = Keypair.generate();
        //const sg = await connection.requestAirdrop(tmpKeypair.publicKey, 500_000_000);
        //const tx = await connection.confirmTransaction(sg);
        //console.log("airdrop tx: ", tx);
        crankRpcTool = new CrankRpcCalls(
            connection,
            tmpKeypair,
            provider,
            solbondProgram,
            registry
        );
        await crankRpcTool.initializeState();
        // Delay a bit so the async call works ...
        await delay(5000);
        
        weights = [new BN(500), new BN(500), new BN(500)];

        USDC_mint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
        // USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");  // This is the pool address, not the LP token ...
        USDC_USDT_pubkey = new PublicKey("2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf");
        mSOLLpToken = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");  // Assume the LP token to be the denominator for what underlying asset we target ...

        // Todo, wrap some SOL and send this to the account ...
        
        // let USDC_mint = new PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");

        wrappedSolMint = new PublicKey("So11111111111111111111111111111111111111112");
        console.log("disaster ")
        solendmarket = await SolendMarket.initialize(connection, "production")
        console.log("solendmarket")
        //console.log(solendmarket.reserves)
        //const solendConfigs = solendmarket.reserves.map((element, index, array) => element.config)
        //console.log("kirekhar ",solendConfigs)
        //const fs = require('fs');
        //const {parse, stringify} = require('flatted');

        //let user = solendmarket;
        //stringify(user);
        //JSON.stringify(user,null,2)
        //fs.writeFile('SolendMarket.json', JSON.stringify(solendConfigs), (err) => {
        //    if (err) {
        //        throw err;
        //    }
        //    console.log("JSON data is saved.");
        //});
        await solendmarket.loadReserves();
        console.log("kire khar ", solendmarket)

        const solReserve = solendmarket.reserves.find(res => res.config.symbol === tokenSymbolSolend);
        solSolendMint = new PublicKey(solReserve.config.mintAddress);
        console.log("Solend Sol Mint Address is: ", solSolendMint.toString());
        // We need the mSOL, because in the end, this is what we will be sendin back to the user ...
        // We will probably need to apply a hack, where we replace the mSOL with SOL, bcs devnet.
        // Probably easiest to do so is by swapping on the frontend, once we are mainnet ready
        mSOL = portfolioObject.marinadeState.mSolMintAddress;
        //console.log("mSOL mint is: ", mSOL.toString());
        poolAddresses = [USDC_USDT_pubkey, mSOLLpToken, solSolendMint];

        // If poolAddresses or weights are empty, don't proceed!
        if (weights.length === 0 || poolAddresses.length === 0) {
            throw Error("Weights or PoolAddresses are empty!");
        }
        if (weights.length != poolAddresses.length) {
            throw Error("Weights and PoolAddresses do not conform!");
        }
        if (!(weights.length > 0)) {
            throw Error("All weights are zero! Doesn't make sense to create a portfolio");
        }
    })

    it("Create Associated Token Accounts", async () => {
        console.log("Creating associated token accounts ...");
        // solSolendMint

        // Fetch solend, and the other currencies that we are using ...
        console.log("Creating associated token addresses for: ", [poolAddresses].map((x) => x.toString()));
        // get the mint addresses

        // This is the token mint for the USDC-USDT pool
        let txCreateATA: Transaction = await portfolioObject.createAssociatedTokenAccounts(poolAddresses, provider.wallet);
        let txCreateATA1: Transaction = await portfolioObject.createSingleATA(USDC_mint, provider.wallet);
        if (txCreateATA.instructions.length > 0) {
            console.log("Transaction is: ", txCreateATA);
            await sendAndConfirmTransaction(
                solbondProgram.provider,
                connection,
                txCreateATA
            );
            await sendAndConfirmTransaction(
                solbondProgram.provider,
                connection,
                txCreateATA1
            );
            
        }




        console.log("Airdropping some wrapped SOL");

        // create a wrapped SOL account
        if ((await connection.getBalance(genericPayer)) <= 3e9) {
            let tx1 = await connection.requestAirdrop(genericPayer, 1e9);
            await connection.confirmTransaction(tx1, 'finalized');
            console.log("Airdropped 1!");
        }

        // If it exists, skip this.
        const associatedTokenAccountWrappedSol = await getAssociatedTokenAddress(
            wrappedSolMint,
            genericPayer
        );
        const givemoney = new Transaction().add(
            SystemProgram.transfer({
                     fromPubkey: genericPayer,
                     toPubkey: associatedTokenAccountWrappedSol,
                     lamports: 4e8,
            }),
            // createSyncNativeInstruction(associatedTokenAccountWrappedSol)
            syncNative(associatedTokenAccountWrappedSol)
        )
        let sendsig = await provider.sendAndConfirm(givemoney)
        await provider.connection.confirmTransaction(sendsig);
        console.log("send money from user to portfolio: ", sendsig);


    });

    it("Prepare the amount of SOL and USDC to pay in ", async () => {
        valueInUsdc = 2;
        AmountUsdc = new BN(valueInUsdc).mul(new BN(10**6));
        valueInSol = 2;
        // I guess mSOL has 9 decimal points
        AmountSol = new BN(valueInSol).mul(new BN(10**6));
        console.log("Total amount in Usdc is: ", valueInUsdc);
        if (!(valueInUsdc > 0)) {
            throw Error("Amount to be paid in must be bigger than 0");
        }

        const associatedTokenAccountUSDC = await getAssociatedTokenAddress(
            USDC_mint,
            genericPayer
        );

        const tx = new anchor.web3.Transaction().add(
            TokenInstructions.mintTo({
              mint: USDC_mint,
              amount: AmountUsdc,
              mintAuthority: genericPayer,
              destination: associatedTokenAccountUSDC,
            })
          );

          await sendAndConfirmTransaction(
            solbondProgram.provider,
            connection,
            tx
        );

        
    });

    it("Creates the first transaction", async () => {


        let tx: Transaction = new Transaction();
        // hardcode this for now lol
        console.log("createPortfolioSigned");
        let IxCreatePortfolioPda = await portfolioObject.createPortfolioSigned(
            weights,
            poolAddresses,
            2
        );
        tx.add(IxCreatePortfolioPda);
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx
        );
        console.log("pashm ");
        let tx1: Transaction = new Transaction();  
        console.log("Transfer Asset to Portfolio");
        console.log("registerCurrencyInputInPortfolio");
        let IxRegisterCurrencyUsdcInput = await portfolioObject.registerCurrencyInputInPortfolio(
            AmountUsdc,
            USDC_mint
        );
        tx1.add(IxRegisterCurrencyUsdcInput);
        
        console.log("registerCurrencyInputInPortfolio");
        let IxRegisterCurrencywSOLInput = await portfolioObject.registerCurrencyInputInPortfolio(
            new BN(1).mul(new BN(10**6)), solSolendMint
        );
        console.log("asbe khare sag ", (new BN(1).mul(new BN(10**9)).toString()))
        tx1.add(IxRegisterCurrencywSOLInput);
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx1
        );
        console.log("pehen")
        // Set of instructions here are hard-coded

        // Create position approve for marinade, and the saber pool (again, hardcode this part lol).
        // Later these should be fetched from the frontend.
        console.log("Approve Position Saber");
        // I guess we gotta make the case distinction here lol
        // TODO: Copy the case-distinction from below. Then you can continue
        // TODO: figure out tokenA and tokenB ==> Currently hard-coded..
        let tx2: Transaction = new Transaction();
        let tx3: Transaction = new Transaction();
        let tx4: Transaction = new Transaction();
        let tx5: Transaction = new Transaction();
        console.log("approvePositionWeightSaber");
        let IxApproveiPositionWeightSaber = await portfolioObject.approvePositionWeightSaber(
            poolAddresses[0],
            AmountUsdc,
            new BN(0),  // Will be flipped in the backend ..
            new BN(0),
            0,  // Hardcoded
            weights[0]
        )
        tx2.add(IxApproveiPositionWeightSaber);
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx2
        );
        console.log("labeyk")
        console.log("Approve Position Marinade");
        console.log("approvePositionWeightMarinade");
        let IxApprovePositionWeightMarinade = await portfolioObject.approvePositionWeightMarinade(
            new BN(1).mul(new BN(10**6)),
            1, // Hardcoded
            weights[1]
        );
        tx3.add(IxApprovePositionWeightMarinade);
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx3
        );
        console.log("arezuye ")
        console.log("Approve Position Solend");
        let IxApprovePositionWeightSolend = await portfolioObject.approvePositionWeightSolend(
            solSolendMint,
            new BN(1).mul(new BN(10**5)),
            2, // Hardcoded
            weights[2]
        );
        tx4.add(IxApprovePositionWeightSolend);
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx4
        );
        console.log("bahane kardam")
        console.log("Sending USDC");
        let IxSendUsdcToPortfolio = await portfolioObject.transfer_to_portfolio(USDC_mint);
        let IxSendSolendSoltoPortfolio = await portfolioObject.transfer_to_portfolio(solSolendMint);
        tx5.add(IxSendUsdcToPortfolio); // account does not exist for this
        tx5.add(IxSendSolendSoltoPortfolio); // insuffient funds for this
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx5
        );
        // For now, we can make the generic payer also run the cranks, so we can skip the crank wallet functionality ...
        console.log("Sending and signing the transaction");
        console.log("gerye ra be masti")
        console.log("Provider is: ");
        console.log(solbondProgram!.provider);
        console.log(solbondProgram!.provider.wallet.publicKey.toString());
        //await sendAndConfirmTransaction(
        //    solbondProgram!.provider,
        //    connection!,
        //    tx
        //);

    });

    /*it("run the cranks to fulfill the Saber, Marinade and solend Positions ...", async () => {
        // These are not instruction-chained, because the crankRPC is done through a keypair ...
        // Perhaps it could be useful to make it chained tho, just for the sake of atomicity
        let sgPermissionlessFullfillSaber = await crankRpcTool.permissionlessFulfillSaber(0);
        console.log("Fulfilled sg Saber is: ", sgPermissionlessFullfillSaber);
        let sgPermissionlessFullfillMarinade = await crankRpcTool.createPositionMarinade(1);
        console.log("Fulfilled sg Marinade is: ", sgPermissionlessFullfillMarinade);
        let solendAction = await SolendAction.initialize(
            "mint",
            new BN(0),
            tokenSymbolSolend,
            provider.wallet.publicKey,
            connection,
            "devnet"
        )
        let sgPermissionlessFullfillSolend = await crankRpcTool.createPositionSolend(2)
        console.log("Fulfilled sg Solend is: ", sgPermissionlessFullfillSolend);

    });*/

    /**
     * Now also redeem the positions ...
     */
    /*it("start to withdraw the position again: ", async() => {
        let tx: Transaction = new Transaction();
        console.log("Approving Withdraw Portfolio");
        let IxApproveWithdrawPortfolio = await portfolioObject.approveWithdrawPortfolio();
        tx.add(IxApproveWithdrawPortfolio);

        console.log("Approving Saber Withdraw");
        // TODO: Check which of the tokens is tokenA, and withdraw accordingly ...
        let minRedeemAmount = new BN(0);  // This is the minimum amount of tokens that should be put out ...
        let IxApproveWithdrawSaber = await portfolioObject.signApproveWithdrawAmountSaber(0, minRedeemAmount);
        tx.add(IxApproveWithdrawSaber);

        console.log("Approving Marinade Withdraw");
        let IxApproveWithdrawMarinade = await portfolioObject.approveWithdrawToMarinade(1);
        tx.add(IxApproveWithdrawMarinade);


        // let minRedeemAmount2 = new BN(1).mul(new BN(10**4));  // This is the minimum amount of tokens that should be put out ...
        let IxApproveWithdrawSolend = await portfolioObject.approveWithdrawSolend(2);
        tx.add(IxApproveWithdrawSolend);

        console.log("Send some to Crank Wallet");
        if (tx.instructions.length > 0) {
            await sendAndConfirmTransaction(
                solbondProgram.provider,
                connection,
                tx
            );
        }
    })*/

    /*it("run the cranks to send the assets back to the user", async () => {
        // Run the saber redeem cranks ..
        let sgRedeemSinglePositionOnlyOne = await crankRpcTool.redeem_single_position_only_one(0);
        console.log("Signature to run the crank to get back USDC is: ", sgRedeemSinglePositionOnlyOne);

        let sgPermissionlessFullfillSolend = await crankRpcTool.redeemPositionSolend(2);
        console.log("Redeem sg Solend is: ", sgPermissionlessFullfillSolend)

        // For each initial asset, send it back to the user
        let sgTransferUsdcToUser = await crankRpcTool.transfer_to_user(USDC_mint);
        console.log("Signature to send back USDC", sgTransferUsdcToUser);

        let sgTransferUsdcTosolendSol = await crankRpcTool.transfer_to_user(solSolendMint);
        console.log("Signature to send back wSOL", sgTransferUsdcTosolendSol);

        
        // We never transferred wrapped sol ...
        // let sgTransferWrappedSolToUser = await crankRpcTool.transfer_to_user(wrappedSolMint);
        // console.log("Signature to send back Wrapped SOL", sgTransferWrappedSolToUser);
        // As for marinade SOL, it is transferred in the same moment as it is approved. As it is approved, this account is deleted.
        // So there is no need to (in fact, you cannot), transfer it back
        // let sgTransferMarinadeSolToUser = await crankRpcTool.transfer_to_user(mSOL);
        // console.log("Signature to send back Marinade SOL", sgTransferMarinadeSolToUser);

        // In reality, you would also swap back the mSOL to SOL ...
    });*/

})
