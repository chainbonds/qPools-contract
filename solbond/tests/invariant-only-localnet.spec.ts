/**
 * Test to test all functionality of the invariant program that we have here
 *
 * This includes the following functionality in this order
 * - create pool
 * - provide liquidity
 * - make a trade as a third party
 * - claim fees
 * - close position
 */

import * as anchor from '@project-serum/anchor';
import {BN, Provider, workspace} from "@project-serum/anchor";
import {Token} from "@solana/spl-token";
import {Keypair, PublicKey} from "@solana/web3.js";
import {getInvariantProgram, MockQPools} from "@qpools/admin-sdk/lib/qpools-admin-sdk/src";
import {assert} from "chai";
import {airdropAdmin, createMint, getSolbondProgram, MOCK} from "@qpools/sdk";
import {Network} from "@invariant-labs/sdk";

const NUMBER_POOLS = 1;

describe('invariant-localnet', () => {

    // Get connection and provider
    const provider = Provider.local();
    const connection = provider.connection;

    // @ts-expect-error
    const genericPayer = provider.wallet.payer as Keypair;
    const genericWallet = provider.wallet;

    // Generate the users
    const trader = Keypair.generate();
    const liquidityProvider = Keypair.generate();
    const currencyOwner = airdropAdmin;

    const solbondProgram = getSolbondProgram(connection, provider);
    const invariantProgram = getInvariantProgram(connection, provider);
    console.log("Invariant Program");
    console.log(invariantProgram.programId.toString());

    let market: MockQPools;
    let currencyMint: Token;

    /** Get a bunch of airdrops to pay for transactions */
    before(async () => {
        // Request airdrops for all accounts that will be active
        let tx1 = await connection.requestAirdrop(trader.publicKey, 3e9);
        await connection.confirmTransaction(tx1);
        let tx2 = await connection.requestAirdrop(liquidityProvider.publicKey, 3e9);
        await connection.confirmTransaction(tx2);
        let tx3 = await connection.requestAirdrop(currencyOwner.publicKey, 3e9);
        await connection.confirmTransaction(tx3);

        let traderBalance = await provider.connection.getBalance(trader.publicKey)
        let liquidityProviderBalance = await provider.connection.getBalance(liquidityProvider.publicKey)
        let currencyOwnerBalance = await provider.connection.getBalance(liquidityProvider.publicKey)
        assert.equal(traderBalance, 3e9, String(traderBalance));
        assert.equal(liquidityProviderBalance, 3e9, String(liquidityProviderBalance));
        assert.equal(currencyOwnerBalance, 3e9, String(currencyOwnerBalance));
    })

    /** Assign the currency mint */
    it("#createCurrencyMint", async () => {
        assert.ok(solbondProgram.programId, String(solbondProgram.programId));
        assert.ok(invariantProgram.programId, String(invariantProgram.programId));
        // Take the currency mint from the user SDK
        // I guess the currency mint has to be created from scratch. In testnet, this currency-mint does not exist!
        // currencyMint = new Token(connection, MOCK.SOL, solbondProgram.programId, currencyOwner);
        // assert.ok(currencyMint.publicKey.equals(MOCK.SOL), currencyMint.publicKey.toString());
        currencyMint = await createMint(provider, currencyOwner, currencyOwner.publicKey, 9);
    })

    /** Initialize a mock market object*/
    it('#initializeMockMarket()', async () => {
        market = new MockQPools(
            connection,
            provider,
            currencyMint.publicKey
        );
        await market.createMockMarket(
            Network.LOCAL,
            genericWallet,
            invariantProgram.programId
        )
    })

    // Some of these we don't have to do in devnet, so we leave this out
    /** Create tokens */
    it("#createTradedToken()", async () => {
        await market.createTokens(NUMBER_POOLS, currencyOwner);
    })
    /** Create state */
    it('#createState()', async () => {
        await market.createState(genericPayer);
    })
    /** Create Trade Pairs */
    it("#createFeeTier()", async () => {
        await market.createFeeTier(genericPayer);
    })
    /** Create Pairs */
    it("#createTradePairs()", async () => {
        // Create 10 pools, one for each pair
        await market.createPairs();
    })
    /** Create Markets */
    it("#createMarketsFromPairs()", async () => {
        // Get network and wallet from the adapter somewhere
        await market.creatMarketsFromPairs(genericPayer)
    })

    /** Provide third party liquidity to markets */
    it("#provideThirdPartyLiquidity()", async () => {
        console.log("Before amount");
        let liquidityProvidingAmount = new BN(2).pow(new BN(63)).subn(1);
        console.log("Liquidity providing amount is: ", liquidityProvidingAmount.toString());
        await market.provideThirdPartyLiquidityToAllPairs(
            liquidityProvider,
            currencyOwner,
            liquidityProvidingAmount
        )
    })

    // TODO: The above function doesn't create position lists, nor positions. Do we require these?
    /** Create a position list to keep track of all positions */
    // it("#createPositionList()", async () => {
    //     // Get the data for the createPool list
    //     console.log("First market position is..");
    //     await market.createPositionList()
    // });
    // /** Create a liquidity-providing position */
    // it("#createPositionList()", async () => {
    //     await market.createPositions()
    // });

    // I guess one person should claim the fees now

    // And I guess the same person should close the position now

})