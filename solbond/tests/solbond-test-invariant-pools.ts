import * as anchor from '@project-serum/anchor';
import {BN, Provider, web3} from '@project-serum/anchor';
import {clusterApiUrl, Connection, Keypair, PublicKey, Signer} from '@solana/web3.js';
import {IWallet, Network} from '@invariant-labs/sdk';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, getPayer} from "./utils";
import {MockQPools} from "./qpools-sdk/qpools-mock";
import {invariantAmmProgram} from "./external_programs/invariant_amm";
import {getSolbondProgram, getInvariantProgram} from "./qpools-sdk/program";
import {QPoolsUser} from "./qpools-sdk/qpools-user";
import {mintTo} from "@project-serum/serum/lib/token-instructions";
import {assert} from "chai";
import {createToken} from "./invariant-utils";
import {sendAndConfirm} from "../../dapp/src/splpasta/util";

// require('dotenv').config()
const NUMBER_POOLS = 1;

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('claim', () => {

    // Connection
    const provider = Provider.local();
    const connection = provider.connection;

    let currencyMint: Token;

    // TODO: We should write additional tests, where the qpAuthority
    //  and the market authority are separate!

    // @ts-expect-error
    const qpAuthority = provider.wallet.payer as Keypair;

    // Again, assume that everyone has kinda the same wallet ...
    const user = Keypair.generate();
    // const wallet = Keypair.generate();
    const mintAuthority = Keypair.generate();
    // Assume for today, that the market authority is equivalent to the QPT authority.
    const marketAuthority = provider.wallet;
    // const user = Keypair.generate();
    // const qpAuthority = Keypair.generate();
    // const reserveAdmin = Keypair.generate();
    const liquidityProvider = Keypair.generate();

    // Programs
    const solbondProgram = anchor.workspace.Solbond;
    // const invariantProgram = anchor.workspace.Amm;
    const invariantProgram = getInvariantProgram(connection, provider);

    console.log("Solbond program");
    console.log(solbondProgram.programId.toString());
    console.log("Invairant Program");
    console.log(invariantProgram.programId.toString());

    // More Complex Objects
    let market: MockQPools;
    let qpools: QPoolsUser;

    let msg: string = "";

    // Payer, who pays for all transactions here, because he is part of the provider
    // const unspecifiedPayer = getPayer();

    // TODO: Mint authority cannot pay for mint.. weird!!! Mint authority does not have any airdrop amount!
    before(async () => {
        let tx1 = await connection.requestAirdrop(mintAuthority.publicKey, 3e9);
        let tx2 = await connection.requestAirdrop(user.publicKey, 3e9);
        // await connection.requestAirdrop(unspecifiedPayer.publicKey, 1e9);
        // await connection.requestAirdrop(marketAuthority.publicKey, 1e9);
        let tx3 = await connection.requestAirdrop(liquidityProvider.publicKey, 3e9);
        let tx4 = await connection.requestAirdrop(qpAuthority.publicKey, 3e9);
        // Wait for airdrop to kick in ...
        await connection.confirmTransaction(tx1);
        await connection.confirmTransaction(tx2);
        await connection.confirmTransaction(tx3);
        await connection.confirmTransaction(tx4);
        await delay(1_500);
        assert.equal(
            (await provider.connection.getBalance(mintAuthority.publicKey)),
            3e9,
            String((await provider.connection.getBalance(mintAuthority.publicKey)))
        );
        assert.equal(
            (await provider.connection.getBalance(liquidityProvider.publicKey)),
            3e9,
            String((await provider.connection.getBalance(liquidityProvider.publicKey)))
        );
        assert.equal(
            (await provider.connection.getBalance(qpAuthority.publicKey)),
            500000003000000000,
            String((await provider.connection.getBalance(qpAuthority.publicKey)))
        );
        currencyMint = await createToken(connection, mintAuthority, mintAuthority);
    })

    /*
     * Markets need to be initialized in this exact order
     * Most of these happen from within the mock
     * Some of these need to happen also on the frontend / as part of the SDK
     */
    /*
     * Now run our endpoints
     */
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

    /* Initialize markets and pairs */
    it('#initializeMockedMarket()', async () => {
        console.log("(Currency Mint PK) when creating market is: ", currencyMint.publicKey.toString());
        market = new MockQPools(
            qpAuthority,
            connection,
            provider,
            currencyMint
        );
        await market.createMockMarket(
            Network.LOCAL,
            marketAuthority,
            invariantProgram.programId
        )
    });
    it("#createTradedToken()", async () => {
        await market.createTokens(NUMBER_POOLS, mintAuthority);
    })
    it('#createState()', async () => {
        await market.createState(qpAuthority);
    })
    it("#createFeeTier()", async () => {
        await market.createFeeTier(qpAuthority);
    })
    it("#createTradePairs()", async () => {
        // Create 10 pools, one for each pair
        await market.createPairs();
    })
    it("#createMarketsFromPairs()", async () => {
        // Get network and wallet from the adapter somewhere
        await market.creatMarketsFromPairs(qpAuthority)
    })

    // For each pair, generate an account for the qPools token if it doesnt exist yet

    it("#provideThirdPartyLiquidity()", async () => {
        console.log("Before amount");
        let liquidityProvidingAmount = new BN(2).pow(new BN(63)).subn(1);
        console.log("Liquidity providing amount is: ", liquidityProvidingAmount.toString());
        await market.provideThirdPartyLiquidityToAllPairs(
            liquidityProvider,
            mintAuthority,
            liquidityProvidingAmount
        )
    })

    // We must now instantiate all accounts!
    it("initializeQPTReserve()", async () => {
        // Initialize the QPT Reserves
        await market.initializeQPTReserve()
    })

    // /* Simulate a user purchasing QPT Tokens */
    it("buyQPT()", async () => {
        // As a new, third-party user (A), (A) wants to buy QPT!
        // // Create the QPools Object
        qpools = new QPoolsUser(
            provider,
            connection,
            market.qPoolAccount,
            market.QPTokenMint,
            market.currencyMint
        );

        await qpools.registerAccount();
        // Simulate the user having some money
        let airdropBuyAmount = new BN(2).pow(new BN(50)).subn(1).toNumber();
        console.log("(Currency Mint PK) airdropping is: ", currencyMint.publicKey.toString())
        await currencyMint.mintTo(qpools.purchaserCurrencyAccount, mintAuthority.publicKey, [mintAuthority as Signer], airdropBuyAmount);
        await qpools.buyQPT(
            airdropBuyAmount
        );
        await delay(2_000);
    })

    it("swapReserveToAllPairs()", async() => {
        // Start the swaps!
        console.log("Get market authority balance: ");
        console.log(await connection.getBalance(marketAuthority.publicKey));
        // Where is the airdrop!! (?) // Or where is the reserve's currency amount in the first place
        console.log("Currency has: ", (await currencyMint.getAccountInfo(qpools.purchaserCurrencyAccount)).amount.toString());
        // console.log("Currency has: ", (await currencyMint.getAccountInfo(qpools.purchaserCurrencyAccount)).amount.toString());
        await market.swapReserveToAllAssetPairs(100);
    })

    it("#createPositionList()", async () => {
        await market.createPositionList()
    });

    // it("#createLiquidityPositions()", async () => {
    //     console.log("Creating Liquidity Positions");
    //     // First, create a position list if it doesn't exist yet
    //     // Then, dissolve the position if it exists already, if it doesn't exist yet
    //     // Then, create a new position, if it doesn't exist already
    //
    // })


    // it("#swapWithInvariant()", async () => {
    //    await market.swapWithInvariant(
    //        admin,
    //        true,
    //        new anchor.BN(10),
    //        true,
    //        new anchor.BN(3),
    //        new anchor.BN(0)
    //    )
    // })







    // it("#registerInvariantPools()", async () => {
    //
    //     // Get the addresses of some of the pools that we generated
    //     [poolList, poolListBump] = await anchor.web3.PublicKey.findProgramAddress(
    //         [wallet.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("poolList"))],
    //         solbondProgram.programId
    //     );
    //
    //     // TODO: Replace these with actual values
    //     let _bump_register_position = 5;
    //     let _curr_idx = 5;
    //     let _max_idx = 5;
    //     let weight = 5;
    //
    //     // Call the health-checkpoint
    //     await solbondProgram.rpc.registerInvariantPools(
    //         // poolListBump,
    //         // [new BN(10), new BN(10), new BN(10), new BN(10), new BN(10)],
    //         _bump_register_position,
    //         _curr_idx,
    //         _max_idx,
    //         weight,
    //         {
    //             accounts: {
    //
    //                 invariantPoolAccount: null,
    //                 poolAddress: null,
    //                 state: null,
    //                 tickmap: null,
    //                 currencyTokenMint: null,
    //                 tokenXMint: null,
    //                 reserveCurrencyToken: null,
    //                 reserveX: null,
    //                 reserveY: null,
    //                 accountCurrencyReserve: null,
    //                 accountXReserve: null,
    //                 initializer: null,
    //                 positionInPool: null,
    //                 positionListInPool: null,
    //                 upperTick: null,
    //                 lowerTick: null,
    //
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //                 clock: web3.SYSVAR_CLOCK_PUBKEY,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 tokenProgram: TOKEN_PROGRAM_ID
    //             },
    //             signers: [wallet]
    //         }
    //     );
    // })


    // Now do all the swaps ...

    //
    // it('#claim', async () => {
    //     const upperTick = 10
    //     const lowerTick = -20
    //
    //     await market.createTick(pair, upperTick, wallet)
    //     await market.createTick(pair, lowerTick, wallet)
    //
    //     const userTokenXAccount = await tokenX.createAccount(positionOwner.publicKey)
    //     const userTokenYAccount = await tokenY.createAccount(positionOwner.publicKey)
    //     const mintAmount = tou64(new BN(10).pow(new BN(10)))
    //
    //     await tokenX.mintTo(userTokenXAccount, mintAuthority.publicKey, [mintAuthority], mintAmount)
    //     await tokenY.mintTo(userTokenYAccount, mintAuthority.publicKey, [mintAuthority], mintAmount)
    //
    //     const liquidityDelta = { v: new BN(1_000_000).mul(DENOMINATOR) }
    //
    //     /*
    //         TODO: This should be replaced and done by our program instead
    //      */
    //
    //     // TODO: Let's just call our function with this
    //
    //     await market.createPositionList(positionOwner)
    //     await market.initPosition(
    //         {
    //             pair,
    //             owner: positionOwner.publicKey,
    //             userTokenX: userTokenXAccount,
    //             userTokenY: userTokenYAccount,
    //             lowerTick,
    //             upperTick,
    //             liquidityDelta
    //         },
    //         positionOwner
    //     )
    //
    //     assert.ok((await market.get(pair)).liquidity.v.eq(liquidityDelta.v))
    //
    //     const swapper = Keypair.generate()
    //     await connection.requestAirdrop(swapper.publicKey, 1e9)
    //
    //     const amount = new BN(1000)
    //     const accountX = await tokenX.createAccount(swapper.publicKey)
    //     const accountY = await tokenY.createAccount(swapper.publicKey)
    //
    //     await tokenX.mintTo(accountX, mintAuthority.publicKey, [mintAuthority], tou64(amount))
    //
    //     const poolDataBefore = await market.get(pair)
    //     const priceLimit = DENOMINATOR.muln(100).divn(110)
    //     const reservesBeforeSwap = await market.getReserveBalances(pair, wallet)
    //
    //     await market.swap(
    //         {
    //             pair,
    //             XtoY: true,
    //             amount,
    //             knownPrice: poolDataBefore.sqrtPrice,
    //             slippage: toDecimal(1, 2),
    //             accountX,
    //             accountY,
    //             byAmountIn: true
    //         },
    //         swapper
    //     )
    //     const poolDataAfter = await market.get(pair)
    //     assert.ok(poolDataAfter.liquidity.v.eq(poolDataBefore.liquidity.v))
    //     assert.ok(poolDataAfter.currentTickIndex == lowerTick)
    //     assert.ok(poolDataAfter.sqrtPrice.v.lt(poolDataBefore.sqrtPrice.v))
    //
    //     const amountX = (await tokenX.getAccountInfo(accountX)).amount
    //     const amountY = (await tokenY.getAccountInfo(accountY)).amount
    //     const reservesAfterSwap = await market.getReserveBalances(pair, wallet)
    //     const reserveXDelta = reservesAfterSwap.x.sub(reservesBeforeSwap.x)
    //     const reserveYDelta = reservesBeforeSwap.y.sub(reservesAfterSwap.y)
    //
    //     assert.ok(amountX.eqn(0))
    //     assert.ok(amountY.eq(amount.subn(7)))
    //     assert.ok(reserveXDelta.eq(amount))
    //     assert.ok(reserveYDelta.eq(amount.subn(7)))
    //     assert.ok(poolDataAfter.feeGrowthGlobalX.v.eqn(5400000))
    //     assert.ok(poolDataAfter.feeGrowthGlobalY.v.eqn(0))
    //     assert.ok(poolDataAfter.feeProtocolTokenX.v.eq(new BN(600000013280)))
    //     assert.ok(poolDataAfter.feeProtocolTokenY.v.eqn(0))
    //
    //     const reservesBeforeClaim = await market.getReserveBalances(pair, wallet)
    //     const userTokenXAccountBeforeClaim = (await tokenX.getAccountInfo(userTokenXAccount)).amount
    //
    //     /*
    //         TODO: This should be replaced and done by our program instead
    //      */
    //
    //     await market.claimFee(
    //         {
    //             pair,
    //             owner: positionOwner.publicKey,
    //             userTokenX: userTokenXAccount,
    //             userTokenY: userTokenYAccount,
    //             index: 0
    //         },
    //         positionOwner
    //     )
    //
    //     const userTokenXAccountAfterClaim = (await tokenX.getAccountInfo(userTokenXAccount)).amount
    //     const positionAfterClaim = await market.getPosition(positionOwner.publicKey, 0)
    //     const reservesAfterClaim = await market.getReserveBalances(pair, wallet)
    //     const expectedTokensOwedX = new BN(400000000000)
    //     const expectedFeeGrowthInsideX = new BN(5400000)
    //     const expectedTokensClaimed = 5
    //
    //     assert.ok(reservesBeforeClaim.x.subn(5).eq(reservesAfterClaim.x))
    //     assert.ok(expectedTokensOwedX.eq(positionAfterClaim.tokensOwedX.v))
    //     assert.ok(expectedFeeGrowthInsideX.eq(positionAfterClaim.feeGrowthInsideX.v))
    //     assert.ok(
    //         userTokenXAccountAfterClaim.sub(userTokenXAccountBeforeClaim).eqn(expectedTokensClaimed)
    //     )
    // })
})
