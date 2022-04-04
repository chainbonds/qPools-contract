import {BN, Provider} from '@project-serum/anchor';
import {Keypair, PublicKey} from "@solana/web3.js";
import {
    CrankRpcCalls,
    MOCK,
    NETWORK,
    PortfolioFrontendFriendlyChainedInstructions
} from "@qpools/sdk";
import {
    Transaction,
} from '@solana/web3.js';
import {
    getSolbondProgram,
} from "@qpools/sdk";
import {delay, sendAndConfirmTransaction} from "@qpools/sdk/lib/utils";
import {SolendMarket, SolendAction} from "@solendprotocol/solend-sdk";

const SOLANA_START_AMOUNT = 10_000_000_000;

describe('qPools!', () => {

    // Configure the client to use the local cluster.
    const provider = Provider.local("https://api.devnet.solana.com");
    //anchor.setProvider(provider);
    const connection = provider.connection;
    const solbondProgram = getSolbondProgram(connection, provider, NETWORK.DEVNET);

    // @ts-expect-error
    const genericPayer = provider.wallet.payer as Keypair;

    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;


    let weights: BN[];

    let poolAddresses: PublicKey[];
    let USDC_mint: PublicKey;
    let mSOLLpToken: PublicKey;
    let wrappedSolMint: PublicKey;

    let portfolioObject: PortfolioFrontendFriendlyChainedInstructions;
    let crankRpcTool: CrankRpcCalls;

    let solendmarket;
    const tokenSymbolSolend = 'SOL'
    let solSolendMint;
    // Do some airdrop before we start the tests ...
    before(async () => {

        portfolioObject = new PortfolioFrontendFriendlyChainedInstructions(
            connection,
            provider,
            solbondProgram
        );

        crankRpcTool = new CrankRpcCalls(
            connection,
            genericPayer,
            provider,
            solbondProgram
        );

        // Delay a bit so the async call works ...
        await delay(5000);

        weights = [new BN(1000)];

        USDC_mint = new PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");  // This is the pool address, not the LP token ...
        mSOLLpToken = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");  // Assume the LP token to be the denominator for what underlying asset we target ...



        wrappedSolMint = new PublicKey("So11111111111111111111111111111111111111112");

        solendmarket = await SolendMarket.initialize(connection, "devnet")
        await solendmarket.loadReserves();

        const solReserve = solendmarket.reserves.find(res => res.config.symbol === tokenSymbolSolend);
        solSolendMint = new PublicKey(solReserve.config.mintAddress)


        poolAddresses = [solSolendMint];

        // If poolAddresses or weights are empty, don't proceed!

    })

    it("Create Associated Token Accounts", async () => {
        console.log("Creating associated token accounts ...");
        let txCreateATA: Transaction = await portfolioObject.createAssociatedTokenAccounts([], solSolendMint, provider.wallet);
        if (txCreateATA.instructions.length > 0) {
            await sendAndConfirmTransaction(
                solbondProgram.provider,
                connection,
                txCreateATA
            );
        }
    });

    it("Creates the first transaction", async () => {

        let tx: Transaction = new Transaction();
        // hardcode this for now lol
        let IxCreatePortfolioPda = await portfolioObject.createPortfolioSigned(
            weights,
            poolAddresses,
            new BN(2)
        );
        tx.add(IxCreatePortfolioPda);

        console.log("222222222222222222222222222222222222222222222222222222222222222")

        let IxRegisterCurrencywSOLInput = await portfolioObject.registerCurrencyInputInPortfolio(
            new BN(1).mul(new BN(10**9)), solSolendMint
        );
        tx.add(IxRegisterCurrencywSOLInput);

        console.log("33333333333333333333333333333333333333333333333333333333333333")


        console.log("Approve Position Solend");
        let IxApprovePositionWeightSolend = await portfolioObject.approvePositionWeightSolend(
            solSolendMint,
            new BN(1).mul(new BN(10**5)),
            2, // Hardcoded
            weights[2]
        );
        tx.add(IxApprovePositionWeightSolend);

        console.log("666666666666666666666666666666666666666666666666666666666666666666666")



        let IxSendSolendSoltoPortfolio = await portfolioObject.transfer_to_portfolio(solSolendMint);
        tx.add(IxSendSolendSoltoPortfolio);

        console.log("777777777777777777777777777777777777777777777777777777777777777777")


        // For now, we can make the generic payer also run the cranks, so we can skip the crank wallet functionality ...
        console.log("Sending and signing the transaction");
        console.log("Provider is: ");
        console.log(solbondProgram!.provider);
        console.log(solbondProgram!.provider.wallet.publicKey.toString());
        await sendAndConfirmTransaction(
            solbondProgram!.provider,
            connection!,
            tx
        );

        console.log("888888888888888888888888888888888888888888888888888888888888888888")


    });

    it("run the cranks to fulfill the Solend ...", async () => {
        // These are not instruction-chained, because the crankRPC is done through a keypair ...
        // Perhaps it could be useful to make it chained tho, just for the sake of atomicity
        let sgPermissionlessFullfillSolend = await crankRpcTool.createPositionSolend(solSolendMint,2,tokenSymbolSolend, "devnet")
        console.log("Fulfilled sg Solend is: ", sgPermissionlessFullfillSolend);

    });

    /**
     * Now also redeem the positions ...
     */
    it("start to withdraw the position again: ", async() => {
        let tx: Transaction = new Transaction();
        console.log("Approving Withdraw Portfolio");
        let IxApproveWithdrawPortfolio = await portfolioObject.approveWithdrawPortfolio();
        tx.add(IxApproveWithdrawPortfolio);


        let minRedeemAmount2 = new BN(1).mul(new BN(10**4));  // This is the minimum amount of tokens that should be put out ...
        let IxApproveWithdrawSolend = await portfolioObject.approveWithdrawSolend(2, minRedeemAmount2);
        tx.add(IxApproveWithdrawSolend);

        console.log("Send some to Crank Wallet");
        if (tx.instructions.length > 0) {
            await sendAndConfirmTransaction(
                solbondProgram.provider,
                connection,
                tx
            );
        }
    })

    it("run the cranks to send the assets back to the user", async () => {
        // Run the saber redeem cranks ..


        let sgPermissionlessFullfillSolend = await crankRpcTool.redeemPositionSolend(solSolendMint,2,tokenSymbolSolend, "devnet")
        console.log("Redeem sg Solend is: ", sgPermissionlessFullfillSolend)

        await delay(5000);

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
    });

})
