import {BN, Provider} from '@project-serum/anchor';
import {u64} from '@solana/spl-token';
import {Keypair, PublicKey} from "@solana/web3.js";
import {MOCK, NETWORK} from "@qpools/sdk";
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import {MarinadeState} from  '@marinade.finance/marinade-ts-sdk';
import {getSolbondProgram} from "@qpools/sdk";
import {Portfolio} from "@qpools/sdk";
import {getAccountForMintAndPDADontCreate} from "@qpools/sdk/lib/utils";
import {Cluster} from "@qpools/sdk/lib/network";

const SOLANA_START_AMOUNT = 10_000_000_000;

describe('qPools!', () => {

    // Configure the client to use the local cluster.
    const provider = Provider.local("https://api.devnet.solana.com");
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


    })

    it("Create all the Associated Token Accounts", async () => {
        const marinadeConfig = new MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,

        });
        let marinade = new Marinade(marinadeConfig);
        const marinade_state = await MarinadeState.fetch(marinade);
        await portfolio.createAssociatedTokenAccounts(
            pool_addresses,
            genericPayer,
            provider.wallet,
            marinade_state
        )
    })

    it('create a new portfolio', async() => {
        let total_amount_USDC = new u64(340000);
        let num_positions = new BN(1);
        try {
            let sig_create = await portfolio.createPortfolioSigned(weights, genericPayer, num_positions, pool_addresses)
        } catch (e) {
            console.log(e);
            console.log("Error: Portfolio exists already");
        }

        // Could also be duplciate ...

        // TODO: I guess this will also already exist at some point ...
        try {
            const cur_sig = await portfolio.registerCurrencyInputInPortfolio(genericPayer, total_amount_USDC, MOCK.DEV.SABER_USDC);
            console.log("Current sig is: ", cur_sig);
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
                let approve_sig = await portfolio.approvePositionWeightSaber(
                    pool_addresses,
                    amountTokenA,
                    amountTokenB,
                    minMintAmount,
                    i,
                    weight,
                    genericPayer
                )
            } catch (e) {
                console.log("Approving position")
            }
        }
    })

    it('fulfill a position', async() => {
        const num_positions = 1;
        let total_amount_USDC = new u64(340000);
        // Get user's wrapped SOL ATA
        let usdc_ATA = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, genericPayer.publicKey);
        try {
            let sigs_rest = await portfolio.transfer_to_portfolio(genericPayer, MOCK.DEV.SABER_USDC, usdc_ATA);
        } catch (e) {
            console.log(e);
            console.log("Portfolio already exists probably?");
        }

        let i = 0
        let approve_sig = await portfolio.permissionlessFulfillSaber(genericPayer, i);

    })

    it('sign a redeem', async() => {
        let total_amount_USDC = new BN(340_000);
        const num_positions = 1;
        let amountTokenA = new u64(1);
        let amountTokenB = new u64(0);
        let minMintAmount = new u64(0);
        let sign_withdraw = await portfolio.approveWithdrawPortfolio(genericPayer);
        var i = 0;
        // TODO: Gotta check the instruction-heavy or frontend implementation to cleanly deal with poolAddresses
        // TODO: Instead of fetching the pool address, here, fetch it in the underlying function from the devnet sate!
        let approve_sig = await portfolio.signApproveWithdrawAmountSaber(
            genericPayer,
            i,
            minMintAmount,
            amountTokenA
        )

        let approve_sig2 = await portfolio.redeem_single_position_only_one(i, genericPayer)
        let sigs_rest = await portfolio.transfer_to_user(provider.wallet, MOCK.DEV.SABER_USDC);

    })

    /*
    it('simulate sending to portfolio owned account', async () => {
        let amountTokenA = new u64(340000);
        let sig_reg = await portfolio.registerPortfolio(weights, pool_addresses, genericPayer);
        let sigs_rest = await portfolio.transfer_to_portfolio(provider.wallet, amountTokenA);
        let sigs_read = await portfolio.read_from_portfolio(provider.wallet, amountTokenA);

        console.log("🦧 REGISTER PORTFOLIO SIG ", sig_reg.toString())
        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())
        console.log("🦍 TRANSACTION SIG read ", sigs_read.toString())


    })

    it('simulate a portfolio purchase', async () => {

        // first, initialize a portfolio
        let amountTokenA = new u64(1200);
        const amounts = [amountTokenA, amountTokenA, amountTokenA]
        let sig_reg = await portfolio.registerPortfolio(weights, pool_addresses, genericPayer);
        let sigs_rest = await portfolio.create_full_portfolio(weights, amounts, genericPayer);

        console.log("🦧 REGISTER PORTFOLIO SIG ", sig_reg.toString())
        for (let smt of sigs_rest) {
            console.log("🦍 TRANSACTION SIG ", smt.toString())
        }

    })
    */
    /*
    it('read portfolio', async () => {
        let amountTokenA = new u64(1200);
        let sigs_rest = await portfolio.read_from_portfolio(provider.wallet, amountTokenA);

        console.log("ON the count TRANSACTION SIG ", sigs_rest.toString())
    })

    */

    /*


    it('simulate a withdraw one', async () => {

        let amount_token = new u64(1200);
        let amount_lp = new u64(1200);
        let sig_sign_redeem = await portfolio.signRedeemPortfolio(pool_addresses, genericPayer);
        let sigs_rest = await portfolio.redeem_single_position_only_one(0, new BN(500), amount_lp, amount_token, genericPayer);
        console.log("🦍 TRANSACTION SIG REDEEM ", sig_sign_redeem.toString())
        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())

    })


    it('simulate a full portfolio redeem', async () => {

        // first, initialize a portfolio
        let amountTokenA = new u64(120000);
        const amounts = [amountTokenA, amountTokenA, amountTokenA]
        let sig_sign_redeem = await portfolio.signRedeemPortfolio(pool_addresses, genericPayer);
        let sigs_rest = await portfolio.redeem_full_portfolio(weights, amounts, genericPayer);
        console.log("🦍 TRANSACTION SIG REDEEM ", sig_sign_redeem.toString())

        for (let smt of sigs_rest) {
            console.log("🦍 TRANSACTION SIG ", smt.toString())

        }

    })

    it('simulate a redeem to user', async () => {

        let amountTokenA = new u64(3400);
        let sig_sign_redeem = await portfolio.signRedeemPortfolio(pool_addresses, genericPayer);
        let sigs_rest = await portfolio.transfer_to_user(provider.wallet, amountTokenA);
        console.log("🦍 TRANSACTION SIG REDEEM ", sig_sign_redeem.toString())

        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())

    })


    it('2nd try, same things, simulate sending to portfolio owned account', async () => {
        let amountTokenA = new u64(340000);
        let sig_reg = await portfolio.registerPortfolio(weights, pool_addresses, genericPayer);
        let sigs_rest = await portfolio.transfer_to_portfolio(provider.wallet, amountTokenA);

        console.log("🦧 REGISTER PORTFOLIO SIG ", sig_reg.toString())
        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())


    })

    it('2nd try, same things, simulate a portfolio purchase', async () => {

        // first, initialize a portfolio
        let amountTokenA = new u64(1200);
        const amounts = [amountTokenA, amountTokenA, amountTokenA]
        let sig_reg = await portfolio.registerPortfolio(weights, pool_addresses, genericPayer);
        let sigs_rest = await portfolio.create_full_portfolio(weights, amounts, genericPayer);

        console.log("🦧 REGISTER PORTFOLIO SIG ", sig_reg.toString())
        for (let smt of sigs_rest) {
            console.log("🦍 TRANSACTION SIG ", smt.toString())
        }

    })
    */
})
