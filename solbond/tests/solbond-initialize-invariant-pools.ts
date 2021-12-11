import * as anchor from "@project-serum/anchor";
import {Program, Provider} from "@project-serum/anchor";
import {getPayer} from "./utils";
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Network, SEED, DENOMINATOR, Market, Pair, tou64} from '@invariant-labs/sdk';
import {invariantAmmProgram} from "./external_programs/invariant_amm";
import {createPoolWithLiquidity, createTokensAndPool} from "./invariant-utils";
import BN from "bn.js";
import {Decimal} from "@invariant-labs/sdk/lib/market";
import {fromFee} from "@invariant-labs/sdk/lib/utils";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {toDecimal} from "../sdk/lib/utils";
import {assert} from "chai";
import {getTickFromPrice} from "../deps/invariant/sdk/src/tick";
import {PoolStructure} from "@invariant-labs/sdk/lib/market";

/*
    TODO 1: What is liquidityDelta for? What does it exactly describe?
 */
// The simulated tokens each have 6 decimal points;
// As such, most of them items about 10^6
// const DEFAULT_LIQUIDITY_TO_PROVIDE = 10_000_000;
const TOKEN_MINT_AMOUNT = new BN(10).pow(new BN(10));
// This liquidity delta is x * y, because this will still always equal to K,
// this is the value we provide!!!
// Thus, it needs to be token amount 1 times token amount 2 (this grows exponentially as it is provided)
// .pow(new BN(25)).mul(new BN(2.5))
const DEFAULT_LIQUIDITY_DELTA = new BN(10).pow(new BN(25));
// const DEFAULT_LIQUIDITY_DELTA = new BN(10).pow(new BN(1_000_000));

const DEFAULT_SOLANA_AIRDROP_AMOUNT = 2_000_000;
// Cannot be too high, otherwise rust panic's
const PROTOCOL_FEE = 100_000;
const SWAP_AMOUNT = 1_000_000;

// .div(new BN(1_000_000))
const printPoolData = async (title, poolData: PoolStructure, tokenAMint, tokenBMint) => {
    console.log(title);
    console.log("liquidity: ", poolData.liquidity.v.toString());
    console.log("sqrtPrice: ", poolData.sqrtPrice.v.toString());
    console.log("currentTickIndex: ", poolData.currentTickIndex);
    console.log("feeGrowthGlobalX: ", poolData.feeGrowthGlobalX.v.toString());
    console.log("feeGrowthGlobalY: ", poolData.feeGrowthGlobalY.v.toString());
    console.log("token X Reserve", (await tokenAMint.getAccountInfo(poolData.tokenXReserve)).amount.toString());
    console.log("token Y Reserve", (await tokenBMint.getAccountInfo(poolData.tokenYReserve)).amount.toString());
}

// .div(new BN(1_000_000))
const printUserTokens = async (title, userAccountA, userAccountB, tokenAMint, tokenBMint) => {
    console.log(title);
    console.log("token X", (await tokenAMint.getAccountInfo(userAccountA)).amount.toString());
    console.log("token Y", (await tokenBMint.getAccountInfo(userAccountB)).amount.toString());
}

// This is how we go from price to tick (and there is a similar  function to go vice-versa I guess
// const poolData = await market.get(pair);
// const lowPrice = getTickFromPrice(
//     poolData.currentTickIndex,
//     poolData.tickSpacing,
//     poolData.sqrtPrice,
//     true
// );
// const highPrice = getTickFromPrice(
//     poolData.currentTickIndex,
//     poolData.tickSpacing,
//     poolData.sqrtPrice,
//     true
// );



describe('solbond-yield-farming', () => {

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const connection: Connection = provider.connection;

    // Have one Solbond Program
    // And have one InvariantAMM Program

    // We need to access another program, the AMM program!
    const solbondProgram = anchor.workspace.Solbond;

    // This will not change, so we can just import using the IDL
    const invariantProgramId = new anchor.web3.PublicKey("3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY");
    const invariantProgram = invariantAmmProgram(connection, provider, invariantProgramId);

    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair;
    const positionOwner = Keypair.generate();
    // Provides majority of the liquidity to the pool
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
        await market.createState(wallet, protocolFee);

        // Initialize pools, including token, feeTier, pair, including a lot of liquidity
        // This pool will provide very little liquidity
        ({pair, mintAuthority} = (await createPoolWithLiquidity(
            market,
            connection,
            admin,
            { v: new BN(10).pow(new BN(6)) }
        )));
    });

    let accountX: PublicKey;
    let accountY: PublicKey;

    it("Test 2: Prepare tokens for liquidity providing", async () => {
        console.log("\nTest 2: Prepare tokens for liquidity providing");

        tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet);
        tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet);
        accountX = await tokenX.createAccount(positionOwner.publicKey);
        accountY = await tokenY.createAccount(positionOwner.publicKey);

        await tokenX.mintTo(accountX, mintAuthority.publicKey, [mintAuthority], tou64(TOKEN_MINT_AMOUNT));
        await tokenY.mintTo(accountY, mintAuthority.publicKey, [mintAuthority], tou64(TOKEN_MINT_AMOUNT));
    });

    it("Test 3: Provide Liquidity: ", async () => {
        console.log("\nTest 3: Provide Liquidity");
        const poolDataBefore = await market.get(pair);
        await printPoolData("(1-): ", poolDataBefore, tokenX, tokenY);
        await printUserTokens("(1-): ", accountX, accountY, tokenX, tokenY)

        // And how do we actually calculate the best ticks,
        // also considering that there is slippage, changes, etc.
        const upperTick = 20;
        const lowerTick = -20;
        const liquidityDelta: Decimal = { v: DEFAULT_LIQUIDITY_DELTA };

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

        const poolDataAfter = await market.get(pair);
        await printPoolData("(1+): ", poolDataAfter, tokenX, tokenY);
        await printUserTokens("(1+): ", accountX, accountY, tokenX, tokenY)

    });


    it("Test 4: Will make multiple swaps, and collect the fees from there ", async () => {
        console.log("\n\n\nTest 4: Collecting trading fees");

        const poolDataBefore = await market.get(pair);
        await printPoolData("(1-)", poolDataBefore, tokenX, tokenY);
        await printUserTokens("(1-)", accountX, accountY, tokenX, tokenY)

        /* Run a bunch of swaps */
        let i = 0;
        while (i < 5) {
            console.log("User number who is swapping:", i);

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

            // We now need to swap tokenX to tokenY before we can possible provide liquidity
            // Apparently, this one allows us to receive the price information
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

            i++;
        }

        /* Now claim profits */
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
        await printPoolData("(1+): ", poolDataAfter, tokenX, tokenY);
        await printUserTokens("(1+)", accountX, accountY, tokenX, tokenY);

        // await market.withdrawProtocolFee(
        //     pair,
        //     accountX,
        //     accountY,
        //     positionOwner
        // );
        //
        // const poolDataAfter2 = await market.get(pair);
        // printPoolData("(1++): ", poolDataAfter2);
        // await printUserTokens("(1++)", accountX, accountY, tokenX, tokenY);


    });

});
