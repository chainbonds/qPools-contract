import * as anchor from "@project-serum/anchor";
import {Program, Provider} from "@project-serum/anchor";
import {getPayer} from "./utils";
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Network, SEED, DENOMINATOR, Market, Pair, tou64} from '@invariant-labs/sdk'
import {invariantAmmProgram} from "./external_programs/invariant_amm";
import {createPoolWithLiquidity, createTokensAndPool} from "./invariant-utils";
import BN from "bn.js";
import {Decimal} from "@invariant-labs/sdk/lib/market";
import {fromFee} from "@invariant-labs/sdk/lib/utils";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {toDecimal} from "../sdk/lib/utils";
import {assert} from "chai";

/*
    TODO 1: Figure out how to import different external_programs into the tests here
    TODO 2: What is liquidityDelta for? What does it exactly describe?
    TODO 3: What is index in claimFee? Is this the lower bound it collects fees from?
    TODO 4: What is index when claiming fees?
 */
const DEFAULT_AIRDROP_AMOUNT = 10_000_000;
const DEFAULT_PROVIDED_LIQUIDITY = new BN(10).pow(new BN(23));

const DEFAULT_LIQUIDITY_TO_PROVIDE = 10_000_000;
const DEFAULT_LIQUIDITY_DELTA = new BN(10).pow(new BN(12));

const PROTOCOL_FEE = 10000;

const SWAP_AMOUNT = 2_000_000;

describe('solbond-yield-farming', () => {

    /*
        Logic on our side
     */
    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const connection: Connection = provider.connection;

    // Have one Solbond Program
    // And have one InvariantAMM Program

    // We need to access another program, the AMM program!
    const solbondProgram = anchor.workspace.Solbond;
    // const payer = getPayer();

    /*
    * Logic from the Invariant Side
    * */
    // This will not change, so we can just import using the IDL
    const invariantProgramId = new anchor.web3.PublicKey("3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY");
    const invariantProgram = invariantAmmProgram(connection, provider, invariantProgramId);
    // console.log("Invariant program is: ", invariantProgram);

    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair;
    const positionOwner = Keypair.generate();
    const admin = Keypair.generate();  // the admin is the wallet
    const market = new Market(
        Network.LOCAL,
        provider.wallet,
        connection,
        invariantProgramId
    );
    const protocolFee: Decimal = { v: fromFee(new BN(PROTOCOL_FEE))};

    // let pair: Pair;
    // let mintAuthority: Keypair;


    // Initialize a third party who owns the pool
    before(async () => {
        console.log("Before ok")
    })

    let pair: Pair;
    let mintAuthority: Keypair;


    it("Initialize the state of the world", async () => {
       console.log("Hello");
        await connection.requestAirdrop(positionOwner.publicKey, 1e9);

        // Initialize a third party use who owns the pool
        // const poolOwner = Keypair.generate();
        // await provider.connection.requestAirdrop(poolOwner.publicKey, DEFAULT_AIRDROP_AMOUNT);
        await market.createState(wallet, protocolFee);
        console.log("Created the state!");

        // Initialize pools, including token, feeTier, pair, including a lot of liquidity
         ({pair, mintAuthority} = (await createPoolWithLiquidity(
            market,
            connection,
            wallet,
             { v: DEFAULT_PROVIDED_LIQUIDITY }
        )));
        console.log("Created a pool with liquidity!");

    });

    // Generate the tokens now
    let tokenX: Token;
    let tokenY: Token;
    let accountX: PublicKey;
    let accountY: PublicKey;

    /*
        Implement a swapping mechanism, once there was a swap happening
     */
    it("Prepare to provide some liquidity into the AMM, front-end only, by minting and exchanging the tokens", async () => {
        console.log("Now a third party swaps his single token to get equal proportions of tokens for liquidity provisioning...");

        tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet);
        tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet);
        accountX = await tokenX.createAccount(positionOwner.publicKey);
        accountY = await tokenY.createAccount(positionOwner.publicKey);

        // Create some tokens for the liquidity-pair to be provided
        const amount: BN = new BN(DEFAULT_LIQUIDITY_TO_PROVIDE);
        const swapAmount: BN = new BN(DEFAULT_LIQUIDITY_TO_PROVIDE / 2);

        console.log(pair.tokenX, typeof pair.tokenX);
        // The user will always pay for all operations with this (and if he allowed to, is a different question!)

        // Assume we have a bunch of tokenX
        await tokenX.mintTo(accountX, mintAuthority.publicKey, [mintAuthority], tou64(amount))

        console.log("BEFORE Owned X and Y are: ");
        console.log((await tokenX.getAccountInfo(accountX)).amount.toString());
        console.log((await tokenY.getAccountInfo(accountY)).amount.toString());


        // We now need to swap tokenX to tokenY before we can possible provide liquidity
        // Apparently, this one allows us to receive the price information
        const poolDataBefore = await market.get(pair)
        // I am swapping too much!!
        await market.swap(
            {
                pair: pair,
                XtoY: true,
                amount: swapAmount,
                knownPrice: poolDataBefore.sqrtPrice,
                slippage: toDecimal(1, 2),
                accountX: accountX,
                accountY: accountY,
                byAmountIn: true
            },
            positionOwner
        );

        // We can now double-check that liquidity was indeed provided!
        // Check pool
        const poolData = await market.get(pair);
        assert.ok(poolData.liquidity.v.eq(poolDataBefore.liquidity.v));
        assert.ok(poolData.sqrtPrice.v.lt(poolDataBefore.sqrtPrice.v));

        console.log("Pool data is: ");
        console.log(poolData.liquidity.v.toString());
        console.log(poolData.sqrtPrice.v.toString());
        console.log(poolData.currentTickIndex);
        console.log(poolData.feeGrowthGlobalX.v.toString());
        console.log(poolData.feeGrowthGlobalY.v.toString());
        console.log(poolData.secondsPerLiquidityGlobal.v.toString());

        console.log("AFTER Owned X and Y are: ");
        console.log((await tokenX.getAccountInfo(accountX)).amount.toString());
        console.log((await tokenY.getAccountInfo(accountY)).amount.toString());

        // Now we have enough tokens A and B to provide as liquidity!

    });

    it("Provides liquidity to the pool, assuming (almost-)equal amounts of tokens: ", async () => {
        console.log("Provide liquidity now");

        // Check out how many tokens are there each

        /*
            PROVIDE LIQUIDITY
         */
        // Generate lower and upper ticks
        // TODO: How do we translate from price to tick?
        // And how do we actually calculate the best ticks,
        // also considering that there is slippage, changes, etc.
        const upperTick = 1000;
        const lowerTick = -1000;

        // TODO: What is this?
        // const liquidityDelta = { v: new BN(1000000).mul(DENOMINATOR) };
        const liquidityDelta: Decimal = { v: DEFAULT_LIQUIDITY_DELTA }

        console.log("Lower and upper ticks are");
        // Create tick, if it does not exist already
        // TODO: How do i retrieve tick, or create new tick if it does not exist yet?
        // await market.createTick(pair, upperTick, wallet);
        // await market.createTick(pair, lowerTick, wallet);

        console.log("Position Owner Created");
        await market.createPositionList(positionOwner);
        await market.initPosition(
            {
                pair,
                owner: positionOwner.publicKey,
                userTokenX: accountX,
                userTokenY: accountY,
                lowerTick,
                upperTick,
                liquidityDelta
            },
            positionOwner
        );

        // Call initialize position

        // After that, call change `claim` or `withdraw` maybe
    });

    // TODO: Make the liquidity provider more dominant and bigger tick position

    it("Will make multiple swaps, and collect the fees from there ", async () => {
        console.log("Collecting trading fees");

        let i = 0;
        while (i < 10) {
            console.log("User is swapping...", i);

            // Need a new user, who has some solana to do the transactions
            const newUser = Keypair.generate();
            await connection.requestAirdrop(newUser.publicKey, 2_000_000_000);

            // User needs some tokens
            const newUserAccountX = await tokenX.createAccount(newUser.publicKey);
            const newUserAccountY = await tokenY.createAccount(newUser.publicKey);

            // Create some tokens for the liquidity-pair to be provided
            const amount: BN = new BN(SWAP_AMOUNT);

            // Assume we have a bunch of tokenX
            await tokenX.mintTo(newUserAccountX, mintAuthority.publicKey, [mintAuthority], tou64(amount))

            console.log("BEFORE Owned X and Y are: ");
            console.log((await tokenX.getAccountInfo(newUserAccountX)).amount.toString());
            console.log((await tokenY.getAccountInfo(newUserAccountY)).amount.toString());

            // We now need to swap tokenX to tokenY before we can possible provide liquidity
            // Apparently, this one allows us to receive the price information
            const poolDataBefore = await market.get(pair)
            // I am swapping too much!!
            await market.swap(
                {
                    pair: pair,
                    XtoY: true,
                    amount: amount,
                    knownPrice: poolDataBefore.sqrtPrice,
                    slippage: toDecimal(1, 2),
                    accountX: newUserAccountX,
                    accountY: newUserAccountY,
                    byAmountIn: true
                },
                newUser
            );

            console.log("AFTER Owned X and Y are: ");
            console.log((await tokenX.getAccountInfo(newUserAccountX)).amount.toString());
            console.log((await tokenY.getAccountInfo(newUserAccountY)).amount.toString());

            i++;
        }

    });

    it("Will make multiple swaps, and collect the fees from there ", async () => {
        console.log("Claim fees...");


        const poolDataBefore = await market.get(pair);
        console.log("Pool data before is: ");
        console.log(poolDataBefore.liquidity.v.toString());
        console.log(poolDataBefore.sqrtPrice.v.toString());
        // console.log(poolDataBefore.currentTickIndex);
        console.log(poolDataBefore.feeGrowthGlobalX.v.toString());
        console.log(poolDataBefore.feeGrowthGlobalY.v.toString());
        // console.log(poolDataBefore.secondsPerLiquidityGlobal.v.toString());

        console.log("BEFORE Owned X and Y are: ");
        console.log((await tokenX.getAccountInfo(accountX)).amount.toString());
        console.log((await tokenY.getAccountInfo(accountY)).amount.toString());

        await market.claimFee(
            {
                pair,
                owner: positionOwner.publicKey,
                userTokenX: accountX,
                userTokenY: accountY,
                index: 0
            },
            positionOwner
        );

        // await market.withdrawProtocolFee(
        //     pair,
        //     accountX,
        //     accountY,
        //     positionOwner
        // )

        const poolDataAfter = await market.get(pair);
        console.log("Pool data after is: ");
        console.log(poolDataAfter.liquidity.v.toString());
        console.log(poolDataAfter.sqrtPrice.v.toString());
        // console.log(poolDataAfter.currentTickIndex);
        console.log(poolDataAfter.feeGrowthGlobalX.v.toString());
        console.log(poolDataAfter.feeGrowthGlobalY.v.toString());
        // console.log(poolDataAfter.secondsPerLiquidityGlobal.v.toString());

        console.log("AFTER Owned X and Y are: ");
        console.log((await tokenX.getAccountInfo(accountX)).amount.toString());
        console.log((await tokenY.getAccountInfo(accountY)).amount.toString());

    });

    it("Now withdraw the liquidity again ... ", async () => {
        console.log("Close the position...");


    });


});
