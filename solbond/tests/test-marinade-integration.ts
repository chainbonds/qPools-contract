import {BN, Provider} from '@project-serum/anchor';
import {Keypair, PublicKey} from "@solana/web3.js";
import {MOCK, PortfolioAccount} from "@qpools/sdk";
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk'
import {MarinadeState} from  '@marinade.finance/marinade-ts-sdk'
import {
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import {
    getSolbondProgram,
} from "@qpools/sdk";
import {getPortfolioPda, getPositionPda, getUserCurrencyPda} from "@qpools/sdk/lib/types/account/pdas";
import {getAccountForMintAndPDADontCreate} from "@qpools/sdk/lib/utils";
import {PositionAccountMarinade} from "@qpools/sdk/lib/types/account/positionAccountMarinade";
import {Cluster} from "@qpools/sdk/lib/network";

const SOLANA_START_AMOUNT = 10_000_000_000;

describe('qPools!', () => {

    // Configure the client to use the local cluster.
    const provider = Provider.local(process.env.NEXT_PUBLIC_CLUSTER_URL);
    //anchor.setProvider(provider);
    const connection = provider.connection;
    const solbondProgram = getSolbondProgram(connection, provider, Cluster.DEVNET);

    const payer = Keypair.generate();
    // @ts-expect-error
    const genericPayer = provider.wallet.payer as Keypair;
    let stableSwapProgramId: PublicKey;

    let currencyMint: PublicKey = MOCK.DEV.SABER_USDC;
    let weights: Array<BN>;
    let pool_addresses: Array<PublicKey>;
    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;
    let wSOL: PublicKey;
    let portfolio;
    let marinade;

    // Do some airdrop before we start the tests ...
    before(async () => {

        // await connection.requestAirdrop(genericPayer.publicKey, 1e9);
        console.log("swapprogramid");
        stableSwapProgramId = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        USDC_CASH_pubkey = new PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA");
        USDC_TEST_pubkey = new PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x");
        wSOL = new PublicKey("So11111111111111111111111111111111111111112");

        // new BN(500), new BN(500)
        weights = [new BN(1000)];
        // , USDC_CASH_pubkey, USDC_TEST_pubkey
        pool_addresses = [USDC_USDT_pubkey];

        portfolio = new Portfolio(connection, provider, solbondProgram, genericPayer);

        const marinadeConfig = new MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,
        });
        marinade = new Marinade(marinadeConfig);


    })
    it("Create all the Associated Token Accounts", async () => {
        const marinadeState = await MarinadeState.fetch(marinade);
        await portfolio.createAssociatedTokenAccounts(
            pool_addresses,
            genericPayer,
            provider.wallet,
            marinadeState
        )
    })

    it("create a marinade position and deposit", async () => {
        //const weights = [new BN(500), new BN(500), new BN(500)];
        const amount = new BN(1e9);
        // create a portfolio with 1 base currency (sol)
        try {
            const init_sig = await portfolio.createPortfolioSigned(
                weights,
                genericPayer,
                new BN(1),
                pool_addresses
            )
        } catch (e) {
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


        const wrappedSolAccount = await getAccountForMintAndPDADontCreate(wSOL, genericPayer.publicKey);
        //const wsolkeypair = Keypair.generate();
        // await createAccount(connection, genericPayer, NATIVE_MINT, genericPayer, wsolkeypair, TOKEN_PROGRAM_ID);

        const givemoney = new Transaction().add(await SystemProgram.transfer({
                fromPubkey: genericPayer.publicKey,
                toPubkey: wrappedSolAccount,
                lamports: 1e9,
            }),
            // createSyncNativeInstruction(wrappedSolAccount)
        )
        let sendsig = await provider.send(givemoney)
        await provider.connection.confirmTransaction(sendsig);
        console.log("send money from user to portfolio: ", sendsig);

        try {
            const cur_sig = await portfolio.registerCurrencyInputInPortfolio(genericPayer, amount, wSOL);
        } catch (err) {

        }

        // try {
        // const send_sig = await portfolio.transfer_to_portfolio(genericPayer,wSOL, wrappedSolAccount)
        // } catch (err) {}
        // create a single position

        const pos_sig = await portfolio.approvePositionWeightMarinade(
            amount,
            0,
            new BN(1000),
            genericPayer
        )


        // cpi to marinade
        const marinade_state = await MarinadeState.fetch(marinade)
        const marinade_sig = await portfolio.createPositionMarinade(
            genericPayer,
            0,
            marinade_state
        );
        console.log("Create position marinade done", marinade_sig);

        console.log("Marinade position before is: ");
        let [portfolioPda, portfolioBump] = await getPortfolioPda(genericPayer.publicKey, portfolio.solbondProgram);
        let portfolioAccountMarinadeBefore = (await portfolio.solbondProgram.account.portfolioAccount.fetch(portfolioPda)) as PortfolioAccount;
        console.log("Portfolio Account (before) is: ", portfolioAccountMarinadeBefore);
        let [positionPda, positionBump] = await getPositionPda(genericPayer.publicKey, 0, portfolio.solbondProgram);
        let positionAccountMarinadeBefore = (await portfolio.solbondProgram.account.positionAccountMarinade.fetch(positionPda)) as PositionAccountMarinade;
        console.log("Position Account Marinade (before) is: ", positionAccountMarinadeBefore);

        const withdraw_portfolio_sig = await portfolio.approveWithdrawPortfolio(genericPayer);
        console.log("Withdraw Portfolio Instruction ...", withdraw_portfolio_sig);

        // easy
        const withdraw_marinade_sig = await portfolio.approveWithdrawToMarinade(
            genericPayer,
            0,
            marinade_state
        );
        console.log("Withdraw done", withdraw_marinade_sig);

        let portfolioAccountMarinadeAfter = (await portfolio.solbondProgram.account.portfolioAccount.fetch(portfolioPda)) as PortfolioAccount;
        console.log("Portfolio Account (after) is: ", portfolioAccountMarinadeAfter);
        // let positionAccountMarinadeAfter = (await portfolio.solbondProgram.account.positionAccountMarinade.fetch(positionPda)) as PositionAccountMarinade;
        // console.log("Position Account Marinade (after) is: ", positionAccountMarinadeAfter);

        const redeem_portfolio = await portfolio.transfer_to_user(provider.wallet, wSOL);
        console.log("Redeem portfolio done", redeem_portfolio);

    })

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
})
