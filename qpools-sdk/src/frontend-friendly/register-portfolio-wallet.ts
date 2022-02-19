import {Connection, Keypair, PublicKey, Signer, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {SaberInteractTool} from "../saber-cpi-endpoints";
import {
    calculateVirtualPrice,
    findSwapAuthorityKey,
    IExchangeInfo,
    StableSwap,
    StableSwapState
} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "../const";
import {sendAndConfirm} from "easy-spl/dist/util";
import {WalletI} from "easy-spl";
import {SaberInteractToolFrontendFriendly} from "./saber-cpi-endpoints-wallet";
import {createAssociatedTokenAccountSendUnsigned, getAssociatedTokenAddressOffCurve} from "../utils";
import {SEED} from "../seeds";
import {PortfolioAccount} from "../types/portfolioAccount";
import {PositionAccount} from "../types/positionAccount";
import {TwoWayPoolAccount} from "../types/twoWayPoolAccount";
import {delay} from "../utils";

export interface PositionsInput {
    percentageWeight: BN,
    poolAddress: PublicKey,
    amount: u64
}

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class PortfolioFrontendFriendly extends SaberInteractToolFrontendFriendly {

    public portfolioPDA: PublicKey;
    public portfolioBump: number;
    public poolAddresses: Array<PublicKey>;
    public portfolio_owner: PublicKey;

    public payer: Keypair;
    public owner: WalletI;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program
    ) {
        super(
            connection,
            provider,
            solbondProgram
        );

        // Also save all the pool here
        this.poolAddresses = [
            MOCK.DEV.SABER_POOL.USDC_USDT,
            MOCK.DEV.SABER_POOL.USDC_CASH,
            MOCK.DEV.SABER_POOL.USDC_TEST
        ];

        this.owner = provider.wallet;
        // @ts-expect-error
        this.payer = provider.wallet.payer as Keypair;

        PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        ).then(([portfolioPDA, bumpPortfolio]) => {
            this.portfolioPDA = portfolioPDA
            this.portfolioBump = bumpPortfolio
        }).finally(() => {});
        delay(1000);

    }


    /**
     * A bunch of getter functions to display the information that was saved (or, not saved)
     * @param amount
     */
    // Get all accounts, print them, and return them
    /**
     * Get all the portfolio's that were created by the user
     */
    async fetchPortfolio(): Promise<PortfolioAccount> {
        console.log("#fetchPortfolio()");

        let [portfolioPDA, _] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );
        this.portfolioPDA = portfolioPDA;

        // Now get accounts data of this PDA
        // this.solbondProgram.account
        // Of course, this might not exist yet!
        let response = await this.solbondProgram.account.portfolioAccount.fetch(portfolioPDA);
        let portfolioContent = response as PortfolioAccount;
        console.log("Portfolio Content", portfolioContent);
        console.log("##fetchPortfolio()");
        return portfolioContent;
    }

    async fetchAllPools(): Promise<TwoWayPoolAccount[]> {
        console.log("#fetchAllPools()");
        // Right now, we only have 3 liquidity pools, and that's it!
        let responses = [];

        // For each pool, return the address
        for (var i = 0; i < 3; i++) {
            let poolAddress = this.poolAddresses[i];

            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;

            let poolContent = await this.fetchSinglePool(state);
            console.log("TwoWayPoolAccount Content", poolContent);
            responses.push(poolContent);

        }
        console.log("##fetchAllPools()");
        return responses;
    }

    async fetchSinglePool(state: StableSwapState): Promise<TwoWayPoolAccount> {
        console.log("#fetchSinglePool()");
        // Pool token mint is generated from the unique, pool address. As such, this is already an iterator!
        let [poolPDA, _] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );

        let response = await this.solbondProgram.account.twoWayPoolAccount.fetch(poolPDA);
        let poolContent = response as TwoWayPoolAccount;
        console.log("##fetchSinglePool()");
        return poolContent;
    }

    async fetchAllPositions(): Promise<PositionAccount[]> {
        console.log("#fetchAllPositions()");

        // Right now, we only have 3 liquidity pools, and that's it!
        let responses = [];

        // For each pool, return the address
        for (var i = 0; i < 3; i++) {
            let poolAddress = this.poolAddresses[i];

            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;

            let positionContent = await this.fetchSinglePosition(i);
            console.log("Position Content", positionContent);
            responses.push(positionContent);

        }
        console.log("##fetchAllPositions()");
        return responses;
    }

    async fetchSinglePosition(index: number) {
        console.log("#fetchSinglePosition()");
        let [positonPDA, bumpPositon] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM + index.toString()))],
            this.solbondProgram.programId
        );

        let response = await this.solbondProgram.account.positionAccount.fetch(positonPDA);
        let positionContent = response as PositionAccount;
        console.log("##fetchSinglePosition()");
        return positionContent;
    }

    async transferUsdcToPortfolio(amount: u64) {
        console.log("#transferUsdcToPortfolio()");
        // Get associated token account for the Saber USDC Token
        console.log("Get PDA userUSDC");
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        // TODO: If this account is empty, return an error! As this must already be existent!
        // All get the portfolio PDAs USDC ATA
        console.log("portfolio USDC");
        let pdaUSDCAccount = await this.getAccountForMintAndPDA(MOCK.DEV.SABER_USDC, this.portfolioPDA);
        // Assume that this account exists already

        console.log("Making transfer ...");
        console.log("Payer is: ", this.payer);
        let tx = await this.solbondProgram.rpc.transferToPortfolio(
            new BN(this.portfolioBump),
            amount,
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    userOwnedTokenAccount: userUSDCAta,
                    pdaOwnedTokenAccount: pdaUSDCAccount,
                    tokenMint: MOCK.DEV.SABER_USDC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                },
                signers: [this.payer]
            }

        )
        let sg = await this.provider.connection.confirmTransaction(tx);
        console.log("Sending money tx: ", sg);
        console.log("##transferUsdcToPortfolio()");
        return tx;
    }

    async transferToUser() {
        console.log("#transferToUser()");
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        let pdaUSDCAccount = await this.getAccountForMintAndPDA(MOCK.DEV.SABER_USDC, this.portfolioPDA);

        // Get all token balance on the pda USDC
        let totalPDA_USDCAmount = (await this.connection.getTokenAccountBalance(pdaUSDCAccount)).value.amount;

        let tx = await this.solbondProgram.rpc.transferRedeemedToUser(
            new BN(this.portfolioBump),
            new BN(totalPDA_USDCAmount),
            {
                accounts: {
                    portfolioOwner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    userOwnedUserA: userUSDCAta,
                    pdaOwnedUserA: pdaUSDCAccount,
                    tokenMint: MOCK.DEV.SABER_USDC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                },
                signers: [this.payer]
            }

        )
        let sg = await this.provider.connection.confirmTransaction(tx);
        console.log("Sending money tx: ", sg);
        console.log("##transferToUser()");
        return tx;
    }

    async registerLiquidityPool(poolAddress: PublicKey, state: StableSwapState) {
        console.log("#registerLiquidityPool()");

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );

        let tx = await this.solbondProgram.rpc.initializePoolAccount(
            new BN(poolBump),
            {
                accounts: {
                    initializer: this.owner.publicKey,
                    poolPda: poolPDA,
                    mintLp: state.poolTokenMint,
                    mintA: state.tokenA.mint,
                    mintB: state.tokenB.mint,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                },
                signers: [this.payer]
            }
        );
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);
        console.log("##registerLiquidityPool()");
    }

    async createSinglePosition(
        index: number,
        poolAddress: PublicKey,
        state: StableSwapState,
        stableSwapState: StableSwap,
        weight: BN,
        amountTokenA: u64
    ) {
        console.log("#createSinglePosition()");
        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );
        let [positonPDA, bumpPositon] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM + index.toString()))],
            this.solbondProgram.programId
        );
        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);

        // Creating ATA accounts if not existent yet ...
        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
        let userAccountPoolToken = await this.getAccountForMintAndPDA(state.poolTokenMint, this.portfolioPDA);

        // Amount A and amount B should be the maximum that is contained in both addresses!

        // Plan to install only in one of the pools
        let amount_a = (await this.connection.getTokenAccountBalance(userAccountA)).value.amount;
        let amount_b = (await this.connection.getTokenAccountBalance(userAccountB)).value.amount;

        // if (state.tokenA.mint.toString() === MOCK.DEV.SABER_USDC.toString()) {
        //     amount_a = amountTokenA
        //     console.log("A IS THE WAY")
        // } else {
        //     amount_b = amountTokenA
        //     console.log("B IS THE WAY")
        // }

        console.log("👀 positionPda ", positonPDA.toString())

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey", this.owner.publicKey.toString());

        console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountPoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤯 poolPDA", poolPDA.toString());

        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());

        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("👹 userAccountB", userAccountB.toString());

        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", state.poolTokenMint.toString());

        let tx = await this.solbondProgram.rpc.createPositionSaber(
            new BN(poolBump),
            new BN(bumpPositon),
            new BN(this.portfolioBump),
            new BN(index),
            new BN(weight),
            new BN(amount_a),
            new BN(amount_b),
            new BN(0),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: this.portfolioPDA,
                    owner: this.owner.publicKey,
                    poolMint: state.poolTokenMint,
                    outputLp: userAccountPoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    poolPda: poolPDA,
                    swap: stableSwapState.config.swapAccount,
                    qpoolsA: userAccountA,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    qpoolsB: userAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    saberSwapProgram: this.stableSwapProgramId,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [this.payer]
            }
        )
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);
        console.log("##createSinglePosition()");

    }

    async registerPortfolio(weights: Array<BN>) {
        console.log("#registerPortfolio()");

        console.log("Payer is: ", this.payer);
        let tx = await this.solbondProgram.rpc.savePortfolio(
            this.portfolioBump,
            weights,
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [this.payer]
            }
        )
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);
        console.log("##registerPortfolio()");

    }

    async createFullPortfolio(weights: Array<BN>, amounts: Array<u64>) {
        console.log("#createFullPortfolio()");

        for (var i = 0; i < weights.length; i++) {
            let w = weights[i];
            let amountTokenA = amounts[i];
            let poolAddress = this.poolAddresses[i];

            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;

            // First, register a liquidity position
            await this.registerLiquidityPool(
                poolAddress,
                state
            );
            await this.createSinglePosition(
                i,
                poolAddress,
                state,
                stableSwapState,
                w,
                amountTokenA
            )
        }
        console.log("##createFullPortfolio()");
    }

    async redeemFullPortfolio(amounts: Array<u64>) {
        console.log("#redeemFullPortfolio()");

        let transactions_sigs = []
        for (var i = 0; i < 3; i++) {

            let poolAddress = this.poolAddresses[i];

            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;

            await this.redeemSinglePositionOneSide(
                i,
                poolAddress,
                state,
                stableSwapState
            );

        }

        console.log("redeemed! the full portfolio!")
        console.log("##redeemFullPortfolio()");
    }

    async redeemSinglePosition(
        index: number,
        poolAddress: PublicKey,
        state: StableSwapState,
        stableSwapState: StableSwap
    ) {
        console.log("#redeemSinglePosition()");
        console.log("got state ", state);

        let poolTokenMint = state.poolTokenMint

        console.log("poolTokenMint ", poolTokenMint.toString());

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );

        console.log("poolPDA ", poolPDA.toString())

        let [positonPDA, bumpPositon] = await await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM + index.toString()))],
            this.solbondProgram.programId
        );

        console.log("positionPDA ", positonPDA.toString())

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())


        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
        //let userAccountA = await this.getAccountForMint(state.tokenA.mint);


        console.log("userA ", userAccountA.toString())
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
        //let userAccountB = await this.getAccountForMint(state.tokenB.mint);

        console.log("userB ", userAccountA.toString())


        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);
        //let userAccountpoolToken = await this.getAccountForMint(poolTokenMint);

        // Let's redeem all LP tokens
        let totalLPTokens = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value;
        console.log("Total tokens to redeem", totalLPTokens);

        console.log("👀 positionPda ", positonPDA.toString())

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey", this.owner.publicKey.toString());

        console.log("🟢 poolTokenMint", poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤯 poolPDA", poolPDA.toString());

        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());

        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("👹 userAccountB", userAccountB.toString());

        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", poolTokenMint.toString());

        console.log("Portfolio PDA : ", this.portfolioPDA.toString());

        let finaltx = await this.solbondProgram.rpc.redeemPositionSaber(
            new BN(this.portfolioBump),
            new BN(bumpPositon),
            new BN(poolBump),
            new BN(index),
            new BN(totalLPTokens.amount),
            new BN(1),
            new BN(0),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: this.owner.publicKey,
                    poolPda: poolPDA,
                    poolMint: poolTokenMint,
                    inputLp: userAccountpoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    swap: stableSwapState.config.swapAccount,
                    userA: userAccountA,
                    reserveA: state.tokenA.reserve,
                    reserveB: state.tokenB.reserve,
                    userB: userAccountB,
                    feesA: state.tokenA.adminFeeAccount,
                    feesB: state.tokenB.adminFeeAccount,
                    saberSwapProgram: this.stableSwapProgramId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [this.wallet]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("Single Redeem Transaction is : ", finaltx);

        let finaltx_update = await this.solbondProgram.rpc.updatePoolStruct(
            new BN(poolBump),
            {
                accounts: {
                    poolPda: poolPDA,
                    portfolioOwner: this.owner.publicKey,
                    poolMint: poolTokenMint,
                    userA: userAccountA,
                    userB: userAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [this.wallet]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx_update);
        console.log("Update Pool single TX Is : ", finaltx_update);

        console.log("##redeemSinglePosition()");
        return [finaltx];
    }

    async redeemSinglePositionOneSide(
        index: number,
        poolAddress: PublicKey,
        state: StableSwapState,
        stableSwapState: StableSwap
    ) {
        console.log("#redeemSinglePositionOneSide()");
        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );
        console.log("poolPDA ", poolPDA.toString());

        let [positonPDA, bumpPositon] = await await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PositionAccount"+index.toString()))],
            this.solbondProgram.programId
        );
        console.log("positionPDA ", positonPDA.toString())
        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())

        // Gotta cross-check which one is the currency token, in this case

        let currencyMint: PublicKey;
        let userAccount: PublicKey;

        let reserveA: PublicKey;
        let feesA: PublicKey;
        let mintA: PublicKey;
        let reserveB: PublicKey;
        if (MOCK.DEV.SABER_USDC.equals(state.tokenA.mint)) {
            currencyMint = state.tokenA.mint;
            userAccount = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);

            reserveA = state.tokenA.reserve
            feesA = state.tokenA.adminFeeAccount
            mintA = state.tokenA.mint
            reserveB = state.tokenB.reserve

        } else if (MOCK.DEV.SABER_USDC.equals(state.tokenB.mint)) {
            currencyMint = state.tokenB.mint;
            userAccount = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);

            reserveA = state.tokenB.reserve
            feesA = state.tokenB.adminFeeAccount
            mintA = state.tokenB.mint
            reserveB = state.tokenA.reserve

        } else {
            throw Error(
                "Could not find overlapping USDC Pool Mint Address!! " +
                MOCK.DEV.SABER_USDC.toString() + " (Saber USDC) " +
                state.tokenA.mint.toString() + " (MintA) " +
                state.tokenB.mint.toString() + " (MintB) "
            )
        }
        let userAccountpoolToken = await this.getAccountForMintAndPDA(state.poolTokenMint, this.portfolioPDA);
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

        console.log("user Account ", userAccount.toString());
        console.log("currency Mint ", currencyMint.toString())

        console.log("👀 positionPda ", positonPDA.toString())

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey",  this.owner.publicKey.toString());

        console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤯 poolPDA", poolPDA.toString());

        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccount.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());

        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());

        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", state.poolTokenMint.toString());

        // Set minimum token account to 0 lol
        console.log("Portfolio PDA : ", this.portfolioPDA.toString());

        let finaltx = await this.solbondProgram.rpc.redeemPositionOneSaber(
            new BN(this.portfolioBump),
            new BN(bumpPositon),
            new BN(poolBump),
            new BN(index),
            new BN(lpAmount),
            new BN(0),
            {
                accounts: {
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: this.owner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    swapAuthority: stableSwapState.config.authority,
                    positionPda: positonPDA,
                    swap: stableSwapState.config.swapAccount,
                    poolPda: poolPDA,
                    inputLp: userAccountpoolToken,
                    poolMint: state.poolTokenMint,
                    userA: userAccount,
                    reserveA: reserveA,
                    feesA: feesA,
                    mintA: mintA,
                    reserveB: reserveB,
                    saberSwapProgram: this.stableSwapProgramId,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers:[this.wallet]
            }
        )
        console.log("##redeemSinglePositionOneSide()");
    }


}
