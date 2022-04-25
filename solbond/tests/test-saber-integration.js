"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const sdk_1 = require("@qpools/sdk");
const marinade_ts_sdk_1 = require("@marinade.finance/marinade-ts-sdk");
const marinade_ts_sdk_2 = require("@marinade.finance/marinade-ts-sdk");
const sdk_2 = require("@qpools/sdk");
const utils_1 = require("@qpools/sdk/lib/utils");
const network_1 = require("@qpools/sdk/lib/network");
const SOLANA_START_AMOUNT = 10000000000;
describe('qPools!', () => {
    // Configure the client to use the local cluster.
    const provider = anchor_1.Provider.local(process.env.NEXT_PUBLIC_CLUSTER_URL);
    //anchor.setProvider(provider);
    const connection = provider.connection;
    const solbondProgram = (0, sdk_2.getSolbondProgram)(connection, provider, network_1.Cluster.DEVNET);
    const payer = web3_js_1.Keypair.generate();
    // @ts-expect-error
    const genericPayer = provider.wallet.payer;
    // const genericPayer = payer;
    let stableSwapProgramId;
    let currencyMint = sdk_1.MOCK.DEV.SABER_USDC;
    let weights;
    let pool_addresses;
    let USDC_USDT_pubkey;
    let USDC_CASH_pubkey;
    let USDC_TEST_pubkey;
    // let wSOL_pubkey: PublicKey;
    let portfolio;
    // Do some airdrop before we start the tests ...
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // await connection.requestAirdrop(genericPayer.publicKey, 1e9);
        console.log("swapprogramid");
        stableSwapProgramId = new web3_js_1.PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
        USDC_USDT_pubkey = new web3_js_1.PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        USDC_CASH_pubkey = new web3_js_1.PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA");
        USDC_TEST_pubkey = new web3_js_1.PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x");
        // wSOL_pubkey = new PublicKey("So11111111111111111111111111111111111111112");
        weights = [new anchor_1.BN(1000)];
        pool_addresses = [USDC_USDT_pubkey];
        portfolio = new Portfolio(connection, provider, solbondProgram, genericPayer);
    }));
    it("Create all the Associated Token Accounts", () => __awaiter(void 0, void 0, void 0, function* () {
        const marinadeConfig = new marinade_ts_sdk_1.MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,
        });
        let marinade = new marinade_ts_sdk_1.Marinade(marinadeConfig);
        const marinade_state = yield marinade_ts_sdk_2.MarinadeState.fetch(marinade);
        yield portfolio.createAssociatedTokenAccounts(pool_addresses, genericPayer, provider.wallet, marinade_state);
    }));
    it('create a new portfolio', () => __awaiter(void 0, void 0, void 0, function* () {
        let total_amount_USDC = new spl_token_1.u64(340000);
        let num_positions = new anchor_1.BN(1);
        try {
            let sig_create = yield portfolio.createPortfolioSigned(weights, genericPayer, num_positions, pool_addresses);
        }
        catch (e) {
            console.log(e);
            console.log("Error: Portfolio exists already");
        }
        // Could also be duplciate ...
        // TODO: I guess this will also already exist at some point ...
        try {
            const cur_sig = yield portfolio.registerCurrencyInputInPortfolio(genericPayer, total_amount_USDC, sdk_1.MOCK.DEV.SABER_USDC);
            console.log("Current sig is: ", cur_sig);
        }
        catch (e) {
            console.log(e);
            console.log("Error: Currency mint already exists");
        }
        // Only do this for the first position ...
        for (let i = 0; i < num_positions.toNumber(); i++) {
            // Get state, and according to state, do this ...
            // Gotta double check which one corresponds to the currency ...
            // if (MOCK.DEV.SABER_USDC)
            let amountTokenA = new spl_token_1.u64(1200);
            // let amountTokenA = new u64(0);
            // let amountTokenB = new u64(1200);
            let amountTokenB = new spl_token_1.u64(0);
            let minMintAmount = new spl_token_1.u64(0);
            let weight = new anchor_1.BN(1000);
            try {
                let approve_sig = yield portfolio.approvePositionWeightSaber(pool_addresses, amountTokenA, amountTokenB, minMintAmount, i, weight, genericPayer);
            }
            catch (e) {
                console.log("Approving position");
            }
        }
    }));
    it('fulfill a position', () => __awaiter(void 0, void 0, void 0, function* () {
        const num_positions = 1;
        let total_amount_USDC = new spl_token_1.u64(340000);
        // Get user's wrapped SOL ATA
        let usdc_ATA = yield (0, utils_1.getAccountForMintAndPDADontCreate)(sdk_1.MOCK.DEV.SABER_USDC, genericPayer.publicKey);
        try {
            let sigs_rest = yield portfolio.transfer_to_portfolio(genericPayer, sdk_1.MOCK.DEV.SABER_USDC, usdc_ATA);
        }
        catch (e) {
            console.log(e);
            console.log("Portfolio already exists probably?");
        }
        let i = 0;
        let approve_sig = yield portfolio.permissionlessFulfillSaber(genericPayer, i);
    }));
    it('sign a redeem', () => __awaiter(void 0, void 0, void 0, function* () {
        let total_amount_USDC = new anchor_1.BN(340000);
        const num_positions = 1;
        let amountTokenA = new spl_token_1.u64(1);
        let amountTokenB = new spl_token_1.u64(0);
        let minMintAmount = new spl_token_1.u64(0);
        let sign_withdraw = yield portfolio.approveWithdrawPortfolio(genericPayer);
        var i = 0;
        // TODO: Gotta check the instruction-heavy or frontend implementation to cleanly deal with poolAddresses
        // TODO: Instead of fetching the pool address, here, fetch it in the underlying function from the devnet sate!
        let approve_sig = yield portfolio.signApproveWithdrawAmountSaber(genericPayer, i, minMintAmount, amountTokenA);
        let approve_sig2 = yield portfolio.redeem_single_position_only_one(i, genericPayer);
        let sigs_rest = yield portfolio.transfer_to_user(provider.wallet, sdk_1.MOCK.DEV.SABER_USDC);
    }));
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
});
