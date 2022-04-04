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

        weights = [new BN(500), new BN(500), new BN(500)];

        USDC_mint = new PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");  // This is the pool address, not the LP token ...
        mSOLLpToken = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");  // Assume the LP token to be the denominator for what underlying asset we target ...



        wrappedSolMint = new PublicKey("So11111111111111111111111111111111111111112");

        solendmarket = await SolendMarket.initialize(connection, "devnet")
        await solendmarket.loadReserves();

        const solReserve = solendmarket.reserves.find(res => res.config.symbol === tokenSymbolSolend);
        solSolendMint = new PublicKey(solReserve.config.mintAddress);


        poolAddresses = [USDC_USDT_pubkey, mSOLLpToken, solSolendMint];

        // If poolAddresses or weights are empty, don't proceed!

    })

    it("run the cranks to send the assets back to the user", async () => {
        // Run the saber redeem cranks ..

        let sgPermissionlessFullfillSolend = await crankRpcTool.redeemPositionSolend(solSolendMint,2,tokenSymbolSolend, "devnet")
        console.log("Redeem sg Solend is: ", sgPermissionlessFullfillSolend)


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
