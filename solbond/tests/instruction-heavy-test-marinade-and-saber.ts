import {BN, Provider} from '@project-serum/anchor';
import {u64} from '@solana/spl-token';
import {Keypair, PublicKey, Transaction} from "@solana/web3.js";
import {CrankRpcCalls, createAssociatedTokenAccountSendUnsigned, MOCK, NETWORK} from "@qpools/sdk";
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import {MarinadeState} from  '@marinade.finance/marinade-ts-sdk';
import {getSolbondProgram} from "@qpools/sdk";
import {Portfolio, PortfolioFrontendFriendlyChainedInstructions} from "@qpools/sdk";
import {getAccountForMintAndPDADontCreate, sendAndConfirmTransaction, sendAndSignInstruction} from "@qpools/sdk/lib/utils";
import {
    transfer_to_user
} from "../../qpools-sdk/src/instructions/modify/portfolio-transfer";
import {Cluster} from "@qpools/sdk/lib/network";

const SOLANA_START_AMOUNT = 10_000_000_000;

describe('qPools!', () => {

    // Configure the client to use the local cluster.
    const provider = Provider.local("https://api.google.devnet.solana.com");
    //anchor.setProvider(provider);
    const connection = provider.connection;
    const solbondProgram = getSolbondProgram(connection, provider, Cluster.DEVNET);

    const payer = Keypair.generate();
    // @ts-expect-error
    const genericPayer = provider.wallet.payer as Keypair;
    // const genericPayer = payer;

    let stableSwapProgramId: PublicKey;
    let currencyMint: PublicKey = MOCK.DEV.SABER_USDC;

    let weights: Array<BN>;
    let pool_addresses: Array<PublicKey>;
    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;
    // let wSOL_pubkey: PublicKey;
    let portfolio: Portfolio;
    let instructionHeavyPortfolio : PortfolioFrontendFriendlyChainedInstructions;
    let crankRPC : CrankRpcCalls;

    // Do some airdrop before we start the tests ...
    before(async () => {

        // await connection.requestAirdrop(genericPayer.publicKey, 1e9);

        console.log("swapprogramid");
        stableSwapProgramId = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        USDC_CASH_pubkey = new PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA");
        USDC_TEST_pubkey = new PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x");
        // wSOL_pubkey = new PublicKey("So11111111111111111111111111111111111111112");

        weights = [new BN(1000)];

        pool_addresses = [USDC_USDT_pubkey];

        portfolio = new Portfolio(connection, provider, solbondProgram, genericPayer);
        instructionHeavyPortfolio = new PortfolioFrontendFriendlyChainedInstructions(connection, provider, solbondProgram);
        crankRPC = new CrankRpcCalls(connection, genericPayer, provider, solbondProgram)
    })

    it("Create all the Associated Token Accounts", async () => {
        const marinadeConfig = new MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,

        });
        let marinade = new Marinade(marinadeConfig);
        const marinade_state = await MarinadeState.fetch(marinade);
        let tx = await instructionHeavyPortfolio.createAssociatedTokenAccounts(pool_addresses, provider.wallet)
        await sendAndConfirmTransaction(provider, connection, tx)
    })

    it('create a new portfolio', async() => {
        let tx = new Transaction();
        let total_amount_USDC = new u64(340000);
        let num_positions = new BN(1);
        try {
            let createPortfolioIx = await instructionHeavyPortfolio.createPortfolioSigned(weights, pool_addresses)
            tx.add(createPortfolioIx)
        } catch (e) {
            console.log(e);
            console.log("Error: Portfolio exists already");
        }

        // Could also be duplciate ...

        // TODO: I guess this will also already exist at some point ...

        try {
            const currencyInputIX = await instructionHeavyPortfolio.registerCurrencyInputInPortfolio(total_amount_USDC, MOCK.DEV.SABER_USDC);
            tx.add(currencyInputIX)
            //console.log("Current sig is: ", cur_sig);
        } catch (e) {
            console.log(e);
            console.log("Error: Currency mint already exists");
        }

        // Only do this for the first position ...
        for (let i = 0; i < num_positions.toNumber(); i++) {

            // Get state, and according to state, do this ...
            // Gotta double check which one corresponds to the currency ...
            // if (MOCK.DEV.SABER_USDC)
            let amountTokenA = new u64(1200);
            // let amountTokenA = new u64(0);
            // let amountTokenB = new u64(1200);
            let amountTokenB = new u64(0);
            let minMintAmount = new u64(0);
            let weight = new BN(1000);

            try {
                let approve_sig_ix = await instructionHeavyPortfolio.approvePositionWeightSaber(
                    pool_addresses,
                    amountTokenA,
                    amountTokenB,
                    minMintAmount,
                    i,
                    weight
                )
                tx.add(approve_sig_ix)
            } catch (e) {
                console.log("Approving position")
            }
        }
        console.log("sending the transaction to create a new portfolio: ----------------------------------------------------- ")
        await sendAndConfirmTransaction(provider, connection ,tx)
    })

    it('fulfill a position', async() => {
        let tx = new Transaction();
        const num_positions = 1;
        let total_amount_USDC = new u64(340000);
        // Get user's wrapped SOL ATA
        let usdc_ATA = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, genericPayer.publicKey);
        try {
            let transferToPortfolioIx = await instructionHeavyPortfolio.transfer_to_portfolio(MOCK.DEV.SABER_USDC);
            tx.add(transferToPortfolioIx)
        } catch (e) {
            console.log(e);
            console.log("Portfolio already exists probably?");
        }

        let IxSendToCrankWallet = await instructionHeavyPortfolio.sendToCrankWallet(
            genericPayer.publicKey,
            new BN(100_000_000)
        );
        tx.add(IxSendToCrankWallet);

        await sendAndConfirmTransaction(
            provider,
            connection,
            tx
        );

        console.log("Permissoinlessly fulfilling the transactions");
        let sgPermissionlessFullfillSaber = instructionHeavyPortfolio.permissionlessFulfillSaber(0);
        console.log("Fulfilled sg Saber is: ", sgPermissionlessFullfillSaber);
    })

    it('sign a redeem', async() => {
        let tx = new Transaction();
        let total_amount_USDC = new BN(340_000);
        const num_positions = 1;
        let amountTokenA = new u64(1);
        let amountTokenB = new u64(0);
        let minMintAmount = new u64(0);
        let withDrawIx= await instructionHeavyPortfolio.approveWithdrawPortfolio();
        tx.add(withDrawIx);
        var i = 0;
        // TODO: Gotta check the instruction-heavy or frontend implementation to cleanly deal with poolAddresses
        // TODO: Instead of fetching the pool address, here, fetch it in the underlying function from the devnet sate!
        let approve_sig_ix = await instructionHeavyPortfolio.signApproveWithdrawAmountSaber(
            i,
            minMintAmount
        )
        tx.add(approve_sig_ix)

        let IxSendToCrankWallet = await instructionHeavyPortfolio.sendToCrankWallet(
            genericPayer.publicKey,
            new BN(100_000_000)
        );
        tx.add(IxSendToCrankWallet);


        if (tx.instructions.length > 0) {
            await sendAndConfirmTransaction(
                provider,
                connection,
                tx
            );
        }

        let sgRedeemSinglePositionOnlyOne = await crankRPC.redeem_single_position_only_one(0);
        console.log("Signature to run the crank to get back USDC is: ", sgRedeemSinglePositionOnlyOne);

        // For each initial asset, send it back to the user
        let sgTransferUsdcToUser = await crankRPC.transfer_to_user(currencyMint);
        console.log("Signature to send back USDC", sgTransferUsdcToUser);

        let tmpWalletBalance: BN = new BN(await connection.getBalance(genericPayer.publicKey));
        let lamportsBack = BN.min(tmpWalletBalance.subn(7_001), new BN(0));
        if (lamportsBack.gtn(0)) {
            let ix = await crankRPC.sendToUsersWallet(
                genericPayer.publicKey,
                lamportsBack
            );
            let tx2 = new Transaction();
            tx2.add(ix);
            console.log("sending the transaction to redeem: ---------------------------------------------------------------- ")
            await sendAndConfirmTransaction(
                crankRPC.crankProvider,
                connection,
                tx2
            );
        }

    })

})