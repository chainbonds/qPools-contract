/**
 * Test to test all functionality of the invariant program that we have here
 *
 * This includes the following functionality in this order
 * - create pool
 * - provide liquidity
 * - make a trade as a third party
 * - claim fees
 * - close position
 *
 * Some functionality will deviate between devnet and localnet, thus we have created two different tests
 */

import {BN, Provider} from "@project-serum/anchor";
import {Keypair, PublicKey, SystemProgram} from "@solana/web3.js";
import {airdropAdmin, getSolbondProgram, MOCK} from "@qpools/sdk";
import {getInvariantProgram, QPair, QPoolsAdmin} from "@qpools/admin-sdk/lib/qpools-admin-sdk/src";
import {NETWORK} from "@qpools/sdk/lib/cluster";
import {Token} from "@solana/spl-token";
import {assert} from "chai";
import {FEE_TIER, getMarketAddress, Market, Network, Pair} from "@invariant-labs/sdk";
import {CreateFeeTier, CreatePool, Decimal, FeeTier, PoolStructure, State} from "@invariant-labs/sdk/lib/market";
import {fromFee} from "@invariant-labs/sdk/lib/utils";
import {delay} from "@qpools/sdk/lib/utils";

describe('invariant-devnet', () => {

    // Get connection and provider
    const provider = Provider.local("https://api.devnet.solana.com");
    const connection = provider.connection;

    // @ts-expect-error
    const genericPayer = provider.wallet.payer as Keypair;
    const genericWallet = provider.wallet;
    const mintAuthority = genericPayer;

    // Generate the users
    const trader = Keypair.fromSecretKey(
        Uint8Array.from([
            174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56, 222, 53, 138, 189, 224, 216, 117,
            173, 10, 149, 53, 45, 73, 251, 237, 246, 15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141, 89, 240,
            121, 121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109, 168, 89, 238, 135,
        ])
    );
    const liquidityProvider = Keypair.fromSecretKey(
        Uint8Array.from([
            142, 174, 4, 30, 129, 117, 122, 31, 65, 41, 23, 143, 217, 24, 76, 91, 223, 235, 147, 214, 252, 84, 129, 117,
            137, 22, 221, 247, 75, 98, 237, 134, 123, 245, 172, 72, 24, 213, 209, 2, 129, 212, 96, 132, 156, 125, 171, 198,
            177, 63, 175, 223, 101, 214, 5, 139, 2, 80, 74, 115, 41, 224, 31, 59
        ])
    );
    const currencyOwner = airdropAdmin;

    const solbondProgram = getSolbondProgram(connection, provider, NETWORK.DEVNET);
    const invariantProgram = getInvariantProgram(connection, provider, NETWORK.DEVNET);
    console.log("Solbond Program");
    console.log(solbondProgram.programId.toString());
    console.log("Invariant Program");
    console.log(invariantProgram.programId.toString());

    let market: QPoolsAdmin;
    let invariantMarket: Market;
    let currencyMint: Token;

    /** Get a bunch of airdrops to pay for transactions */
    before(async () => {
        // Airdrop stuff, if no balance is found ..
        // Request airdrops for all accounts that will be active
        if ((await connection.getBalance(trader.publicKey)) <= 2e9) {
            let tx1 = await connection.requestAirdrop(trader.publicKey, 2e9);
            await connection.confirmTransaction(tx1, 'finalized');
            console.log("Airdropped 1!");
        }
        if ((await connection.getBalance(liquidityProvider.publicKey)) <= 2e9) {
            let tx2 = await connection.requestAirdrop(liquidityProvider.publicKey, 2e9);
            await connection.confirmTransaction(tx2, 'finalized');
            console.log("Airdropped 2!");
        }
        if ((await connection.getBalance(currencyOwner.publicKey)) <= 2e9) {
            let tx3 = await connection.requestAirdrop(currencyOwner.publicKey, 2e9);
            await connection.confirmTransaction(tx3, 'finalized');
            console.log("Airdropped 3!");
        }

        // Maybe need to add delay. check if it works, and do it accordingly
        let traderBalance = await provider.connection.getBalance(trader.publicKey)
        let liquidityProviderBalance = await provider.connection.getBalance(liquidityProvider.publicKey)
        let currencyOwnerBalance = await provider.connection.getBalance(currencyOwner.publicKey)
        assert.ok(traderBalance > 2e9, "1 " + String(traderBalance));
        assert.ok(liquidityProviderBalance > 2e9, "2 " + String(liquidityProviderBalance));
        assert.ok(currencyOwnerBalance > 2e9, "3 " + String(currencyOwnerBalance));
    })

    /** Assign the currency mint */
    it("#createCurrencyMint", async () => {
        assert.ok(solbondProgram.programId, String(solbondProgram.programId));
        assert.ok(invariantProgram.programId, String(invariantProgram.programId));
        // Take the currency mint from the user SDK
        currencyMint = new Token(connection, MOCK.DEV.SOL, solbondProgram.programId, currencyOwner);
        assert.ok(currencyMint.publicKey.equals(MOCK.DEV.SOL), currencyMint.publicKey.toString());
    })

    /** Initialize a mock market object*/
    it('#initializeMockMarket()', async () => {
        market = new QPoolsAdmin(
            connection,
            provider,
            currencyMint.publicKey,
            NETWORK.DEVNET
        );

        let programId = new PublicKey(getMarketAddress(Network.DEV));
        invariantMarket = await Market.build(Network.DEV, genericWallet, connection, programId);

    })

    // Actually, not even sure if this is needed at all
    let stateAddress: PublicKey;
    let stateAddressBump: number;

    let protocolFee = {v: fromFee(new BN(10000))};
    /** Create a state, if it doesn't exist yet... */
    it('#createState()', async () => {
        // Retrieve state from the invariant contract
        let {address, bump} = await invariantMarket.getStateAddress();
        stateAddress = address;
        stateAddressBump = bump;

        try {
            let stateAccount = (await invariantProgram.account.state.fetch(address)) as State;
            console.log("State account is: ", stateAccount);
        } catch (e) {
            console.log("Error fetching state account!");
            console.log(e);
            // Load, if it doesn't exist, create state
            let tx = await invariantMarket.createStateTransaction(genericPayer.publicKey);
            let sg = await connection.sendTransaction(tx, [genericPayer]);
            await connection.confirmTransaction(sg);
        }
    })

    /**
     * Create Trade Pairs
     * feeTiers are created as pools are created anyways
     * */
    let pairs: {[index: string]: any;} = {};
    let feeTier: FeeTier = {
        fee: fromFee(new BN(40))
    };
    // let feeTier = FEE_TIER[0];

    /** Create Pairs */
    it('#createPairs', async () => {
        // Create a couple pairs one for each market
        // These tokens were manually created ov erCLI
        pairs["SOL/USDC"] = new QPair(
            MOCK.DEV.SOL,
            MOCK.DEV.USDC,
            feeTier
        )
        pairs["SOL/mSOL"] = new QPair(
            MOCK.DEV.SOL,
            MOCK.DEV.MSOL,
            feeTier
        )
        pairs["USDC/mSOL"] = new QPair(
            MOCK.DEV.USDC,
            MOCK.DEV.MSOL,
            feeTier
        )
        pairs["USDC/SOL"] = pairs["SOL/USDC"]
        pairs["mSOL/SOL"] = pairs["SOL/mSOL"]
        pairs["mSOL/USDC"] = pairs["USDC/mSOL"]

        // TODO: Figure out what to follow here
        // Because we need to act as if we have this money
        // We probably will need to re-create each feeTier, state, etc. ourselves

        for (let pairString in pairs) {
            let qpair = pairs[pairString];
            console.log("qpair is: ", qpair);

            // If either exists, then
            // If the fee tier does not exist yet, create the feeTier
            let feeTierAccount;
            // let feeTierAddress = await qpair.getFeeTierAddress(invariantProgram.programId);
            let {address, bump} = await invariantMarket.getFeeTierAddress(market.feeTier);
            let feeTierAddress = address;
            try {
                feeTierAccount = (await invariantProgram.account.feeTier.fetch(feeTierAddress)) as FeeTier;
            } catch (e) {
                console.log("Error trying to fetch fee-tier!");
                console.log(e);
                let createFeeTier: CreateFeeTier = {
                    admin: genericPayer.publicKey,
                    feeTier: feeTier
                };
                let tx = await invariantMarket.createFeeTierTransaction(createFeeTier);
                console.log("Creating fee tier..");
                let sg = await connection.sendTransaction(tx, [genericPayer]);
                console.log("TX Sig: ", sg);
                await connection.confirmTransaction(sg, "finalized");
                // await invariantMarket.createFeeTier(createFeeTier, genericPayer);
                // await delay(2000);
                console.log("Fetch again...");
                feeTierAccount = (await invariantProgram.account.feeTier.fetch(feeTierAddress)) as FeeTier;
            }

            // If the pool does not exist yet, create the pool
            let poolAccount;
            let poolAddress = await qpair.getAddress(invariantProgram.programId);
            try {
                poolAccount = (await invariantProgram.account.pool.fetch(poolAddress)) as PoolStructure;
            } catch (e) {
                console.log("Error trying to fetch pool account!");
                console.log(e)
                // let's just assume that the initial tick is at zero
                let tokenX = new Token(connection, qpair.tokenX, invariantProgram.programId, genericPayer);
                let tokenY = new Token(connection, qpair.tokenY, invariantProgram.programId, genericPayer);
                let createPool: CreatePool = {
                    pair: qpair,
                    payer: genericPayer,
                    protocolFee: protocolFee,
                    tokenX: tokenX,
                    tokenY: tokenY
                };
                // sha256("global:your_ix_name")[..8] this part is missing in the function ix ...
                console.log("Create pool is: ", qpair, JSON.stringify(protocolFee), tokenX.publicKey.toString(), tokenY.publicKey.toString());
                await invariantMarket.createPool(createPool);
                console.log("Created pool!");
                poolAccount = (await invariantProgram.account.pool.fetch(poolAddress)) as PoolStructure;
            }

            // For each of these pairs, create a pool if it doesn't exist yet
        }

    })


})