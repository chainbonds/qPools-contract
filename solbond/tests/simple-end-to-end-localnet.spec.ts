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
import {BN, Provider, web3, workspace} from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {Keypair, PublicKey, Signer} from "@solana/web3.js";
import {getInvariantProgram, MockQPools} from "@qpools/admin-sdk/lib/qpools-admin-sdk/src";
import {assert} from "chai";
import {airdropAdmin, createMint, getSolbondProgram, MOCK, QPoolsUser} from "@qpools/sdk";
import {Network} from "@invariant-labs/sdk";
import {NETWORK} from "@qpools/sdk/lib/cluster";
import {fromFee} from "@invariant-labs/sdk/lib/utils";

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

    const solbondProgram = getSolbondProgram(connection, provider, NETWORK.LOCALNET);
    const invariantProgram = getInvariantProgram(connection, provider, NETWORK.LOCALNET);
    console.log("Invariant Program");
    console.log(invariantProgram.programId.toString());
    console.log("Solbond Program");
    console.log(solbondProgram.programId.toString());

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
        let currencyOwnerBalance = await provider.connection.getBalance(currencyOwner.publicKey)
        assert.equal(traderBalance, 3e9, String(traderBalance));
        assert.equal(liquidityProviderBalance, 3e9, String(liquidityProviderBalance));
        assert.ok(currencyOwnerBalance >= 3e9, String(currencyOwnerBalance));
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
            Network.LOCAL, genericWallet,
            invariantProgram.programId
        )

        // TODO: I need to modify the feeTier, because for some reason, the one on devnet does not work when running locally!
        market.feeTier = {
            fee: fromFee(new BN(40)),
            tickSpacing: 10
        }
    })

    // Some of these we don't have to do in devnet, so we leave this out
    /** Create tokens */
    it("#createTradedToken()", async () => {
        await market.createTokens(NUMBER_POOLS, currencyOwner);
    })
    /** Create Pairs */
    it("#createTradePairs()", async () => {
        // Create 10 pools, one for each pair
        await market.createPairs();
    })
    // /** Create state */
    it('#createState()', async () => {
        await market.createState(genericPayer);
        const state = await market.mockMarket.getState()
        const { bump } = await market.mockMarket.getStateAddress()
        const { programAuthority, nonce } = await market.mockMarket.getProgramAuthority()

        assert.ok(state.admin.equals(genericPayer.publicKey))
        assert.ok(state.authority.equals(programAuthority))
        assert.ok(state.nonce === nonce)
        assert.ok(state.bump === bump)
    })


    /** Create Trade Pairs */
    it("#createFeeTier()", async () => {
        await market.createFeeTier(genericPayer);
    })

    /** Create Markets */
    it("#createMarketsFromPairs()", async () => {
        // Get network and wallet from the adapter somewhere
        await market.creatMarketsFromPairs(genericPayer);
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

    it("#solbondHealthCheckpoint()", async () => {
        // Call the health-checkpoint
        await solbondProgram.rpc.healthcheck({
            accounts: {
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                clock: web3.SYSVAR_CLOCK_PUBKEY,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID
            }
        });
    })

    /** Create the QPT Reserve Object, which covers data such as currencyMint, QPTMint, etc. */
    it("initializeQPTReserve()", async () => {
        await market.initializeQPTReserve();
        let result = await market.loadExistingQPTReserve();
        if (!result) {
            throw Error("QPT Reserve must be initialized first!");
        }
    })

    // TODO: The above function doesn't create position lists, nor positions. Do we require these?
    /** Create a position list to keep track of all positions */
    it("#createPositionList()", async () => {
        // Get the data for the createPool list
        // Will probably have to load the existing QPT Reserve (if any exists...)
        await market.createPositionList()
    });

    let qpools: QPoolsUser;
    /** Purchase some bonds, this means that the currency is paid into the reserve */
    it("#buyQPT()", async () => {
        // As a new, third-party user (A), (A) wants to buy QPT!
        // // Create the QPools Object
        console.log("Creating QPoolsUser");
        qpools = new QPoolsUser(
            provider,
            connection,
            market.currencyMint
        );
        console.log("Registering Account");
        // TODO: Gotta load QPT Reserves first.
        // Async inside sync sucks
        await qpools.loadExistingQPTReserve(currencyMint.publicKey);
        await qpools.registerAccount();
        // console.log("Loading etc..")
        // console.log("Loading QPT Reserve Currency pubkey", currencyMint);
        // console.log("Loading QPT Reserve Currency pubkey", currencyMint.publicKey);
        // console.log("Loading QPT Reserve (2) Currency pubkey", currencyMint.publicKey);
        let airdropBuyAmount = new BN(2).pow(new BN(50)).subn(1).toNumber();
        // console.log("(Currency Mint PK) airdropping is: ", currencyMint.publicKey.toString())
        await currencyMint.mintTo(qpools.purchaserCurrencyAccount, currencyOwner.publicKey, [currencyOwner as Signer], airdropBuyAmount);
        await qpools.buyQPT(airdropBuyAmount);
    })

    /** Swap some of the currency against some token items */
    it("swapReserveToAllPairs()", async() => {
        console.log("Currency has: ", (await currencyMint.getAccountInfo(qpools.purchaserCurrencyAccount)).amount.toString());
        await market.swapReserveToAllAssetPairs(100);
    })

    // Gotta airdrop some currency
    /** Create a liquidity-providing position */
    it("#createLiquidityPosition()", async () => {
        await market.createPositions()
    });

    /** Claim the fees that were accumulated from trades */
    it("#collectFeesFromInvariant()", async () => {
        await market.claimFee()
    });

    // Finally, close positions
    it("#closePosition()", async() => {
        await market.closePosition()
    })

    // And I guess the same person should close the position now

})