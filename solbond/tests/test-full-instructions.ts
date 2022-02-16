import {BN, Provider} from '@project-serum/anchor';
import {u64} from '@solana/spl-token';
import {Keypair, PublicKey} from "@solana/web3.js";

import {NETWORK} from "@qpools/sdk/lib/cluster";

import {
    getSolbondProgram,
} from "@qpools/sdk";


import {Portfolio} from "@qpools/sdk/lib/register-portfolio";
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
    // const genericPayer = payer;

    let stableSwapProgramId: PublicKey;


    let weights: Array<BN>;
    let pool_addresses: Array<PublicKey>;
    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;
    let portfolio: Portfolio;

    // Do some airdrop before we start the tests ...
    before(async () => {

        // await connection.requestAirdrop(genericPayer.publicKey, 1e9);

        console.log("swapprogramid");
        stableSwapProgramId = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        USDC_CASH_pubkey = new PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA");
        USDC_TEST_pubkey = new PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x");

        weights = [new BN(500), new BN(500), new BN(500)];
        pool_addresses = [USDC_USDT_pubkey, USDC_CASH_pubkey, USDC_TEST_pubkey];
        
        portfolio = new Portfolio(connection, provider, solbondProgram, genericPayer);


    })

    it('simulate sending to portfolio owned account', async () => {
        let amountTokenA = new u64(340000);
        let sig_reg = await portfolio.registerPortfolio(weights, pool_addresses, genericPayer);
        let sigs_rest = await portfolio.transfer_to_portfolio(provider.wallet, amountTokenA);

        console.log("🦧 REGISTER PORTFOLIO SIG ", sig_reg.toString())
        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())


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


    /*it('simulate a redeem to user', async () => {

        let amountTokenA = new u64(3400);
        let sigs_rest = await portfolio.transfer_to_user(provider.wallet, amountTokenA);

        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())

    })*/


    it('simulate a withdraw one', async () => {

        let amount_token = new u64(300);
        let amount_lp = new u64(3400);

        let sigs_rest = await portfolio.redeem_single_position_only_one(0, new BN(500), amount_lp, amount_token, genericPayer);

        console.log("🦍 TRANSACTION SIG ", sigs_rest.toString())

    })


    /*it('simulate a full portfolio redeem', async () => {

        // first, initialize a portfolio
        let amountTokenA = new u64(100);
        const amounts = [amountTokenA, amountTokenA, amountTokenA]
        let sigs_rest = await portfolio.redeem_full_portfolio(weights, amounts, genericPayer);

        for (let smt of sigs_rest) {
            console.log("🦍 TRANSACTION SIG ", smt.toString())

        }

    })*/

})
