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
import {Portfolio} from "@qpools/sdk/lib/register-portfolio";
import {delay, sendAndConfirmTransaction} from "@qpools/sdk/lib/utils";

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
    let stableSwapProgramId: PublicKey;

    let currencyMint: PublicKey = MOCK.DEV.SABER_USDC;
    let weights: BN[];
    let pool_addresses: Array<PublicKey>;
    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;
    let wSOL: PublicKey;
    let portfolio: Portfolio;
    let marinade;

    let poolAddresses: PublicKey[];
    let USDC_mint: PublicKey;
    let mSOLLpToken: PublicKey;
    let wrappedSolMint: PublicKey;
    let mSOL: PublicKey;

    let portfolioObject: PortfolioFrontendFriendlyChainedInstructions;
    let crankRpcTool: CrankRpcCalls;
    let valueInUsdc: number;
    let AmountUsdc: BN;
    let valueInSol: number;
    // I guess mSOL has 9 decimal points
    let AmountSol: BN;

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

        weights = [new BN(500), new BN(500)];

        USDC_mint = new PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");  // This is the pool address, not the LP token ...
        mSOLLpToken = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");  // Assume the LP token to be the denominator for what underlying asset we target ...
        poolAddresses = [USDC_USDT_pubkey, mSOLLpToken];
        // let USDC_mint = new PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");

        wrappedSolMint = new PublicKey("So11111111111111111111111111111111111111112");
        // We need the mSOL, because in the end, this is what we will be sendin back to the user ...
        // We will probably need to apply a hack, where we replace the mSOL with SOL, bcs devnet.
        // Probably easiest to do so is by swapping on the frontend, once we are mainnet ready
        mSOL = portfolioObject.marinadeState.mSolMintAddress;
        console.log("mSOL mint is: ", mSOL.toString());

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
        let txCreateATA: Transaction = await portfolioObject.createAssociatedTokenAccounts([poolAddresses[0]], provider.wallet);
        if (txCreateATA.instructions.length > 0) {
            await sendAndConfirmTransaction(
                solbondProgram.provider,
                connection,
                txCreateATA
            );
        }
    });

    it("Prepare the amount of SOL and USDC to pay in ", async () => {
        valueInUsdc = 2;
        AmountUsdc = new BN(valueInUsdc).mul(new BN(10**MOCK.DEV.SABER_USDC_DECIMALS));
        valueInSol = 1;
        // I guess mSOL has 9 decimal points
        AmountSol = new BN(valueInSol).mul(new BN(10**9));
        console.log("Total amount in Usdc is: ", valueInUsdc);
        if (!(valueInUsdc > 0)) {
            throw Error("Amount to be paid in must be bigger than 0");
        }
    });

    it("Creates the first transaction", async () => {


        let tx: Transaction = new Transaction();
        let IxCreatePortfolioPda = await portfolioObject.createPortfolioSigned(
            weights,
            poolAddresses
        );
        tx.add(IxCreatePortfolioPda);

        console.log("Transfer Asset to Portfolio");
        let IxRegisterCurrencyUsdcInput = await portfolioObject.registerCurrencyInputInPortfolio(
            AmountUsdc, USDC_mint
        );
        tx.add(IxRegisterCurrencyUsdcInput);
        // let IxRegisterCurrencyMSolInput = await qPoolContext.portfolioObject!.registerCurrencyInputInPortfolio(
        //     AmountSol, wrappedSolMint
        // );
        // tx.add(IxRegisterCurrencyMSolInput);

        // Set of instructions here are hard-coded

        // Create position approve for marinade, and the saber pool (again, hardcode this part lol).
        // Later these should be fetched from the frontend.
        console.log("Approve Position Saber");
        // I guess we gotta make the case distinction here lol
        // TODO: Copy the case-distinction from below. Then you can continue
        // TODO: figure out tokenA and tokenB ==> Currently hard-coded...
        let IxApproveiPositionWeightSaber = await portfolioObject.approvePositionWeightSaber(
            poolAddresses[0],
            AmountUsdc,
            new BN(0),  // Will be flipped in the backend ..
            new BN(0),
            0,  // Hardcoded
            weights[0]
        )
        tx.add(IxApproveiPositionWeightSaber);

        console.log("Approve Position Marinade");
        let IxApprovePositionWeightMarinade = await portfolioObject.approvePositionWeightMarinade(
            AmountSol,
            1, // Hardcoded
            weights[1]
        );
        tx.add(IxApprovePositionWeightMarinade);

        console.log("Sending USDC");
        let IxSendUsdcToPortfolio = await portfolioObject.transfer_to_portfolio(USDC_mint);
        tx.add(IxSendUsdcToPortfolio);

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

    });

    it("run the cranks to fulfill the marinade positions ...", async () => {
        // These are not instruction-chained, because the crankRPC is done through a keypair ...
        // Perhaps it could be useful to make it chained tho, just for the sake of atomicity
        let sgPermissionlessFullfillSaber = await crankRpcTool.permissionlessFulfillSaber(0);
        console.log("Fulfilled sg Saber is: ", sgPermissionlessFullfillSaber);
        let sgPermissionlessFullfillMarinade = await crankRpcTool.createPositionMarinade(1);
        console.log("Fulfilled sg Marinade is: ", sgPermissionlessFullfillMarinade);
    });

    /**
     * Now also redeem the positions ...
     */
    it("start to withdraw the position again: ", async() => {
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
        let sgRedeemSinglePositionOnlyOne = await crankRpcTool.redeem_single_position_only_one(0);
        console.log("Signature to run the crank to get back USDC is: ", sgRedeemSinglePositionOnlyOne);
        // For each initial asset, send it back to the user
        let sgTransferUsdcToUser = await crankRpcTool.transfer_to_user(USDC_mint);
        console.log("Signature to send back USDC", sgTransferUsdcToUser);
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