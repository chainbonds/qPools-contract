import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {findSwapAuthorityKey, StableSwapState} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "../const";
import {WalletI} from "easy-spl";
import {SaberInteractToolFrontendFriendly} from "./saber-cpi-endpoints-wallet";
import {
    accountExists, createAssociatedTokenAccountUnsigned,
    getAccountForMintAndPDADontCreate,
    getAssociatedTokenAddressOffCurve,
    IWallet, sendAndSignInstruction,
    tokenAccountExists
} from "../utils";
import {PortfolioAccount} from "../types/account/portfolioAccount";
import {PositionAccountSaber} from "../types/account/positionAccountSaber";
import {PositionInfo} from "../types/positionInfo";
import {ExplicitSaberPool, saberPoolLpToken2poolAddress} from "../registry/registry-helper";
import * as registry from "../registry/registry-helper";
import {getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {portfolioExists, fetchPortfolio} from "../instructions/fetch/portfolio";
import {fetchSinglePosition} from "../instructions/fetch/position";
import {getLpTokenExchangeRateItems, getPoolState} from "../instructions/fetch/saber";
import {
    approvePortfolioWithdraw,
    createPortfolioSigned,
    registerCurrencyInputInPortfolio
} from "../instructions/modify/portfolio";
import {approvePositionWeightMarinade, approveWithdrawToMarinade} from "../instructions/modify/marinade";
import {
    approvePositionWeightSaber,
    registerLiquidityPoolAssociatedTokenAccountsForPortfolio,
    signApproveWithdrawAmountSaber
} from "../instructions/modify/saber";
import {
    sendLamports,
    signApproveWithdrawToUser,
    transferUsdcFromUserToPortfolio
} from "../instructions/modify/portfolio-transfer";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk';

export interface PositionsInput {
    percentageWeight: BN,
    poolAddress: PublicKey,
    amount: u64
}

/* TODO:
 *  Make the transaction split smarter. Add some metadata to know if it's in preparation, or actually already sending some money
 */

// TODO: Add Function Output Signatures
// TODO: Do modular imports, and keep names similar (?)
// TODO: Make create a new object, which incorporates all these tx's in one
// TODO: Replace all occurrences of owner_keypair with the provider's keypair ...
// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
/**
 * This file only includes operations for fetching and approving transactions
 *
 * The actual heavy-lifting (creating, etc.) is done by the cranks
 */
export class PortfolioFrontendFriendlyChainedInstructions extends SaberInteractToolFrontendFriendly {

    public portfolioPDA: PublicKey;
    public portfolioBump: number;
    public poolAddresses: ExplicitSaberPool[];
    public portfolioOwner: PublicKey;

    public payer: Keypair;
    public owner: WalletI;

    // There are a lot of accounts that need would be created twice
    // (assuming we use the same pool, but that pool has not been instantiated yet)
    private createdAtaAccounts: Set<string> = new Set();

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

        this.owner = provider.wallet;
        // @ts-expect-error
        this.payer = provider.wallet.payer as Keypair;

        getPortfolioPda(this.owner.publicKey, solbondProgram).then(([portfolioPDA, bumpPortfolio]) => {
            this.portfolioPDA = portfolioPDA
            this.portfolioBump = bumpPortfolio
        });

    }

    /**
     * Any overhead operations, such as creating associated token accuonts
     */
    async createAssociatedTokenAccounts(
        saber_pool_addresses: PublicKey[],
        owner_keypair: Keypair,
        wallet: IWallet,
        marinadeState: MarinadeState
    ) {

        // Change according to mainnet, or registry ...

        let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let createdAtaAccounts: Set<string> = new Set();
        // For the Portfolio!
        // For all saber pool addresses (tokenA, tokenB, LPToken), create associated token address
        // For MSOL, create associated token addresses
        // For USDC currency, create associated token account

        let tx: Transaction = new Transaction();
        await Promise.all(saber_pool_addresses.map(async (poolAddress: PublicKey) => {

            const stableSwapState = await getPoolState(this.connection, poolAddress);
            const {state} = stableSwapState;
            let ixs = await registerLiquidityPoolAssociatedTokenAccountsForPortfolio(
                this.connection,
                this.solbondProgram,
                owner_keypair.publicKey,
                wallet,
                state,
                createdAtaAccounts
            );
            ixs.map((x: TransactionInstruction) => {tx.add(x)})
        }));
        // Sign this transaction
        let sg = await this.provider.send(tx);
        await this.provider.connection.confirmTransaction(sg, "confirmed");
        console.log("SG is: ", sg);

        let wSOL = new PublicKey("So11111111111111111111111111111111111111112");
        // For the User!
        // Iterate through every currency ...
        // For USDC currency, create associated token account
        console.log("ATA1!");
        if (!(await tokenAccountExists(this.connection, await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, portfolioPDA)))) {
            let tx1 = await createAssociatedTokenAccountUnsigned(
                this.connection,
                MOCK.DEV.SABER_USDC,
                null,
                portfolioPDA,
                wallet,
            );
            let sg1 = await this.provider.send(tx1);
            await this.provider.connection.confirmTransaction(sg1, "confirmed");
        }
        // let portfolioUsdcAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, portfolioPDA);
        console.log("ATA2!");
        if (!(await tokenAccountExists(this.connection, await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, owner_keypair.publicKey)))) {
            let tx2 = await createAssociatedTokenAccountUnsigned(
                this.connection,
                MOCK.DEV.SABER_USDC,
                null,
                owner_keypair.publicKey,
                wallet,
            );
            let sg2 = await this.provider.send(tx2);
            await this.provider.connection.confirmTransaction(sg2, "confirmed");
        }
        // let userUsdcAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, owner_keypair.publicKey);
        console.log("ATA3!");
        if (!(await tokenAccountExists(this.connection, await getAssociatedTokenAddressOffCurve(wSOL, portfolioPDA)))) {
            let tx3 = await createAssociatedTokenAccountUnsigned(
                this.connection,
                wSOL,
                null,
                portfolioPDA,
                wallet,
            );
            let sg3 = await this.provider.send(tx3);
            await this.provider.connection.confirmTransaction(sg3, "confirmed");
        }
        // let portfolioMSolAccount = await getAccountForMintAndPDADontCreate(wSOL, portfolioPDA);
        console.log("ATA4!");
        if (!(await tokenAccountExists(this.connection, await getAssociatedTokenAddressOffCurve(wSOL, owner_keypair.publicKey)))) {
            let tx4 = await createAssociatedTokenAccountUnsigned(
                this.connection,
                wSOL,
                null,
                owner_keypair.publicKey,
                wallet,
            );
            let sg4 = await this.provider.send(tx4);
            await this.provider.connection.confirmTransaction(sg4, "confirmed");
        }
        console.log("ATA5!");
        if (!(await tokenAccountExists(this.connection, await getAssociatedTokenAddressOffCurve(marinadeState.mSolMintAddress, portfolioPDA)))) {
            let tx5 = await createAssociatedTokenAccountUnsigned(
                this.connection,
                marinadeState.mSolMintAddress,
                null,
                portfolioPDA,
                wallet,
            );
            let sg5 = await this.provider.send(tx5);
            await this.provider.connection.confirmTransaction(sg5, "confirmed");
        }
        // let portfolioMSolAccount = await getAccountForMintAndPDADontCreate(wSOL, portfolioPDA);
        console.log("ATA6!");
        if (!(await tokenAccountExists(this.connection, await getAssociatedTokenAddressOffCurve(marinadeState.mSolMintAddress, owner_keypair.publicKey)))) {
            let tx6 = await createAssociatedTokenAccountUnsigned(
                this.connection,
                marinadeState.mSolMintAddress,
                null,
                owner_keypair.publicKey,
                wallet,
            );
            let sg6 = await this.provider.send(tx6);
            await this.provider.connection.confirmTransaction(sg6, "confirmed");
        }
        // let userMSolAccount = await getAccountForMintAndPDADontCreate(wSOL, owner_keypair.publicKey);
        // For MSOL, create associated token addresses
        // TODO:; What MSOL Token was used ...?
        // let portfolioMSolAccount = await getAccountForMintAndPDADontCreate(marinade_state.mSolMintAddress, portfolioPDA);
        // let userMSolAccount = await getAccountForMintAndPDADontCreate(marinade_state.mSolMintAddress, owner_keypair.publicKey);

        // Now execute all these ...
        // let sg = await this.provider.send(tx);
        // await this.provider.connection.confirmTransaction(sg, "confirmed");
        // console.log("Signature is: ", sg);
        // return sg;
    }

    /**
     *
     * Portfolio Operations ...
     * In this file, only includes stuff that is needed for fetching and approving
     * The cranks do the actual heavy-lifting
     *
     */
    // Fetch Operations
    async portfolioExists(): Promise<boolean> {
        return await portfolioExists(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    async fetchPortfolio(): Promise<PortfolioAccount | null> {
        return await fetchPortfolio(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    // Create Operations
    async createPortfolioSigned(
        weights: Array<u64>,
        owner_keypair: Keypair,
        num_positions: BN,
        pool_addresses: Array<PublicKey>
    ) {
        let ix = await createPortfolioSigned(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            weights,
            pool_addresses
        );
        return ix;
    }

    async registerCurrencyInputInPortfolio(owner_keypair: Keypair, amount: u64, currencyMint: PublicKey) {
        let ix = await registerCurrencyInputInPortfolio(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            amount,
            currencyMint
        );
        return ix;
    }

    // Redeem Operations
    async approveWithdrawPortfolio(owner_keypair: Keypair) {
        let ix = await approvePortfolioWithdraw(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async signApproveWithdrawToUser(owner_keypair: Keypair) {
        let ix = await signApproveWithdrawToUser(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    /**
     * Generic operations to create all the associated token accounts
     *
     */


    /**
     *
     * Position Operations ...
     * In this file, only includes stuff that is needed for fetching and approving
     * The cranks do the actual heavy-lifting
     *
     */

    /**
     * POSITION: Saber Operations (Fetch, Approve)
     */
    // Deposit
    async approvePositionWeightSaber(
        pool_address: PublicKey,
        token_a_amount: u64,
        token_b_amount: u64,
        min_mint_amount: u64,
        index: number,
        weight: BN,
        owner_keypair: Keypair
    ) {
        let ix = await approvePositionWeightSaber(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            pool_address,
            token_a_amount,
            token_b_amount,
            min_mint_amount,
            index,
            weight
        );
        return ix;
    }
    // Withdraw
    // Gotta replace poolAddress with the LP-Token Mint
    async signApproveWithdrawAmountSaber(owner_keypair: Keypair, index: number, poolTokenAmount: u64, tokenAAmount: u64) {
        // Add some boilerplate checkers here
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        // Fetch the position
        // I guess, gotta double-check that Saber redeemable works ...
        console.log("aaa 3");
        let positionAccount: PositionAccountSaber = (await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 4");
        let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;
        let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;
        console.log("Is Redeemed is: ", positionAccount.isRedeemed);
        console.log(positionAccount);
        if (positionAccount.isRedeemed && !positionAccount.isFulfilled) {
            throw Error("Something major is off 2");
        }
        if (positionAccount.isRedeemed) {
            return null;
        }
        let ix = await signApproveWithdrawAmountSaber(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            poolAddress,
            index,
            new BN(lpAmount),
            tokenAAmount
        );
        return ix;
    }

    /**
     * POSITION: Marinade Operations (Fetch Approve);
     */
    // Deposit
    async approvePositionWeightMarinade(init_sol_amount: u64, index: number, weight: BN, owner_keypair: Keypair) {
        let ix = await approvePositionWeightMarinade(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            init_sol_amount,
            index,
            weight
        );
        return ix;
    }

    // Withdraw
    async approveWithdrawToMarinade(owner_keypair: Keypair, index: number, marinade_state: MarinadeState) {
        let ix = await approveWithdrawToMarinade(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            index,
            marinade_state
        );
        return ix;
    }

    /**
     * Some other boilerplate code to send from and to the local tmp crank wallet
     */
    async sendToCrankWallet(tmpKeypair: PublicKey, lamports: number): Promise<TransactionInstruction> {
        return sendLamports(this.owner.publicKey, tmpKeypair, lamports);
    }

    /**
     * Send USDC from the User's Wallet, to the Portfolio Account
     */
    async transfer_to_portfolio(owner: Keypair, currencyMint: PublicKey, wrappedSolAccount: PublicKey) {
        let ix = await transferUsdcFromUserToPortfolio(
            this.connection,
            this.solbondProgram,
            owner.publicKey,
            currencyMint,
            wrappedSolAccount
        );
        return await sendAndSignInstruction(this.provider, ix);
    }


    // /**
    //  * Fetch the Portfolio Information from the positions ...
    //  * Get the saber state, get the pool address, get all the pool accounts, and LP tokens, and normal tokens from the portfolio
    //  * skip counting duplicates
    //  *
    //  * Perhaps create a dictionary, which maps mint to amount ...
    //  */
    // // TODO: Also gotta make this cross-protocol
    // async getPortfolioInformation(): Promise<PositionInfo[]>{
    //     console.log("#getPortfolioInformation");
    //
    //     // Get the saber stableswap state for all positions
    //
    //     // return empty array if portfolio ID does not exist
    //     console.log("Hello");
    //     console.log("Portfolio PDA is: ", this.portfolioPDA.toString());
    //     if (!(await accountExists(this.connection, this.portfolioPDA))) {
    //         console.log("Empty Portfolio");
    //         return []
    //     }
    //     let portfolio: PortfolioAccount = await this.fetchPortfolio();
    //     let out: PositionInfo[] = [];
    //     for (let index = 0; index < portfolio.numPositions; index++) {
    //
    //         // Get the single position
    //         console.log("Fetching single position");
    //         let positionAccount: PositionAccountSaber = await this.fetchSinglePosition(index);
    //         console.log("Fetching get pool state");
    //         console.log("Pool Address is: ", positionAccount);
    //         console.log("Pool Address is: ", positionAccount.poolAddress.toString());
    //
    //         // Translate from Pool Mint to Pool Address. We need to coordinate better the naming
    //         let saberPoolAddress = saberPoolLpToken2poolAddress(positionAccount.poolAddress);
    //         console.log("Saber Pool Address is: ", saberPoolAddress, typeof saberPoolAddress, saberPoolAddress.toString());
    //         const stableSwapState = await this.getPoolState(saberPoolAddress);
    //         const {state} = stableSwapState;
    //
    //         // Now from the state, you can infer LP tokens, mints, the portfolio PDAs mints
    //         let portfolioAtaA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
    //         let portfolioAtaB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
    //         let portfolioAtaLp = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
    //
    //         // Also get the token amounts, I guess lol
    //         let tokenAAmount = (await this.connection.getTokenAccountBalance(portfolioAtaA)).value;
    //         let tokenBAmount = (await this.connection.getTokenAccountBalance(portfolioAtaB)).value;
    //         let tokenLPAmount = (await this.connection.getTokenAccountBalance(portfolioAtaLp)).value;
    //
    //         // Add to the portfolio account
    //         out.push({
    //             index: index,
    //             poolAddress: positionAccount.poolAddress,
    //             portfolio: this.portfolioPDA,
    //             mintA: state.tokenA.mint,
    //             ataA: portfolioAtaA,
    //             amountA: tokenAAmount,
    //             mintB: state.tokenB.mint,
    //             ataB: portfolioAtaB,
    //             amountB: tokenBAmount,
    //             mintLp: state.poolTokenMint,
    //             ataLp: portfolioAtaLp,
    //             amountLp: tokenLPAmount
    //         })
    //     }
    //
    //     console.log("##getPortfolioInformation");
    //     return out;
    // }
    //
    // // TODO: Again, make this cross-protocol compatible
    // async getPortfolioUsdcValue() {
    //     console.log("#getPortfolioUsdcValue");
    //     let includedMints: Set<string> = new Set();
    //     let storedPositions = await this.getPortfolioInformation();
    //     let usdAmount = 0.;
    //     let storedPositionUsdcAmounts: any = [];
    //
    //     console.log("All fetched data is: ", storedPositions);
    //     await Promise.all(storedPositions.map(async (position: PositionInfo) => {
    //         console.log("Position is: ", position);
    //         let saberPoolAddress = saberPoolLpToken2poolAddress(position.poolAddress);
    //         const stableSwapState = await this.getPoolState(saberPoolAddress);
    //         const {state} = stableSwapState;
    //
    //         let {supplyLpToken, poolContentsInUsdc} = await this.getLpTokenExchangeRateItems(state);
    //         let amountUserLp = position.amountLp.uiAmount;
    //         console.log("Amount of Users LP tokens: ", amountUserLp.toString());
    //         if (!supplyLpToken) {
    //             throw Error("One of the LP information values is null or zero!" + String(supplyLpToken));
    //         }
    //         // This case is totall fine, actually
    //         if ((!amountUserLp) && ((amountUserLp != 0))) {
    //             throw Error("One of the LP information values is null or zero!" + String(amountUserLp));
    //         }
    //
    //         // Calculate the exchange rate between lp tokens, and the total reserve values
    //         // The second operation defines the exchange rate, but we do it in a "safe" way
    //         // perhaps we should treat all these as BN ..
    //         let usdValueUserLp = (amountUserLp * poolContentsInUsdc) / supplyLpToken;
    //         console.log("User portfolio value is: ", usdValueUserLp);
    //         console.log("Token account address is: ", state.tokenA.reserve);
    //         let amountUserA = position.amountA.uiAmount;
    //         console.log("amountUserB", amountUserA);
    //         // Get Reserve B
    //         console.log("Token account address is: ", state.tokenB.reserve);
    //         let amountUserB = position.amountB.uiAmount;
    //         console.log("amountUserB", amountUserB);
    //
    //         if ((!amountUserA && amountUserA != 0) || (!amountUserB && amountUserB != 0)) {
    //             throw Error("One of the reserve values is null!" + String(amountUserA) + " " +  String(amountUserB));
    //         }
    //
    //         // Again, we skip this for now because all tokens we work with are USDC-based
    //         // // Also convert here to USD,
    //         // let usdValueUserA = amountUserA;
    //         // let usdValueUserB = amountUserB;
    //         //
    //         // // We can skip this step, bcs again, we only use stablecoins for now
    //         // let userPositionValue = usdValueUserA + usdValueUserB + usdValueUserLp;
    //
    //         // Modify with the Pyth price
    //         // Treat the LP tokens as 1-to-1 (?)
    //         if (!includedMints.has(position.mintA.toString())) {
    //             console.log("Adding: position.mintA ", position.mintA.toString())
    //             usdAmount += amountUserA;
    //         } else {
    //             console.log("Skipping: position.mintA ", position.mintA.toString())
    //         }
    //         if (!includedMints.has(position.mintB.toString())) {
    //             console.log("Adding: position.mintB ", position.mintB.toString())
    //             usdAmount += amountUserB;
    //         } else {
    //             console.log("Skipping: position.mintB ", position.mintB.toString())
    //         }
    //         if (!includedMints.has(position.mintLp.toString())) {
    //             console.log("Adding: position.mintLp ", position.mintLp.toString())
    //             usdAmount += usdValueUserLp;
    //         } else {
    //             console.log("Skipping: position.mintLp ", position.mintLp.toString())
    //         }
    //
    //         includedMints.add(position.mintA.toString());
    //         includedMints.add(position.mintB.toString());
    //         includedMints.add(position.mintLp.toString());
    //
    //         storedPositionUsdcAmounts.push(
    //             {totalPositionValue: usdValueUserLp}
    //         )
    //     }));
    //
    //     console.log("##getPortfolioUsdcValue");
    //
    //     return {
    //         storedPositions: storedPositions,
    //         usdAmount: usdAmount,
    //         storedPositionUsdcAmounts: storedPositionUsdcAmounts,
    //     };
    // }
    //
    // /**
    //  * This model creates a portfolio where the base currency is USDC i.e the user only pays in USDC.
    //  * The steps 1-3 are permissioned, meaning that the user has to sign client side. The point is to
    //  * make these instructions fairly small such that they can all be bundled together in one transaction.
    //  * Create a Portfolio workflow:
    //  * 1) create_portfolio(ctx,bump,weights,num_pos,amount_total):
    //  *      ctx: context of the portfolio
    //  *      bump: bump for the portfolio_pda
    //  *      weights: the weights in the portfolio (check if sum is normalized)
    //  *      num_positions: number of positions this portfolio will have
    //  *      amount: total amount of USDC in the portfolio
    //  *
    //  * 2) for position_i in range(num_positions):
    //  *          approve_position_weight_{PROTOCOL_NAME}(ctx, args)
    //  *
    //  * 3) transfer_to_portfolio():
    //  *      transfers the agreed upon amount to a ATA owned by portfolio_pda
    //  */
    //
    // async registerAtaForLiquidityPortfolio(poolAddresses: PublicKey[]): Promise<TransactionInstruction[]> {
    //     console.log("#registerAtaForLiquidityPortfolio()");
    //     let txs = [];
    //     // I guess this should be called only for the pools, that we are deploying items into.
    //     // I will make the poolAddresses an argument instead
    //
    //     // Just enumerate through all poolAddresses, and return the instructions
    //     await Promise.all(poolAddresses.map(async (poolAddress: PublicKey) => {
    //         console.log("Checkpoint (1)");
    //         console.log("Asking with pool address: ", poolAddress, poolAddress.toString(), typeof poolAddress);
    //         const stableSwapState = await this.getPoolState(poolAddress);
    //         console.log("Checkpoint (2)");
    //         const {state} = stableSwapState;
    //         let tx1 = await this.registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state);
    //         console.log("Checkpoint (3)");
    //         tx1.map((x: TransactionInstruction) => {
    //             if (x) {
    //                 txs.push(x);
    //             }
    //         })
    //     }));
    //
    //     console.log("##registerAtaForLiquidityPortfolio()");
    //     return txs;
    // }
    //
    // async registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state: StableSwapState): Promise<TransactionInstruction[]> {
    //     return await registerLiquidityPoolAssociatedTokenAccountsForPortfolio(
    //         this.connection,
    //         this.solbondProgram,
    //         this.owner.publicKey,
    //         this.providerWallet,
    //         state,
    //         this.createdAtaAccounts
    //     );
    // }
    //
    // /**
    //  * Withdraw a Portfolio workflow:
    //  * 1) approve_withdraw_to_user(ctx,amount_total):
    //  *      ctx: context of the portfolio
    //  *      amount: total amount of USDC in the portfolio
    //  *
    //  * 2) for position_i in range(num_positions):
    //  *          approve_withdraw_amount_{PROTOCOL_NAME}(ctx, args)
    //  * 3) for position_i in range(num_positions):
    //  *          withdraw
    //  *
    //  * 3) transfer_redeemed_to_user():
    //  *      transfers the funds back to the user
    //  *
    //  */
    //
    // async approveRedeemFullPortfolio(): Promise<TransactionInstruction[]> {
    //     console.log("#redeemFullPortfolio()");
    //     console.log("(3) portfolio PDA: ", this.portfolioPDA, typeof this.portfolioPDA);
    //     console.log("aaa 1");
    //     let portfolioAccount: PortfolioAccount = (await this.solbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
    //     console.log("aaa 2");
    //     let tx: TransactionInstruction[] = [];
    //     for (let i = 0; i < portfolioAccount.numPositions; i++) {
    //         let tx0 = await this.approveWithdrawAmountSaber(i);
    //         if (tx0) {
    //             tx.push(tx0);
    //         }
    //     }
    //     console.log("##redeemFullPortfolio()");
    //     return tx;
    // }
    //
    // // Now any Redeem Logic
    // /**
    //  * Transaction to redeem the entire portfolio
    //  * We must get all the pool Addresses from the portfolio object
    //  */
    // async redeemFullPortfolio(): Promise<TransactionInstruction[]> {
    //     console.log("#redeemFullPortfolio()");
    //     console.log("(3) portfolio PDA: ", this.portfolioPDA, typeof this.portfolioPDA);
    //     console.log("aaa 4");
    //     let portfolioAccount: PortfolioAccount = (await this.solbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
    //     console.log("aaa 5");
    //     let tx: TransactionInstruction[] = [];
    //     for (let i = 0; i < portfolioAccount.numPositions; i++) {
    //         let tx0 = await this.redeemSinglePositionOneSide(i);
    //         tx.push(tx0);
    //     }
    //     console.log("##redeemFullPortfolio()");
    //     return tx;
    // }
    //
    // async redeemSinglePositionOneSide(index: number): Promise<TransactionInstruction> {
    //     console.log("#redeemSinglePositionOneSide()");
    //     // Get the pool address from the position PDA
    //     let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
    //     console.log("(4) portfolio PDA: ", positionPDA, typeof positionPDA);
    //     console.log("aaa 6");
    //     let positionAccountSaber = (await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
    //     console.log("aaa 7");
    //     let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccountSaber.poolAddress);
    //     const stableSwapState = await this.getPoolState(poolAddress);
    //     const {state} = stableSwapState;
    //
    //     console.log("positionPDA ", positionPDA.toString())
    //     const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
    //     console.log("authority ", authority.toString())
    //
    //     // Gotta cross-check which one is the currency token, in this case
    //     let userAccount: PublicKey;
    //     let reserveA: PublicKey;
    //     let feesA: PublicKey;
    //     let mintA: PublicKey;
    //     let reserveB: PublicKey;
    //     // TODO: Replace this object. Replace any occurrence of MOCK.DEV.SABER_USDC with your function ...
    //
    //     /**
    //      *  Terminology: Token A is our currency, and Token B is the other currency
    //      */
    //     // TODO: Replace the main currency
    //     if (MOCK.DEV.SABER_USDC.equals(state.tokenA.mint)) {
    //         userAccount = await getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
    //         reserveA = state.tokenA.reserve
    //         feesA = state.tokenA.adminFeeAccount
    //         mintA = state.tokenA.mint
    //         reserveB = state.tokenB.reserve
    //
    //     } else if (MOCK.DEV.SABER_USDC.equals(state.tokenB.mint)) {
    //         userAccount = await getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
    //         reserveA = state.tokenB.reserve
    //         feesA = state.tokenB.adminFeeAccount
    //         mintA = state.tokenB.mint
    //         reserveB = state.tokenA.reserve
    //
    //     } else {
    //         throw Error(
    //             "Could not find overlapping USDC Pool Mint Address!! " +
    //             MOCK.DEV.SABER_USDC.toString() + " (Saber USDC) " +
    //             state.tokenA.mint.toString() + " (MintA) " +
    //             state.tokenB.mint.toString() + " (MintB) "
    //         )
    //     }
    //
    //     // TODO: Again, this tokenAccountPool should be retrieved in the first place,
    //     //  and should be determined how much USDC it corresponds to, and should be retrieved as
    //     let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
    //
    //     let ix: TransactionInstruction = this.solbondProgram.instruction.redeemPositionOneSaber(
    //         new BN(this.portfolioBump),
    //         new BN(bumpPosition),
    //         new BN(index),
    //         {
    //             accounts: {
    //                 positionPda: positionPDA,
    //                 portfolioPda: this.portfolioPDA,
    //                 portfolioOwner: this.owner.publicKey,
    //                 poolMint: state.poolTokenMint,
    //                 inputLp: userAccountpoolToken,
    //                 swapAuthority: stableSwapState.config.authority,
    //                 swap:stableSwapState.config.swapAccount,
    //                 userA: userAccount,
    //                 reserveA: reserveA,
    //                 mintA: mintA,
    //                 reserveB: reserveB,
    //                 feesA: feesA,
    //                 saberSwapProgram: this.stableSwapProgramId,
    //                 tokenProgram: TOKEN_PROGRAM_ID,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //             },
    //         }
    //     )
    //     console.log("##redeemSinglePositionOneSide()");
    //     return ix;
    // }
    //
    // /**
    //  * Send USDC from the Portfolio Account to the User's Wallet
    //  */
    // async transferUsdcFromPortfolioToUser(): Promise<TransactionInstruction> {
    //     console.log("#transferUsdcFromPortfolioToUser()");
    //     let userUSDCAta = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.owner.publicKey);
    //     let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);
    //
    //     // TODO: We assume this account exists ... gotta enforce it I guess lol
    //     // TODO: Again, we assume that this account exists
    //     let totalPDA_USDCAmount = (await this.connection.getTokenAccountBalance(pdaUSDCAccount)).value.amount;
    //     let ix: TransactionInstruction = this.solbondProgram.instruction.transferRedeemedToUser(
    //         new BN(this.portfolioBump),
    //         {
    //             accounts: {
    //                 portfolioOwner: this.owner.publicKey,
    //                 portfolioPda: this.portfolioPDA,
    //                 userOwnedUserA: userUSDCAta,
    //                 pdaOwnedUserA: pdaUSDCAccount,
    //                 // TODO: Also replace MOCK.DEV here
    //                 tokenMint: MOCK.DEV.SABER_USDC,
    //                 tokenProgram: TOKEN_PROGRAM_ID,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //                 feesQpoolsA: this.qPoolsUsdcFees
    //             }
    //         }
    //
    //     )
    //     console.log("##transferUsdcFromPortfolioToUser()");
    //     return ix;
    // }

}
