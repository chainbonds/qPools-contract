import * as anchor from '@project-serum/anchor';
import {Program, Provider, BN, web3} from '@project-serum/anchor';
import {Keypair, PublicKey, Transaction} from '@solana/web3.js';
import { Network, SEED, Market, Pair } from '@invariant-labs/sdk';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createToken } from './invariant-utils';
import { assert } from 'chai';
import { DENOMINATOR } from '@invariant-labs/sdk';
import { TICK_LIMIT } from '@invariant-labs/sdk';
import { tou64 } from '@invariant-labs/sdk';
import { fromFee } from '@invariant-labs/sdk/lib/utils';
import { FeeTier, Decimal } from '@invariant-labs/sdk/lib/market';
import { toDecimal } from '@invariant-labs/sdk/src/utils';
import {createMint, getPayer} from "./utils";
import {solbondProgram} from "../../dapp/src/programs/solbond";
import {invariantAmmProgram} from "./external_programs/invariant_amm";

const NUMBER_POOLS = 5;

describe('claim', () => {
    const provider = Provider.local()
    const connection = provider.connection

    const solbondProgram = anchor.workspace.Solbond;
    const invariantProgram = anchor.workspace.Amm;
    const payer = getPayer();

    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair
    const mintAuthority = Keypair.generate()
    const positionOwner = Keypair.generate()
    const admin = Keypair.generate()
    const market = new Market(
        Network.LOCAL,
        provider.wallet,
        connection,
        anchor.workspace.Amm.programId
    )
    const feeTier: FeeTier = {
        fee: fromFee(new BN(600)),
        tickSpacing: 10
    }
    const protocolFee: Decimal = { v: fromFee(new BN(10000))}
    let tokenX: Token
    let tokenY: Token
    let programAuthority: PublicKey
    let nonce: number

    let allPairs: Pair[];
    let allTokens: Token[];

    before(async () => {

        await Promise.all([
            await connection.requestAirdrop(mintAuthority.publicKey, 1e9),
            await connection.requestAirdrop(admin.publicKey, 1e9),
            await connection.requestAirdrop(positionOwner.publicKey, 1e9)
        ])

        allTokens = await Promise.all(Array.from({length: 2 * NUMBER_POOLS}).map((_) => {
            return createToken(connection, wallet, mintAuthority)
        }));

        const swaplineProgram = anchor.workspace.Amm as Program
        const [_programAuthority, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(SEED)],
            swaplineProgram.programId
        )
        nonce = _nonce
        programAuthority = _programAuthority

        let i = 0;
        allPairs = Array.from({length: NUMBER_POOLS}).map((_) => {
            let pair = new Pair(allTokens[2*i].publicKey, allTokens[(2*i)+1].publicKey, feeTier);
            i++;
            return pair;
        });

    })

    let bondPoolRedeemableMint: Token | null = null;
    let bondPoolCurrencyTokenMint: Token | null = null;
    let bondPoolRedeemableTokenAccount: PublicKey | null = null;
    //let bondPoolTokenAccount: PublicKey | null = null;
    let bondPoolAccount: PublicKey | null = null;
    let bumpBondPoolAccount: number | null = null;
    let bondPoolTokenAccount: PublicKey | null = null;

    it('#initializeBondPoolAccounts()', async () => {

        // Airdrop some solana for computation purposes
        await provider.connection.requestAirdrop(payer.publicKey, 100 * 1e9);

        // Create the bondPoolAccount as a PDA
        [bondPoolAccount, bumpBondPoolAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            solbondProgram.programId
        );
        // Token account has to be another PDA, I guess

        // Create the Mints that we will be using
        bondPoolCurrencyTokenMint = await createMint(provider, payer);
        bondPoolRedeemableMint = await createMint(provider, payer, bondPoolAccount, 9);

        bondPoolRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(bondPoolAccount);
        bondPoolTokenAccount = await bondPoolCurrencyTokenMint.createAccount(bondPoolAccount);

    });
    it('#initializeBondPool()', async () => {
        const initializeTx = await solbondProgram.rpc.initializeBondPool(
            bumpBondPoolAccount,
            {
                accounts: {
                    bondPoolAccount: bondPoolAccount,
                    bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
                    bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
                    bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
                    bondPoolTokenAccount: bondPoolTokenAccount,
                    initializer: payer.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [payer]
            }
        );
        await provider.connection.confirmTransaction(initializeTx);
    });


    it("#connectsToSolbond()", async () => {
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

    it('#createState()', async () => {
        await market.createState(admin, protocolFee)
    })
    it('#createFeeTier()', async () => {
        await market.createFeeTier(feeTier, admin)
    })

    // Create 10 pools, one for each pair
    // Make this async, maybe
    it('#create()', async () => {

        for (let i = 0; i < NUMBER_POOLS; i++) {

            let pair = allPairs[i];

            // 0.6% / 10
            await market.create({
                pair,
                signer: admin
            })
            const createdPool = await market.get(pair)

            const tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet)
            const tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet)

            assert.ok(createdPool.tokenX.equals(tokenX.publicKey), ("createdPool.tokenX === tokenX.publicKey) " + createdPool.tokenX.toString() + " " + tokenX.publicKey.toString()));
            assert.ok(createdPool.tokenY.equals(tokenY.publicKey), ("createdPool.tokenY === tokenY.publicKey) " + createdPool.tokenY.toString() + " " + tokenY.publicKey.toString()));
            assert.ok(createdPool.fee.v.eq(feeTier.fee), ("createdPool.fee.v.eq(feeTier.fee)"));
            assert.equal(createdPool.tickSpacing, feeTier.tickSpacing, ("createdPool.tickSpacing, feeTier.tickSpacing"));
            assert.ok(createdPool.liquidity.v.eqn(0), ("createdPool.liquidity.v.eqn(0)"));
            assert.ok(createdPool.sqrtPrice.v.eq(DENOMINATOR), ("createdPool.sqrtPrice.v.eq(DENOMINATOR)"));
            assert.ok(createdPool.currentTickIndex == 0, ("createdPool.currentTickIndex == 0"));
            assert.ok(createdPool.feeGrowthGlobalX.v.eqn(0), ("createdPool.feeGrowthGlobalX.v.eqn(0)"));
            assert.ok(createdPool.feeGrowthGlobalY.v.eqn(0), ("createdPool.feeGrowthGlobalY.v.eqn(0)"));
            assert.ok(createdPool.feeProtocolTokenX.v.eqn(0), ("createdPool.feeProtocolTokenX.v.eqn(0)"));
            assert.ok(createdPool.feeProtocolTokenY.v.eqn(0), ("createdPool.feeProtocolTokenY.v.eqn(0)"));
            assert.ok(createdPool.authority.equals(programAuthority), ("createdPool.authority.equals(programAuthority)"));
            assert.ok(createdPool.nonce == nonce, ("createdPool.nonce == nonce"));

            const tickmapData = await market.getTickmap(pair)
            assert.ok(tickmapData.bitmap.length == TICK_LIMIT / 4, "tickmapData.bitmap.length == TICK_LIMIT / 4")
            assert.ok(tickmapData.bitmap.every((v) => v == 0), "tickmapData.bitmap.every((v) => v == 0)")
        }

        return true;

    })

    let poolList: PublicKey | null;
    let poolListBump: number;

    it("#registerInvariantPools()", async () => {

        // Get the addresses of some of the pools that we generated
        [poolList, poolListBump] = await anchor.web3.PublicKey.findProgramAddress(
            [wallet.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("poolList"))],
            solbondProgram.programId
        );

        let marketAddresses: PublicKey[] = [];
        let reserveTokenXAddresses: PublicKey[] = [];
        let reserveTokenYAddresses: PublicKey[] = [];
        // For each pair, get the market addresses
        for (let i = 0; i < NUMBER_POOLS; i++) {

            let pair = allPairs[i];
            const [marketAddress, marketAddressBump] = await pair.getAddressAndBump(market.program.programId);
            marketAddresses.push(marketAddress);

            const tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet);
            const tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet);

            // For each token, generate an account for the reserve
            let reserveTokenXAccount = await tokenX!.createAccount(bondPoolAccount);
            reserveTokenXAddresses.push(reserveTokenXAccount);
            let reserveTokenYAccount = await tokenY!.createAccount(bondPoolAccount);
            reserveTokenYAddresses.push(reserveTokenYAccount);
        }

        // Call the health-checkpoint
        await solbondProgram.rpc.registerInvariantPools(
            poolListBump,
            [new BN(10), new BN(10), new BN(10), new BN(10), new BN(10)],
            {
                accounts: {

                    poolList: poolList,
                    poolListAddress0: marketAddresses[0],
                    poolListAddress1: marketAddresses[1],
                    poolListAddress2: marketAddresses[2],
                    poolListAddress3: marketAddresses[3],
                    poolListAddress4: marketAddresses[4],
                    initializer: wallet.publicKey,

                    reserveTokenXAddress0: reserveTokenXAddresses[0],
                    reserveTokenXAddress1: reserveTokenXAddresses[1],
                    reserveTokenXAddress2: reserveTokenXAddresses[2],
                    reserveTokenXAddress3: reserveTokenXAddresses[3],
                    reserveTokenXAddress4: reserveTokenXAddresses[4],

                    reserveTokenYAddress0: reserveTokenYAddresses[0],
                    reserveTokenYAddress1: reserveTokenYAddresses[1],
                    reserveTokenYAddress2: reserveTokenYAddresses[2],
                    reserveTokenYAddress3: reserveTokenYAddresses[3],
                    reserveTokenYAddress4: reserveTokenYAddresses[4],

                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [wallet]
            }
        );
    })

    it("#createReserveTokenAccount()", async () => {

        // For each of the pairs, create a reserve-token-account


    })

    // let bondPoolAccount: PublicKey | null = null;  // The bond pool reserve account
    // let bondPoolRedeemableMint: Token | null = null;
    // let bondPoolCurrencyTokenMint: Token | null = null;
    // let bondPoolRedeemableTokenAccount: PublicKey | null = null;
    // //let bondPoolTokenAccount: PublicKey | null = null;
    // let bumpBondPoolAccount: number | null = null;
    // let bondPoolTokenAccount: PublicKey | null = null;
    //
    // it('#initializeSolbondWorld()', async () => {
    //
    //     // Airdrop some solana for computation purposes
    //     await provider.connection.requestAirdrop(payer.publicKey, 1e9);
    //
    //     // Create the bondPoolAccount as a PDA
    //     [bondPoolAccount, bumpBondPoolAccount] = await PublicKey.findProgramAddress(
    //         [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
    //         solbondProgram.programId
    //     );
    //     // Token account has to be another PDA, I guess
    //
    //     // Create the Mints that we will be using
    //     bondPoolCurrencyTokenMint = await createMint(provider, payer);
    //     bondPoolRedeemableMint = await createMint(provider, payer, bondPoolAccount, 9);
    //
    //     bondPoolRedeemableTokenAccount = await bondPoolRedeemableMint!.createAccount(bondPoolAccount);
    //     bondPoolTokenAccount = await bondPoolCurrencyTokenMint.createAccount(bondPoolAccount);
    // });


    // it('#initializeSolbondReserve', async () => {
    //
    //     const initializeTx = await solbondProgram.rpc.initializeBondPool(
    //         bumpBondPoolAccount,
    //         {
    //             accounts: {
    //                 bondPoolAccount: bondPoolAccount,
    //                 bondPoolRedeemableMint: bondPoolRedeemableMint.publicKey,
    //                 bondPoolTokenMint: bondPoolCurrencyTokenMint.publicKey,
    //                 bondPoolRedeemableTokenAccount: bondPoolRedeemableTokenAccount,
    //                 bondPoolTokenAccount: bondPoolTokenAccount,
    //                 initializer: payer.publicKey,
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //                 clock: web3.SYSVAR_CLOCK_PUBKEY,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 tokenProgram: TOKEN_PROGRAM_ID
    //             },
    //             signers: [payer]
    //         }
    //     );
    //     const tx = await provider.connection.confirmTransaction(initializeTx);
    //     console.log(tx);
    //     console.log("initializeTx signature", initializeTx);
    // });


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
