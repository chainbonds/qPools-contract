import * as anchor from '@project-serum/anchor';
import {Provider, web3} from '@project-serum/anchor';
import {clusterApiUrl, Connection, Keypair, PublicKey, Signer} from '@solana/web3.js';
import {IWallet, Network} from '@invariant-labs/sdk';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {createMint, getPayer} from "./utils";
import {MockQPools} from "./qpools-sdk/qpools-mock";
import {invariantAmmProgram} from "./external_programs/invariant_amm";
import {getSolbondProgram, getInvariantProgram} from "./qpools-sdk/program";
import {QPoolsUser} from "./qpools-sdk/qpools-user";
import {mintTo} from "@project-serum/serum/lib/token-instructions";

// require('dotenv').config()
const NUMBER_POOLS = 1;

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('claim', () => {

    // Connection
    const provider = Provider.local();
    const connection = provider.connection;

    const payer = getPayer();
    const mintAuthority = Keypair.generate();
    let currencyMint: Token | null = null;

    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair;
    // const wallet = Keypair.generate();
    const positionOwner = Keypair.generate();
    const admin = Keypair.generate();
    const reserveAdmin = Keypair.generate();

    // Programs
    const solbondProgram = anchor.workspace.Solbond;
    const invariantProgram = anchor.workspace.Amm;

    console.log("Solbond program");
    console.log(solbondProgram.programId.toString());
    console.log("Invairant Program");
    console.log(invariantProgram.programId.toString());

    // More Complex Objects
    let market: MockQPools;
    let qpools: QPoolsUser;

    before(async () => {
        await connection.requestAirdrop(reserveAdmin.publicKey, 1e9);
        await connection.requestAirdrop(mintAuthority.publicKey, 1e9);
        await connection.requestAirdrop(admin.publicKey, 1e9);
        await connection.requestAirdrop(positionOwner.publicKey, 1e9);
        await connection.requestAirdrop(payer.publicKey, 1e9);
        currencyMint = await createMint(provider, payer, mintAuthority.publicKey);
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

    it('#initializeMockedMarket()', async () => {
        market = new MockQPools(
            provider.wallet,
            connection,
            provider
        );
        await market.createMockMarket(
            Network.LOCAL,
            provider.wallet,
            invariantProgram.programId
        )
    });
    it("#createTradedToken()", async () => {
        await market.createTokens(NUMBER_POOLS, mintAuthority);
    })
    it('#createState()', async () => {
        await market.createState(admin);
    })
    it("#createFeeTier()", async () => {
        await market.createFeeTier(admin);
    })
    it("#createTradePairs()", async () => {
        // Create 10 pools, one for each pair
        await market.createPairs(NUMBER_POOLS);
    })
    it("#createMarketsFromPairs()", async () => {
        // Get network and wallet from the adapter somewhere
        await market.creatMarketsFromPairs(
            NUMBER_POOLS,
            admin
        )
    })
    it("#provideThirdPartyLiquidity()", async () => {
        // Provide Liquidity through a third party (this is not the bond yet)
        await market.provideLiquidityToAllPairs(
            NUMBER_POOLS,
            admin,
            mintAuthority,
            1_000_000,
            1_000_000
        )
    })

    // We must now instantiate all accounts!
    it("initializeQPTReserve()", async () => {
        // Initialize the QPT Reserves
        await market.initializeQPTReserve(
            currencyMint,
            reserveAdmin
        )
    })

    // We now want to pay in some funds into our reserve ...
    it("buyQPT()", async () => {
        // As a new, third-party user (A), (A) wants to buy QPT!
        // // Create the QPools Object

        qpools = new QPoolsUser(
            provider,
            wallet,
            connection,
            market.qPoolAccount,
            market.QPTokenMint,
            market.currencyMint
        );

        await qpools.registerAccount();
        await currencyMint.mintTo(qpools.purchaserCurrencyAccount, mintAuthority.publicKey, [mintAuthority as Signer], 10e6);
        console.log("Can now proceed with buying QPT!");
        await qpools.buyQPT(
            5_000_000
        );
    })

    it("swapReserveToAllPairs()", async() => {
        // Start the swaps!
        await market.swapToAllPairs(admin);
    })

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


    // let purchaser: PublicKey | null = null;
    // let purchaserRedeemableTokenAccount: PublicKey | null = null;
    // let purchaserCurrencyTokenAccount: PublicKey | null = null;
    //
    // // Make a purchase of the bond / staking
    // it('#buySolbond', async () => {
    //
    //     let amountToBuy = 10_000_000_000;
    //
    //     purchaser = payer.publicKey;
    //     purchaserRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(purchaser);
    //     purchaserCurrencyTokenAccount = await bondPoolCurrencyTokenMint!.createAccount(purchaser);
    //     await bondPoolCurrencyTokenMint.mintTo(purchaserCurrencyTokenAccount, purchaser, [], amountToBuy);
    //
    //     const initializeTx = await solbondProgram.rpc.purchaseBond(
    //         new BN(amountToBuy),
    //         {
    //             accounts: {
    //                 bondPoolAccount: bondPoolAccount,
    //                 bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
    //                 bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
    //                 bondPoolTokenAccount: bondPoolTokenAccount,
    //                 bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
    //                 purchaser: payer.publicKey,
    //                 purchaserTokenAccount: purchaserCurrencyTokenAccount,
    //                 purchaserRedeemableTokenAccount: purchaserRedeemableTokenAccount,
    //
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //                 clock: web3.SYSVAR_CLOCK_PUBKEY,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 tokenProgram: TOKEN_PROGRAM_ID
    //             },
    //             signers: [payer]
    //         }
    //     );
    //     const tx = await provider.connection.confirmTransaction(initializeTx);
    //     console.log("initializeTx signature", initializeTx);
    //     console.log(tx);
    //
    // });
    //
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
