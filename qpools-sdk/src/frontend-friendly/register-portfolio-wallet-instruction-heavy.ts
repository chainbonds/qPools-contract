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
import {
    createAssociatedTokenAccountSendUnsigned,
    createAssociatedTokenAccountUnsigned,
    createAssociatedTokenAccountUnsignedInstruction,
    getAssociatedTokenAddressOffCurve,
    tokenAccountExists
} from "../utils";
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

/* TODO:
 *  Make the transaction split smarter. Add some metadata to know if it's in preparation, or actually already sending some money
 */

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class PortfolioFrontendFriendlyChainedInstructions extends SaberInteractToolFrontendFriendly {

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

        console.log("(I) Constructor payer is: ", this.payer);

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
     * A bunch of fetch functions
     */
    async fetchPortfolio(): Promise<PortfolioAccount> {
        console.log("#fetchPortfolio()");
        let [portfolioPDA, _] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );
        this.portfolioPDA = portfolioPDA;
        let response = await this.solbondProgram.account.portfolioAccount.fetch(portfolioPDA);
        let portfolioContent = response as PortfolioAccount;
        console.log("Portfolio Content", portfolioContent);
        console.log("##fetchPortfolio()");
        return portfolioContent;
    }

    async fetchAllPools(): Promise<TwoWayPoolAccount[]> {
        console.log("#fetchAllPools()");
        let responses = [];
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
        let responses = [];
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

    /**
     * List all instructions here, one by one first of all
     */

    /**
     * Send USDC from the User's Wallet, to the Portfolio Account
     */
    async transferUsdcFromUserToPortfolio(amount: u64): Promise<TransactionInstruction> {
        console.log("#transferUsdcFromUserToPortfolio()");
        // Assume this already exists. If not, then throw error that user has zero balance
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);

        // Create this account as well, if it does not exist yet ..
        let pdaUSDCAccount = await this.getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);

        let ix: TransactionInstruction = this.solbondProgram.instruction.transferToPortfolio(
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
        console.log("##transferUsdcFromUserToPortfolio()");
        return ix;
    }

    /**
     * Register Portfolio Values
     */
    async registerPortfolio(weights: Array<BN>): Promise<TransactionInstruction> {
        console.log("#registerPortfolio()");

        let ix: TransactionInstruction = this.solbondProgram.instruction.savePortfolio(
            this.portfolioBump,
            weights,
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                },
                signers: [this.payer]
            }
        )
        console.log("##registerPortfolio()");
        return ix;
    }

    // Instructions to create the associated token accounts for the portfolios
    async registerAtaForLiquidityPortfolio(): Promise<TransactionInstruction[]> {
        console.log("#registerAllLiquidityPools()");
        let txs = [];
        for (var i = 0; i < this.poolAddresses.length; i++) {
            let poolAddress = this.poolAddresses[i];
            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;

            let tx1 = await this.registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state);
            tx1.map((x: TransactionInstruction) => {
                if (x) {
                    txs.push(x);
                }
            })
        }
        console.log("##registerAllLiquidityPools()");
        return txs;
    }

    async registerAllLiquidityPools(): Promise<TransactionInstruction[]> {
        console.log("#registerAllLiquidityPools()");
        let txs = [];
        for (var i = 0; i < this.poolAddresses.length; i++) {
            let poolAddress = this.poolAddresses[i];

            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;

            // First, register a liquidity position
            let tx0 = await this.registerLiquidityPoolForPortfolio(poolAddress, state);
            txs.push(tx0);
        }
        console.log("##registerAllLiquidityPools()");
        return txs;
    }

    async depositTokensToLiquidityPools(weights: Array<BN>): Promise<TransactionInstruction[]> {
        console.log("#createFullPortfolio()");
        let txs = [];
        for (var i = 0; i < weights.length; i++) {
            let w = weights[i];
            let poolAddress = this.poolAddresses[i];
            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;
            let tx1 = await this.createSinglePositionInLiquidityPool(
                i,
                poolAddress,
                state,
                stableSwapState,
                w
            )
            txs.push(tx1);
        }
        console.log("##createFullPortfolio()");
        return txs;
    }

    /**
     * For a given user, and his registered portfolio, register one of the pools that he will be depositingm oney to
     * @param poolAddress
     * @param state
     */
    async registerLiquidityPoolForPortfolio(poolAddress: PublicKey, state: StableSwapState): Promise<TransactionInstruction> {
        console.log("#registerLiquidityPoolForPortfolio()");
        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );
        let ix: TransactionInstruction = this.solbondProgram.instruction.initializePoolAccount(
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
        console.log("##registerLiquidityPoolForPortfolio()");
        return ix;
    }

    async registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state: StableSwapState): Promise<TransactionInstruction[]> {
        // Creating ATA accounts if not existent yet ...
        let userAccountA = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
        let userAccountB = await this.getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
        let userAccountPoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

        let txs = [];

        // Check for each account if it exists, and if it doesn't exist, create it
        if (!(await tokenAccountExists(this.connection, userAccountA))) {
            console.log("Chaining userAccountA");
            let ix: Transaction = await createAssociatedTokenAccountUnsignedInstruction(
                this.connection,
                state.tokenA.mint,
                null,
                this.portfolioPDA,
                this.providerWallet,
            );
            txs.push(...ix.instructions);
            console.log("Chained userAccountA");
        }
        if (!(await tokenAccountExists(this.connection, userAccountB))) {
            console.log("Chaining userAccountB");
            let ix: Transaction = await createAssociatedTokenAccountUnsignedInstruction(
                this.connection,
                state.tokenB.mint,
                null,
                this.portfolioPDA,
                this.providerWallet,
            );
            txs.push(...ix.instructions);
            console.log("Chained userAccountB");
        }
        if (!(await tokenAccountExists(this.connection, userAccountPoolToken))) {
            console.log("Chaining userAccountPoolToken");
            let ix: Transaction = await createAssociatedTokenAccountUnsignedInstruction(
                this.connection,
                state.poolTokenMint,
                null,
                this.portfolioPDA,
                this.providerWallet,
            );
            // Do I need to sign this? Probably not ...
            txs.push(...ix.instructions);
            console.log("Chained userAccountPoolToken");
        }
        return txs;
    }

    /**
     * Register the existing liquidity pool with the given portfolio
     */
    // : Promise<TransactionInstruction>
    async createSinglePositionInLiquidityPool(
        index: number,
        poolAddress: PublicKey,
        state: StableSwapState,
        stableSwapState: StableSwap,
        weight: BN
    ) {
        console.log("#createSinglePositionInLiquidityPool()");
        let tx: Transaction = new Transaction();
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
        let userAccountA = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
        let userAccountB = await this.getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
        let userAccountPoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

        /*
            Now get the actual instruction set ...
         */
        let amount_a = (await this.connection.getTokenAccountBalance(userAccountA)).value.amount;
        let amount_b = (await this.connection.getTokenAccountBalance(userAccountB)).value.amount;

        let sg = await this.solbondProgram.rpc.createPositionSaber(
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
        console.log("##createSinglePositionInLiquidityPool()");
        this.connection.confirmTransaction(sg);
        // return ix;
    }


    // Now any Redeem Logic
    /**
     * Transaction to redeem the entire portfolio
     */
    async redeemFullPortfolio(): Promise<TransactionInstruction[]> {
        console.log("#redeemFullPortfolio()");
        let tx: TransactionInstruction[] = [];
        for (var i = 0; i < this.poolAddresses.length; i++) {
            let poolAddress = this.poolAddresses[i];
            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState;
            let tx0 = await this.redeemSinglePositionOneSide(
                i,
                poolAddress,
                state,
                stableSwapState
            );
            tx.push(tx0);
        }
        console.log("redeemed! the full portfolio!")
        console.log("##redeemFullPortfolio()");
        return tx;
    }

    async redeemSinglePositionOneSide(
        index: number,
        poolAddress: PublicKey,
        state: StableSwapState,
        stableSwapState: StableSwap
    ): Promise<TransactionInstruction> {
        console.log("#redeemSinglePositionOneSide()");
        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );
        console.log("poolPDA ", poolPDA.toString());

        let [positonPDA, bumpPositon] = await await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM + index.toString()))],
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
            userAccount = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);

            reserveA = state.tokenA.reserve
            feesA = state.tokenA.adminFeeAccount
            mintA = state.tokenA.mint
            reserveB = state.tokenB.reserve

        } else if (MOCK.DEV.SABER_USDC.equals(state.tokenB.mint)) {
            currencyMint = state.tokenB.mint;
            userAccount = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);

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
        let userAccountpoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

        let ix: TransactionInstruction = this.solbondProgram.instruction.redeemPositionOneSaber(
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
        return ix;
    }

    /**
     * Send USDC from the Portfolio Account to the User's Wallet
     */
    async transferUsdcFromPortfolioToUser(): Promise<TransactionInstruction> {
        console.log("#transferUsdcFromPortfolioToUser()");
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        let pdaUSDCAccount = await this.getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);

        // TODO: We assume this account exists ... gotta enforce it I guess lol
        let totalPDA_USDCAmount = (await this.connection.getTokenAccountBalance(pdaUSDCAccount)).value.amount;
        let ix: TransactionInstruction = this.solbondProgram.instruction.transferRedeemedToUser(
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
        console.log("##transferUsdcFromPortfolioToUser()");
        return ix;
    }

}
