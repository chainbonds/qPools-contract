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
const web3_js_1 = require("@solana/web3.js");
const sdk_1 = require("@qpools/sdk");
const marinade_ts_sdk_1 = require("@marinade.finance/marinade-ts-sdk");
const marinade_ts_sdk_2 = require("@marinade.finance/marinade-ts-sdk");
const web3_js_2 = require("@solana/web3.js");
const sdk_2 = require("@qpools/sdk");
const pdas_1 = require("@qpools/sdk/lib/types/account/pdas");
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
    let stableSwapProgramId;
    let currencyMint = sdk_1.MOCK.DEV.SABER_USDC;
    let weights;
    let pool_addresses;
    let USDC_USDT_pubkey;
    let USDC_CASH_pubkey;
    let USDC_TEST_pubkey;
    let wSOL;
    let portfolio;
    let marinade;
    // Do some airdrop before we start the tests ...
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // await connection.requestAirdrop(genericPayer.publicKey, 1e9);
        console.log("swapprogramid");
        stableSwapProgramId = new web3_js_1.PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
        USDC_USDT_pubkey = new web3_js_1.PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        USDC_CASH_pubkey = new web3_js_1.PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA");
        USDC_TEST_pubkey = new web3_js_1.PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x");
        wSOL = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
        // new BN(500), new BN(500)
        weights = [new anchor_1.BN(1000)];
        // , USDC_CASH_pubkey, USDC_TEST_pubkey
        pool_addresses = [USDC_USDT_pubkey];
        portfolio = new Portfolio(connection, provider, solbondProgram, genericPayer);
        const marinadeConfig = new marinade_ts_sdk_1.MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,
        });
        marinade = new marinade_ts_sdk_1.Marinade(marinadeConfig);
    }));
    it("Create all the Associated Token Accounts", () => __awaiter(void 0, void 0, void 0, function* () {
        const marinadeState = yield marinade_ts_sdk_2.MarinadeState.fetch(marinade);
        yield portfolio.createAssociatedTokenAccounts(pool_addresses, genericPayer, provider.wallet, marinadeState);
    }));
    it("create a marinade position and deposit", () => __awaiter(void 0, void 0, void 0, function* () {
        //const weights = [new BN(500), new BN(500), new BN(500)];
        const amount = new anchor_1.BN(1e9);
        // create a portfolio with 1 base currency (sol)
        try {
            const init_sig = yield portfolio.createPortfolioSigned(weights, genericPayer, new anchor_1.BN(1), pool_addresses);
        }
        catch (e) {
            console.log("ERROR");
            console.log("Portfolio account already exists probably");
        }
        // create a wrapped SOL account
        // if ((await connection.getBalance(genericPayer.publicKey)) <= 3e9) {
        //     let tx1 = await connection.requestAirdrop(genericPayer.publicKey, 3e9);
        //     await connection.confirmTransaction(tx1, 'finalized');
        //     console.log("Airdropped 1!");
        // }
        //const associatedToken = await getAssociatedTokenAddress(
        //    NATIVE_MINT,
        //    genericPayer,
        //    false,
        //    TOKEN_PROGRAM_ID,
        //    ASSOCIATED_TOKEN_PROGRAM_ID
        //);
        //const transaction = new Transaction().add(
        //createAssociatedTokenAccountInstruction(
        //    genericPayer.publicKey,
        //    associatedToken,
        //    genericPayer,
        //    NATIVE_MINT,
        //    TOKEN_PROGRAM_ID,
        //    ASSOCIATED_TOKEN_PROGRAM_ID
        //),
        //SystemProgram.transfer({
        //    fromPubkey: payer.publicKey,
        //    toPubkey: associatedToken,
        //    lamports: 2e9,
        //}),
        //createSyncNativeInstruction(associatedToken, TOKEN_PROGRAM_ID)
        //);
        //await sendAndConfirmTransaction(connection, transaction, [payer], );
        //await sendAndConfirmTransaction(connection, transaction, [payer], confirmOptions);
        const wrappedSolAccount = yield (0, utils_1.getAccountForMintAndPDADontCreate)(wSOL, genericPayer.publicKey);
        //const wsolkeypair = Keypair.generate();
        // await createAccount(connection, genericPayer, NATIVE_MINT, genericPayer, wsolkeypair, TOKEN_PROGRAM_ID);
        const givemoney = new web3_js_2.Transaction().add(yield web3_js_2.SystemProgram.transfer({
            fromPubkey: genericPayer.publicKey,
            toPubkey: wrappedSolAccount,
            lamports: 1e9,
        }));
        let sendsig = yield provider.send(givemoney);
        yield provider.connection.confirmTransaction(sendsig);
        console.log("send money from user to portfolio: ", sendsig);
        try {
            const cur_sig = yield portfolio.registerCurrencyInputInPortfolio(genericPayer, amount, wSOL);
        }
        catch (err) {
        }
        // try {
        // const send_sig = await portfolio.transfer_to_portfolio(genericPayer,wSOL, wrappedSolAccount)
        // } catch (err) {}
        // create a single position
        const pos_sig = yield portfolio.approvePositionWeightMarinade(amount, 0, new anchor_1.BN(1000), genericPayer);
        // cpi to marinade
        const marinade_state = yield marinade_ts_sdk_2.MarinadeState.fetch(marinade);
        const marinade_sig = yield portfolio.createPositionMarinade(genericPayer, 0, marinade_state);
        console.log("Create position marinade done", marinade_sig);
        console.log("Marinade position before is: ");
        let [portfolioPda, portfolioBump] = yield (0, pdas_1.getPortfolioPda)(genericPayer.publicKey, portfolio.solbondProgram);
        let portfolioAccountMarinadeBefore = (yield portfolio.solbondProgram.account.portfolioAccount.fetch(portfolioPda));
        console.log("Portfolio Account (before) is: ", portfolioAccountMarinadeBefore);
        let [positionPda, positionBump] = yield (0, pdas_1.getPositionPda)(genericPayer.publicKey, 0, portfolio.solbondProgram);
        let positionAccountMarinadeBefore = (yield portfolio.solbondProgram.account.positionAccountMarinade.fetch(positionPda));
        console.log("Position Account Marinade (before) is: ", positionAccountMarinadeBefore);
        const withdraw_portfolio_sig = yield portfolio.approveWithdrawPortfolio(genericPayer);
        console.log("Withdraw Portfolio Instruction ...", withdraw_portfolio_sig);
        // easy
        const withdraw_marinade_sig = yield portfolio.approveWithdrawToMarinade(genericPayer, 0, marinade_state);
        console.log("Withdraw done", withdraw_marinade_sig);
        let portfolioAccountMarinadeAfter = (yield portfolio.solbondProgram.account.portfolioAccount.fetch(portfolioPda));
        console.log("Portfolio Account (after) is: ", portfolioAccountMarinadeAfter);
        // let positionAccountMarinadeAfter = (await portfolio.solbondProgram.account.positionAccountMarinade.fetch(positionPda)) as PositionAccountMarinade;
        // console.log("Position Account Marinade (after) is: ", positionAccountMarinadeAfter);
        const redeem_portfolio = yield portfolio.transfer_to_user(provider.wallet, wSOL);
        console.log("Redeem portfolio done", redeem_portfolio);
    }));
    /*
    it('create a new portfolio', async() => {
        let total_amount_USDC = new u64(340000);
        let num_positions =1;
        try {
            let sig_create = await portfolio.createPortfolioSigned(weights, genericPayer, num_positions, total_amount_USDC, pool_addresses)
        } catch (e) {

        }

        for (var i = 0; i < num_positions; i++) {
            let amountTokenA = new u64(1200);
            let amountTokenB = new u64(0);
            let minMintAmount = new u64(0);
            let weight = new BN(500);
            try{
                let approve_sig = await portfolio.approvePositionWeightSaber(
                amountTokenA,
                amountTokenB,
                minMintAmount,
                i,
                weight,
                genericPayer
                )
            } catch (e) {

            }
        }
    })
    */
    /*
    it('fulfill a position', async() => {
        const num_positions = 1;
        let total_amount_USDC = new u64(340000);
        try {
            let sigs_rest = await portfolio.transfer_to_portfolio(provider.wallet, total_amount_USDC);

        } catch (e) {

        }

        var i = 0
        let approve_sig = await portfolio.permissionlessFulfillSaber(genericPayer,i)




    })

    it('sign a redeem', async() => {
        let total_amount_USDC = new u64(340000);
        const num_positions = 1;
        let amountTokenA = new u64(1);
        let amountTokenB = new u64(0);
        let minMintAmount = new u64(0);
        let sign_withdraw = await portfolio.signApproveWithdrawToUser(genericPayer,total_amount_USDC)
        var i = 0;
        let approve_sig = await portfolio.signApproveWithdrawAmountSaber(
                genericPayer,
                i,
                minMintAmount,
                amountTokenA
        )




        let approve_sig2 = await portfolio.redeem_single_position_only_one(
                i,
                genericPayer,
        )


    let sigs_rest = await portfolio.transfer_to_user(provider.wallet);


    })
    */
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
