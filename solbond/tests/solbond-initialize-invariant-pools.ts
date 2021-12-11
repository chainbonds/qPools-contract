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
    TODO 2: What is liquidityDelta for? What does it exactly describe?
    TODO 3: What is index in claimFee? Is this the lower bound it collects fees from?
    TODO 4: What is index when claiming fees?
 */
// const DEFAULT_LIQUIDITY_TO_PROVIDE = 10_000_000;
const DEFAULT_LIQUIDITY_DELTA = new BN(10).pow(new BN(9));

const DEFAULT_SOLANA_AIRDROP_AMOUNT = 2_000_000;
const PROTOCOL_FEE = 10_000;
const SWAP_AMOUNT = 1_000_000;

const printPoolData = (title, poolData) => {
    console.log("\n")
    console.log(title);
    console.log("liquidity: ", poolData.liquidity.v.toString());
    console.log("sqrtPrice: ", poolData.sqrtPrice.v.toString());
    console.log("currentTickIndex: ", poolData.currentTickIndex);
    console.log("feeGrowthGlobalX: ", poolData.feeGrowthGlobalX.v.toString());
    console.log("feeGrowthGlobalY: ", poolData.feeGrowthGlobalY.v.toString());
    console.log("secondsPerLiquidityGlobal: ", poolData.secondsPerLiquidityGlobal.v.toString());
}

const printUserTokens = async (title, userAccountA, userAccountB, tokenAMint, tokenBMint) => {
    console.log("\n")
    console.log(title);
    console.log("token X", (await tokenAMint.getAccountInfo(userAccountA)).amount.toString());
    console.log("token Y", (await tokenBMint.getAccountInfo(userAccountB)).amount.toString());

}

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
    const admin: Keypair = Keypair.generate();  // the admin is the wallet
    const market = new Market(
        Network.LOCAL,
        provider.wallet,
        connection,
        invariantProgramId
    );
    const protocolFee: Decimal = { v: fromFee(new BN(PROTOCOL_FEE))};

    let pair: Pair;
    let mintAuthority: Keypair;

    let tokenX: Token;
    let tokenY: Token;

    // Initialize a third party who owns the pool
    before(async () => {
        await connection.requestAirdrop(positionOwner.publicKey, 100 * 1e9);
        await connection.requestAirdrop(admin.publicKey, 100 * 1e9);

        // Initialize a third party use who owns the pool
        // const poolOwner = Keypair.generate();
        // await provider.connection.requestAirdrop(poolOwner.publicKey, DEFAULT_AIRDROP_AMOUNT);
        await market.createState(wallet, protocolFee);

        // Initialize pools, including token, feeTier, pair, including a lot of liquidity
        ({pair, mintAuthority} = (await createPoolWithLiquidity(
            market,
            connection,
            admin
        )));
    });

    // Generate the token accounts now
    let accountX: PublicKey;
    let accountY: PublicKey;

    /*
        Implement a swapping mechanism, once there was a swap happening
     */
    it("Test 2: Prepare to provide some liquidity into the AMM, front-end only, by minting and exchanging the tokens", async () => {
        console.log("\n\n\nTest 2: Now a third party swaps his single token to get equal proportions of tokens for liquidity provisioning...");

        tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet);
        tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet);
        accountX = await tokenX.createAccount(positionOwner.publicKey);
        accountY = await tokenY.createAccount(positionOwner.publicKey);

        // Create some tokens for the liquidity-pair to be provided
        const amount: BN = new BN(DEFAULT_LIQUIDITY_DELTA);
        // const swapAmount: BN = new BN(DEFAULT_LIQUIDITY_DELTA.div(new BN(2)));

        // Assume we have a bunch of tokenX
        await tokenX.mintTo(accountX, mintAuthority.publicKey, [mintAuthority], tou64(amount.mul(new BN(1))));
        await tokenY.mintTo(accountY, mintAuthority.publicKey, [mintAuthority], tou64(amount.mul(new BN(1))));

        // await printUserTokens("Before prepare Swap", accountX, accountY, tokenX, tokenY)
        //
        // // We now need to swap tokenX to tokenY before we can possible provide liquidity
        // // Apparently, this one allows us to receive the price information
        // const poolDataBefore = await market.get(pair)
        //
        // // I guess we gotta slowly swap ...
        // printPoolData("Pool data before is: ", poolDataBefore);
        //
        // // I am swapping too much!!
        // console.log("Swapping ...", swapAmount.toString());
        //
        // await market.swap(
        //     {
        //         pair: pair,
        //         XtoY: true,
        //         amount: swapAmount,
        //         knownPrice: poolDataBefore.sqrtPrice,
        //         slippage: toDecimal(5, 1),
        //         accountX: accountX,
        //         accountY: accountY,
        //         byAmountIn: true
        //     },
        //     positionOwner
        // );
        //
        // // We can now double-check that liquidity was indeed provided!
        // // Check pool
        // const poolDataAfter = await market.get(pair);
        // assert.ok(poolDataAfter.liquidity.v.eq(poolDataBefore.liquidity.v));
        // assert.ok(poolDataAfter.sqrtPrice.v.lt(poolDataBefore.sqrtPrice.v));
        //
        // printPoolData("Pool data after is: ", poolDataAfter);
        //
        await printUserTokens("After preparation is: ", accountX, accountY, tokenX, tokenY)

        // Now we have enough tokens A and B to provide as liquidity!

    });

    it("Test 3: Provides liquidity to the pool, assuming (almost-)equal amounts of tokens: ", async () => {
        console.log("\n\n\nTest 3: Provide liquidity now");

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
        const liquidityDelta: Decimal = { v: DEFAULT_LIQUIDITY_DELTA.sub(new BN(1_000_000)) }

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

    it("Test 4: Will make multiple swaps, and collect the fees from there ", async () => {
        console.log("\n\n\nTest 4: Collecting trading fees");


        let i = 0;
        while (i < 10) {
            console.log("\nUser number who is swapping:, i);

            // Need a new user, who has some solana to do the transactions
            const newUser = Keypair.generate();
            await connection.requestAirdrop(newUser.publicKey, DEFAULT_SOLANA_AIRDROP_AMOUNT);

            // User needs some tokens
            const newUserAccountX = await tokenX.createAccount(newUser.publicKey);
            const newUserAccountY = await tokenY.createAccount(newUser.publicKey);

            // Create some tokens for the liquidity-pair to be provided
            const amount: BN = new BN(SWAP_AMOUNT);
            await tokenX.mintTo(newUserAccountX, mintAuthority.publicKey, [mintAuthority], tou64(amount));

            const poolDataBefore = await market.get(pair);
            printPoolData("Pool data before is: ", poolDataBefore);
            await printUserTokens("Before actual Swap", newUserAccountX, newUserAccountY, tokenX, tokenY)

            // We now need to swap tokenX to tokenY before we can possible provide liquidity
            // Apparently, this one allows us to receive the price information
            // I am swapping too much!!
            await market.swap(
                {
                    pair: pair,
                    XtoY: true,
                    amount: amount,
                    knownPrice: poolDataBefore.sqrtPrice,
                    slippage: toDecimal(1, 5),
                    accountX: newUserAccountX,
                    accountY: newUserAccountY,
                    byAmountIn: true
                },
                newUser
            );

            const poolDataAfter = await market.get(pair);
            printPoolData("Pool data after is: ", poolDataAfter);
            await printUserTokens("After actual Swap", newUserAccountX, newUserAccountY, tokenX, tokenY)
            i++;
        }

    });

    it("Test 5: Will make multiple swaps, and collect the fees from there ", async () => {
        console.log("\n\n\n\n\nTest 5: Claim fees...");

        const poolDataBefore = await market.get(pair);
        printPoolData("Pool data before is: ", poolDataBefore);
        await printUserTokens("Before Claim", accountX, accountY, tokenX, tokenY)

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

        const poolDataAfter = await market.get(pair);
        printPoolData("Pool data after is: ", poolDataAfter);
        await printUserTokens("After Claim", accountX, accountY, tokenX, tokenY)

    });


});
