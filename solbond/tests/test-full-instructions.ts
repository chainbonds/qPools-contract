import * as anchor from '@project-serum/anchor';
import {BN, Program, web3, Provider} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {Keypair, PublicKey, SYSVAR_RENT_PUBKEY, Transaction} from "@solana/web3.js";
import {createToken} from "@qpools/admin-sdk/lib/invariant-utils";
import {assert} from "chai";
import * as spl from 'easy-spl'
import {
    createAssociatedTokenAccountUnsigned,
    getAssociatedTokenAddressOffCurve,
} from "@qpools/sdk";
import {NETWORK} from "@qpools/sdk/lib/cluster";

import {
    createMint,
    getSolbondProgram,
} from "@qpools/sdk";
import {
    StableSwap,
    findSwapAuthorityKey,
  } from "@saberhq/stableswap-sdk";
import provider from '@project-serum/anchor/dist/cjs/provider';
import {SaberInteractTool} from "@qpools/sdk/lib/saber-cpi-endpoints";
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

    let stableSwapAccount : Keypair;
    //stableSwapAccount=   Keypair.generate();
    let stableSwapProgramId: PublicKey;


    let weights: Array<BN>;
    let pool_addresses: Array<PublicKey>;
    let USDC_USDT_pubkey: PublicKey;
    let USDC_CASH_pubkey: PublicKey;
    let USDC_TEST_pubkey: PublicKey;
    let portfolio: Portfolio;

    let saberInteractTool: SaberInteractTool;
    // Do some airdrop before we start the tests ...
    before(async () => {
        console.log("swapprogramid")
        stableSwapProgramId = new PublicKey(
            "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"
        );
        stableSwapAccount = Keypair.generate()
        USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        USDC_CASH_pubkey =  new PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA")
        USDC_TEST_pubkey =  new PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x")
        
        weights = [new BN(500), new BN(500), new BN(500)];
        pool_addresses = [USDC_USDT_pubkey, USDC_CASH_pubkey, USDC_TEST_pubkey];
        
        saberInteractTool = new SaberInteractTool(connection, provider, solbondProgram, genericPayer);
        portfolio = new Portfolio(connection, provider, solbondProgram, genericPayer);


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

    it('simulate a full portfolio redeem', async () => {

        // first, initialize a portfolio
        let amountTokenA = new u64(100);
        const amounts = [amountTokenA, amountTokenA, amountTokenA]
        let sigs_rest = await portfolio.redeem_full_portfolio(weights, amounts, genericPayer);

        for (let smt of sigs_rest) {
            console.log("🦍 TRANSACTION SIG ", smt.toString())

        }

    })

})
