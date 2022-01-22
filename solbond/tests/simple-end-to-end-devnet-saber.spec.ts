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
import {Connection, Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import {
    airdropAdmin,
    createAssociatedTokenAccountUnsigned,
    getAssociatedTokenAddressOffCurve,
    getSolbondProgram,
    MOCK
} from "@qpools/sdk";
import {getInvariantProgram, QPair, QPoolsAdmin} from "@qpools/admin-sdk/lib/qpools-admin-sdk/src";
import {NETWORK} from "@qpools/sdk/lib/cluster";
import {Token} from "@solana/spl-token";
import {assert} from "chai";
import {FEE_TIER, getMarketAddress, Market, Network, Pair} from "@invariant-labs/sdk";
import * as saber from "@saberhq/stableswap-sdk";
import {DepositInstruction, SwapInstruction} from "@saberhq/stableswap-sdk/src/instructions/swap";
import {
    IExchange,
    StableSwap,
    StableSwapConfig,
    StableSwapState,
    SWAP_PROGRAM_ID,
    WithdrawInstruction
} from "@saberhq/stableswap-sdk";
import {tou64} from "@qpools/sdk/lib/utils";
import {token} from "easy-spl";

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
    console.log("Solbond Program");
    console.log(solbondProgram.programId.toString());

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
        // Take the currency mint from the user SDK
        currencyMint = new Token(connection, MOCK.DEV.SOL, solbondProgram.programId, currencyOwner);
        assert.ok(currencyMint.publicKey.equals(MOCK.DEV.SOL), currencyMint.publicKey.toString());
    })

    // All token accounts
    let allSwapAccounts = [
        MOCK.DEV.SABER_POOL.USDC_USDT,
        MOCK.DEV.SABER_POOL.USDC_CASH,
        MOCK.DEV.SABER_POOL.USDC_PAI,
        MOCK.DEV.SABER_POOL.TEST_USDC
    ];
    // Replace this by a forloop for all pools later
    let swapAccount: PublicKey = new PublicKey(allSwapAccounts[0]);
    // TODO: Assume USDC<->USDT Swaps!

    // TODO: I hardcode the qpt contract here, but should prob use the admin SDK to retrieve the respective address!
    // Or create the respective address ...
    // let qPoolAccount: PublicKey = new PublicKey("7JpdFrdigDtzM1r6mnKXNS645dDKTKwkz2waF2HUJoVT");
    let qPoolAccount: PublicKey = new PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs");

    let userUsdtAccount: PublicKey;
    let currencyAccount: PublicKey;

    let stableSwap: StableSwap;

    let poolUserAccount: PublicKey;

    it("#loadsSaber()", async () => {

        // Assume we have a bunch of USDC
        currencyMint = new Token(connection, MOCK.DEV.SABER_USDC, solbondProgram.programId, genericPayer);

        // Load the stableSwap program
        stableSwap = await StableSwap.load(
            connection,
            swapAccount,
            SWAP_PROGRAM_ID
        );

        // Should be BvRsZMznoYKzgZ2XxHRjbkFGoRUSGJvns4Csc4pBsHSR
        // for out local account DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs
        currencyAccount = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, qPoolAccount);

        // Create the associated token accounts for the target currencies if these don't exist yet
        // Gotta create a USDT associated token account
        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                connection,
                MOCK.DEV.SABER_USDT,
                null,
                qPoolAccount,
                provider.wallet
            );
            const sg = await connection.sendTransaction(tx, [genericPayer]);
            await connection.confirmTransaction(sg);
            console.log("Signature is: ", sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }

        userUsdtAccount = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDT, qPoolAccount);

        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                connection,
                stableSwap.state.poolTokenMint,
                null,
                qPoolAccount,
                provider.wallet
            );
            const sg = await connection.sendTransaction(tx, [genericPayer]);
            await connection.confirmTransaction(sg);
            console.log("Signature is: ", sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }
        poolUserAccount = await getAssociatedTokenAddressOffCurve(stableSwap.state.poolTokenMint, qPoolAccount);

        console.log("Source account is: ", currencyAccount.toString());

    })

    it("#makeSwap()", async () => {

        let tx = new Transaction();

        // TODO: Obviously we cannot do this, because the qPoolAccount is a PDA,
        //  and we cannot do logic on behalf of a PDA in a TS test

        console.log("Tokens A and B are: ");
        console.log(stableSwap.state.tokenA.mint.toString());
        console.log(stableSwap.state.tokenB.mint.toString());

        // How do I know which one is tokenA and which one is tokenB
        let swapIx: SwapInstruction = {
            config: stableSwap.config,
            adminDestination: stableSwap.state.tokenB.adminFeeAccount,
            amountIn: tou64(50),
            minimumAmountOut: tou64(30),
            // Or are these the fee-accounts?
            poolSource: stableSwap.state.tokenA.reserve,
            poolDestination: stableSwap.state.tokenB.reserve,
            userAuthority: qPoolAccount,
            userDestination: userUsdtAccount,
            userSource: currencyAccount
        }
        let swapTx = await saber.swapInstruction(swapIx);
        tx = tx.add(swapTx);
        const sg = await connection.sendTransaction(tx, [genericPayer]);
        await connection.confirmTransaction(sg);
    })

    it("#depsitsToTheSaberPools()", async () => {

        // Solana get how many USDC is provided ...


        let tx = new Transaction();
        let depositIx: DepositInstruction = {
            config: stableSwap.config,
            userAuthority: qPoolAccount,
            // What is Token A and Token B, does the order matter?
            sourceA: currencyAccount,
            sourceB: userUsdtAccount,
            tokenAccountA: stableSwap.state.tokenA.reserve,
            tokenAccountB: stableSwap.state.tokenB.reserve,
            poolTokenMint: stableSwap.state.poolTokenMint,
            // User
            poolTokenAccount: poolUserAccount,
            // Provide these in an equal ratio ...
            tokenAmountA: tou64(10),
            tokenAmountB: tou64(10),
            minimumPoolTokenAmount: tou64(3)
        }
        let swapTx = await saber.depositInstruction(depositIx);
        tx = tx.add(swapTx);
        const sg = await connection.sendTransaction(tx, [genericPayer]);
        await connection.confirmTransaction(sg);

    });

    it("#withdrawFromTheSaberPools()", async () => {

        let tx = new Transaction();
        let withdrawIx: WithdrawInstruction = {
            config: stableSwap.config,
            userAuthority: qPoolAccount,
            poolMint: stableSwap.state.poolTokenMint,
            tokenAccountA: stableSwap.state.tokenA.reserve,
            tokenAccountB: stableSwap.state.tokenB.reserve,
            // what are these?
            adminFeeAccountA: stableSwap.state.tokenA.adminFeeAccount,
            adminFeeAccountB: stableSwap.state.tokenB.adminFeeAccount,
            sourceAccount: poolUserAccount,
            userAccountA: currencyAccount,
            userAccountB: userUsdtAccount,
            poolTokenAmount: tou64(10),
            minimumTokenA: tou64(3),
            minimumTokenB: tou64(3),
        }
        let swapTx = saber.withdrawInstruction(withdrawIx);
        tx = tx.add(swapTx);
        const sg = await connection.sendTransaction(tx, [genericPayer]);
        await connection.confirmTransaction(sg);

    })

    // /** Initialize a mock market object*/
    // it('#initializeMockMarket()', async () => {
    //     market = new QPoolsAdmin(
    //         connection,
    //         provider,
    //         currencyMint.publicKey,
    //         NETWORK.DEVNET
    //     );
    //
    //     let programId = new PublicKey(getMarketAddress(Network.DEV));
    //     invariantMarket = await Market.build(Network.DEV, genericWallet, connection, programId);
    //
    // })

    // Actually, not even sure if this is needed at all
    let stateAddress: PublicKey;
    let stateAddressBump: number;

    /**
     * Create Trade Pairs
     * feeTiers are created as pools are created anyways
     * */
    // let pairs: {[index: string]: any;} = {};
    // let feeTier: FeeTier = {
    //     fee: fromFee(new BN(40))
    // };
    // // let feeTier = FEE_TIER[0];
    //
    // /** Create Pairs */
    // it('#createPairs', async () => {
    //     // Create a couple pairs one for each market
    //     // These tokens were manually created ov erCLI
    //     pairs["SOL/USDC"] = new QPair(
    //         MOCK.DEV.SOL,
    //         MOCK.DEV.USDC,
    //         feeTier
    //     )
    //     pairs["SOL/mSOL"] = new QPair(
    //         MOCK.DEV.SOL,
    //         MOCK.DEV.MSOL,
    //         feeTier
    //     )
    //     pairs["USDC/mSOL"] = new QPair(
    //         MOCK.DEV.USDC,
    //         MOCK.DEV.MSOL,
    //         feeTier
    //     )
    //     pairs["USDC/SOL"] = pairs["SOL/USDC"]
    //     pairs["mSOL/SOL"] = pairs["SOL/mSOL"]
    //     pairs["mSOL/USDC"] = pairs["USDC/mSOL"]
    //
    //     // TODO: Figure out what to follow here
    //     // Because we need to act as if we have this money
    //     // We probably will need to re-create each feeTier, state, etc. ourselves
    //
    //     for (let pairString in pairs) {
    //         let qpair = pairs[pairString];
    //         console.log("qpair is: ", qpair);
    //
    //         // If either exists, then
    //         // If the fee tier does not exist yet, create the feeTier
    //         let feeTierAccount;
    //         // let feeTierAddress = await qpair.getFeeTierAddress(invariantProgram.programId);
    //         let {address, bump} = await invariantMarket.getFeeTierAddress(market.feeTier);
    //         let feeTierAddress = address;
    //         try {
    //             feeTierAccount = (await invariantProgram.account.feeTier.fetch(feeTierAddress)) as FeeTier;
    //         } catch (e) {
    //             console.log("Error trying to fetch fee-tier!");
    //             console.log(e);
    //             let createFeeTier: CreateFeeTier = {
    //                 admin: genericPayer.publicKey,
    //                 feeTier: feeTier
    //             };
    //             let tx = await invariantMarket.createFeeTierTransaction(createFeeTier);
    //             console.log("Creating fee tier..");
    //             let sg = await connection.sendTransaction(tx, [genericPayer]);
    //             console.log("TX Sig: ", sg);
    //             await connection.confirmTransaction(sg, "finalized");
    //             // await invariantMarket.createFeeTier(createFeeTier, genericPayer);
    //             // await delay(2000);
    //             console.log("Fetch again...");
    //             feeTierAccount = (await invariantProgram.account.feeTier.fetch(feeTierAddress)) as FeeTier;
    //         }
    //
    //         // If the pool does not exist yet, create the pool
    //         let poolAccount;
    //         let poolAddress = await qpair.getAddress(invariantProgram.programId);
    //         try {
    //             poolAccount = (await invariantProgram.account.pool.fetch(poolAddress)) as PoolStructure;
    //         } catch (e) {
    //             console.log("Error trying to fetch pool account!");
    //             console.log(e)
    //             // let's just assume that the initial tick is at zero
    //             let tokenX = new Token(connection, qpair.tokenX, invariantProgram.programId, genericPayer);
    //             let tokenY = new Token(connection, qpair.tokenY, invariantProgram.programId, genericPayer);
    //             let createPool: CreatePool = {
    //                 pair: qpair,
    //                 payer: genericPayer,
    //                 protocolFee: protocolFee,
    //                 tokenX: tokenX,
    //                 tokenY: tokenY
    //             };
    //             // sha256("global:your_ix_name")[..8] this part is missing in the function ix ...
    //             console.log("Create pool is: ", qpair, JSON.stringify(protocolFee), tokenX.publicKey.toString(), tokenY.publicKey.toString());
    //             await invariantMarket.createPool(createPool);
    //             console.log("Created pool!");
    //             poolAccount = (await invariantProgram.account.pool.fetch(poolAddress)) as PoolStructure;
    //         }
    //
    //         // For each of these pairs, create a pool if it doesn't exist yet
    //     }
    //
    // })


})