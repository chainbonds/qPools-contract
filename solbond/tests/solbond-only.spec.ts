import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {Solbond} from '../target/types/solbond';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {Keypair, PublicKey} from "@solana/web3.js";
import {WalletI} from "easy-spl";
import {QPoolsAdmin} from "@qpools/sdk/lib/qpools-admin-sdk/src";
import {createToken} from "../deps/protocol/tests/testUtils";
import {QPoolsUser} from "../../qpools-sdk/src";
import {Key} from "readline";
const {
    ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const SOLANA_START_AMOUNT = 10_000_000_000;
const CURRENCY_TOKEN_START_AMOUNT = 7_000_000_000;
const CURRENCY_TOKEN_PAYIN_AMOUNT = 5_000_000_000;
const RESERVE_INCREASE_PHASE_1 = 10_000_000_000;
const RESERVE_INCREASE_PHASE_2 = 13_000_000_000;
const REDEEM_AMOUNT_TOKENS_PHASE_1 = 1_000_000_000;

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('solbond', () => {

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solbond as Program<Solbond>;
    const payer = Keypair.generate();
    let mintAuthority: Keypair = Keypair.generate();
    let currencyMint: Token | null = null;
    let qPoolsAdminTool: QPoolsAdmin;

    // Do some airdrop before we start the tests ...
    it('#createStateOfTheWorld', async () => {

        const tx0 = await provider.connection.requestAirdrop(payer.publicKey, SOLANA_START_AMOUNT);
        await provider.connection.confirmTransaction(tx0);
        let tx1 = await provider.connection.requestAirdrop(payer.publicKey, SOLANA_START_AMOUNT);
        await provider.connection.confirmTransaction(tx1);
        let tx2 = await provider.connection.requestAirdrop(mintAuthority.publicKey, SOLANA_START_AMOUNT);
        await provider.connection.confirmTransaction(tx2);
        currencyMint = await createToken(provider.connection, mintAuthority, mintAuthority);
        console.log("Currency mint token is: ", currencyMint);
        qPoolsAdminTool = new QPoolsAdmin(
            provider.connection,
            provider,
            currencyMint.publicKey
        );

    });

    // Initialize the bond
    it('#initializeBondPool()', async () => {
        await qPoolsAdminTool.initializeQPTReserve();
    });

    let purchaser: WalletI | null = provider.wallet;
    let qPoolsUserTool: QPoolsUser;

    it("#createUserObject()", async () => {

        qPoolsUserTool = new QPoolsUser(
            provider,
            provider.connection,
            currencyMint
        );
    });

    // Make a purchase of the bond / staking
    it('run function: purchaseBond', async () => {
        console.log("Purchasing bond...");

        // Do some currency airdrop
        await qPoolsUserTool.registerAccount();
        await currencyMint.mintTo(qPoolsUserTool.purchaserCurrencyAccount, mintAuthority, [mintAuthority], CURRENCY_TOKEN_START_AMOUNT);
        // await delay(1_000);

        // BEGIN Some statistics BEFORE
        console.log("Initial and final are: ");
        const redeemableAmount_0 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsAdminTool.qPoolQPAccount)).amount);
        console.log("Initial Redeemable Amount", redeemableAmount_0.toString());
        const currencyAmount_0 = new BN((await currencyMint.getAccountInfo(qPoolsAdminTool.qPoolCurrencyAccount)).amount)
        console.log("Initial Token Amount", currencyAmount_0.toString());
        const payerSolAmount_0: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        console.log("Initial Payer Sol Amount", payerSolAmount_0.toString());
        const payerTokenAmount_0 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsUserTool.purchaserQPTAccount)).amount);
        console.log("Initial Payer Token Amount", payerTokenAmount_0.toString());
        const payerCurrencyAmount_0 = new BN((await currencyMint.getAccountInfo(qPoolsUserTool.purchaserCurrencyAccount)).amount);
        console.log("Initial Payer Currency Amount", payerCurrencyAmount_0.toString());
        // END Some statistics BEFORE

        await qPoolsUserTool.buyQPT(payerCurrencyAmount_0.toNumber());

        // BEGIN Some statistics AFTER
        const redeemableAmount_1 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsAdminTool.qPoolQPAccount)).amount);
        console.log("Final Redeemable Amount", redeemableAmount_1.toString());
        const currencyAmount_1 = new BN((await currencyMint.getAccountInfo(qPoolsAdminTool.qPoolCurrencyAccount)).amount)
        console.log("Final Token Amount", currencyAmount_1.toString());
        const payerSolAmount_1: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        console.log("Final Payer Sol Amount", payerSolAmount_1.toString());
        const payerTokenAmount_1 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsUserTool.purchaserQPTAccount)).amount);
        console.log("Final Payer Token Amount", payerTokenAmount_1.toString());
        const payerCurrencyAmount_1 = new BN((await currencyMint.getAccountInfo(qPoolsUserTool.purchaserCurrencyAccount)).amount);
        console.log("Final Payer Currency Amount", payerCurrencyAmount_1.toString());
        // END Some statistics AFTER

    });

    // Redeem part of the bond, and simulate that the bond has generated yields
    it('#redeemBondInstance(1)', async () => {
        console.log("Redeeming bond...");

        // Simulate as if we have generated returns
        await provider.connection.requestAirdrop(qPoolsAdminTool.qPoolCurrencyAccount, RESERVE_INCREASE_PHASE_1);

        // BEGIN Some statistics BEFORE
        const redeemableAmount_3 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsAdminTool.qPoolQPAccount)).amount);
        console.log("Initial Redeemable Amount", redeemableAmount_3.toString());
        const currencyAmount_3 = new BN((await currencyMint.getAccountInfo(qPoolsAdminTool.qPoolCurrencyAccount)).amount)
        console.log("Initial Token Amount", currencyAmount_3.toString());
        const payerSolAmount_3: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        console.log("Initial Payer Sol Amount", payerSolAmount_3.toString());
        const payerTokenAmount_3 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsUserTool.purchaserQPTAccount)).amount);
        console.log("Initial Payer Token Amount", payerTokenAmount_3.toString());
        const payerCurrencyAmount_3 = new BN((await currencyMint.getAccountInfo(qPoolsUserTool.purchaserCurrencyAccount)).amount);
        console.log("Initial Payer Currency Amount", payerCurrencyAmount_3.toString());
        // END Some statistics AFTER

        await qPoolsUserTool.redeemQPT(payerTokenAmount_3.toNumber() / 2);

        // BEGIN Some statistics BEFORE
        const redeemableAmount_4 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsAdminTool.qPoolQPAccount)).amount);
        console.log("Final Redeemable Amount", redeemableAmount_4.toString());
        const currencyAmount_4 = new BN((await currencyMint.getAccountInfo(qPoolsAdminTool.qPoolCurrencyAccount)).amount)
        console.log("Final Token Amount", currencyAmount_4.toString());
        const payerSolAmount_4: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        console.log("Final Payer Sol Amount", payerSolAmount_4.toString());
        const payerTokenAmount_4 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsUserTool.purchaserQPTAccount)).amount);
        console.log("Final Payer Token Amount", payerTokenAmount_4.toString());
        const payerCurrencyAmount_4 = new BN((await currencyMint.getAccountInfo(qPoolsUserTool.purchaserCurrencyAccount)).amount);
        console.log("Final Payer Currency Amount", payerCurrencyAmount_4.toString());
        // END Some statistics BEGIN
    });

    it('#redeemBondInstance(2)', async () => {
        console.log("Redeeming bond...");

        // Simulate as if we have generated returns
        await provider.connection.requestAirdrop(qPoolsAdminTool.qPoolCurrencyAccount, RESERVE_INCREASE_PHASE_1);

        // BEGIN Some statistics BEFORE
        const redeemableAmount_5 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsAdminTool.qPoolQPAccount)).amount);
        console.log("Initial Redeemable Amount", redeemableAmount_5.toString());
        const currencyAmount_5 = new BN((await currencyMint.getAccountInfo(qPoolsAdminTool.qPoolCurrencyAccount)).amount)
        console.log("Initial Token Amount", currencyAmount_5.toString());
        const payerSolAmount_5: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        console.log("Initial Payer Sol Amount", payerSolAmount_5.toString());
        const payerTokenAmount_5 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsUserTool.purchaserQPTAccount)).amount);
        console.log("Initial Payer Token Amount", payerTokenAmount_5.toString());
        const payerCurrencyAmount_5 = new BN((await currencyMint.getAccountInfo(qPoolsUserTool.purchaserCurrencyAccount)).amount);
        console.log("Initial Payer Currency Amount", payerCurrencyAmount_5.toString());
        // END Some statistics AFTER

        await qPoolsUserTool.redeemQPT(payerTokenAmount_5.toNumber());

        // BEGIN Some statistics BEFORE
        const redeemableAmount_6 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsAdminTool.qPoolQPAccount)).amount);
        console.log("Final Redeemable Amount", redeemableAmount_6.toString());
        const currencyAmount_6 = new BN((await currencyMint.getAccountInfo(qPoolsAdminTool.qPoolCurrencyAccount)).amount)
        console.log("Final Token Amount", currencyAmount_6.toString());
        const payerSolAmount_6: BN = new BN(String(await provider.connection.getBalance(payer.publicKey)));
        console.log("Final Payer Sol Amount", payerSolAmount_6.toString());
        const payerTokenAmount_6 = new BN((await qPoolsAdminTool.QPTokenMint.getAccountInfo(qPoolsUserTool.purchaserQPTAccount)).amount);
        console.log("Final Payer Token Amount", payerTokenAmount_6.toString());
        const payerCurrencyAmount_6 = new BN((await currencyMint.getAccountInfo(qPoolsUserTool.purchaserCurrencyAccount)).amount);
        console.log("Final Payer Currency Amount", payerCurrencyAmount_6.toString());
        // END Some statistics BEGIN

    });

});
