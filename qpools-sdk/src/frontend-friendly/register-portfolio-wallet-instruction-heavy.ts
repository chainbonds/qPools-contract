import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {
    findSwapAuthorityKey,
    StableSwap,
    StableSwapState
} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "../const";
import {account, WalletI} from "easy-spl";
import {SaberInteractToolFrontendFriendly} from "./saber-cpi-endpoints-wallet";
import {
    accountExists,
    bnTo8,
    createAssociatedTokenAccountUnsignedInstruction, getAccountForMintAndPDADontCreate,
    getAssociatedTokenAddressOffCurve,
    tokenAccountExists
} from "../utils";
import {PortfolioAccount} from "../types/account/portfolioAccount";
import {PositionAccountSaber} from "../types/account/positionAccountSaber";
import {PositionInfo} from "../types/positionInfo";
import {
    ExplicitSaberPool,
    saberPoolLpToken2poolAddress
} from "../registry/registry-helper";
import * as registry from "../registry/registry-helper";
import {getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {portfolioExists} from "../instructions/fetch/portfolio";

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
    public poolAddresses: ExplicitSaberPool[];
    public portfolioOwner: PublicKey;
    public qPoolsUsdcFees: PublicKey;

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

        // Replace with currency
        // TODO: Always assume that this address exists. Write a short deploy script that includes this
        // Replace this by the user's local PublicKey
        getAccountForMintAndPDADontCreate(
            registry.getReferenceCurrencyMint(),
            new PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs")
        ).then((x: PublicKey) => {
            this.qPoolsUsdcFees = x;
        });

    }

    /**
     * A bunch of fetch functions
     */
    async portfolioExists(): Promise<boolean> {
        return await portfolioExists(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    // async portfolioExistsAndIsFulfilled(): Promise<boolean> {
    //     if (await this.portfolioExists()) {
    //         // let portfolio: PortfolioAccount = await this.fetchPortfolio();
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    async fetchPortfolio(): Promise<PortfolioAccount | null> {
        console.log("#fetchPortfolio()");
        let [portfolioPda, _ ] = await getPortfolioPda(this.owner.publicKey, this.solbondProgram);
        this.portfolioPDA = portfolioPda;
        console.log("(1) portfolio PDA: ", this.portfolioPDA, typeof this.portfolioPDA);
        let portfolioContent = null;
        console.log("Before trying to fetch");
        if (await accountExists(this.connection, this.portfolioPDA)) {
            console.log("Exists and trying to fetch");
            portfolioContent = (await this.solbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
        }
        console.log("Now fetching again ...", portfolioContent);
        console.log("##fetchPortfolio()");
        return portfolioContent;
    }

    // TODO: Gotta make this cross-protocol
    async fetchAllPositions(): Promise<PositionAccountSaber[]> {
        console.log("#fetchAllPositions()");
        let responses = [];

        // Get the portfolio, and iterate through all the positions
        let portfolioContents: PortfolioAccount = await this.fetchPortfolio();
        for (let i = 0; i < portfolioContents.numPositions; i++) {
            let positionContent = await this.fetchSinglePosition(i);
            console.log("Position Content", positionContent);
            responses.push(positionContent);
        }
        console.log("##fetchAllPositions()");
        return responses;
    }

    async fetchSinglePosition(index: number): Promise<PositionAccountSaber | null> {
        console.log("#fetchSinglePosition()");
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        console.log("(2) portfolio PDA: ", positionPDA, typeof positionPDA);
        let positionContent = null;
        if (await accountExists(this.connection, positionPDA)) {
            let response = await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA);
            positionContent = response as PositionAccountSaber;
        }
        console.log("##fetchSinglePosition()");
        return positionContent;
    }

    /**
     * Fetch the Portfolio Information from the positions ...
     * Get the saber state, get the pool address, get all the pool accounts, and LP tokens, and normal tokens from the portfolio
     * skip counting duplicates
     *
     * Perhaps create a dictionary, which maps mint to amount ...
     */
    // TODO: Also gotta make this cross-protocol
    async getPortfolioInformation(): Promise<PositionInfo[]>{
        console.log("#getPortfolioInformation");

        // Get the saber stableswap state for all positions

        // return empty array if portfolio ID does not exist
        console.log("Hello");
        console.log("Portfolio PDA is: ", this.portfolioPDA.toString());
        if (!(await accountExists(this.connection, this.portfolioPDA))) {
            console.log("Empty Portfolio");
            return []
        }
        let portfolio: PortfolioAccount = await this.fetchPortfolio();
        let out: PositionInfo[] = [];
        for (let index = 0; index < portfolio.numPositions; index++) {

            // Get the single position
            console.log("Fetching single position");
            let positionAccount: PositionAccountSaber = await this.fetchSinglePosition(index);
            console.log("Fetching get pool state");
            console.log("Pool Address is: ", positionAccount);
            console.log("Pool Address is: ", positionAccount.poolAddress.toString());

            // Translate from Pool Mint to Pool Address. We need to coordinate better the naming
            let saberPoolAddress = saberPoolLpToken2poolAddress(positionAccount.poolAddress);
            console.log("Saber Pool Address is: ", saberPoolAddress, typeof saberPoolAddress, saberPoolAddress.toString());
            const stableSwapState = await this.getPoolState(saberPoolAddress);
            const {state} = stableSwapState;

            // Now from the state, you can infer LP tokens, mints, the portfolio PDAs mints
            let portfolioAtaA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
            let portfolioAtaB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
            let portfolioAtaLp = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

            // Also get the token amounts, I guess lol
            let tokenAAmount = (await this.connection.getTokenAccountBalance(portfolioAtaA)).value;
            let tokenBAmount = (await this.connection.getTokenAccountBalance(portfolioAtaB)).value;
            let tokenLPAmount = (await this.connection.getTokenAccountBalance(portfolioAtaLp)).value;

            // Add to the portfolio account
            out.push({
                index: index,
                poolAddress: positionAccount.poolAddress,
                portfolio: this.portfolioPDA,
                mintA: state.tokenA.mint,
                ataA: portfolioAtaA,
                amountA: tokenAAmount,
                mintB: state.tokenB.mint,
                ataB: portfolioAtaB,
                amountB: tokenBAmount,
                mintLp: state.poolTokenMint,
                ataLp: portfolioAtaLp,
                amountLp: tokenLPAmount
            })
        }

        console.log("##getPortfolioInformation");
        return out;
    }

    /**
     * Get the supply of all the LP tokens, as well as the USDC value of the reserve tokens
     * We don't return a float, so we can do safe arithmetic later
     */
    // TODO: Again, make one getter for each protocol ...
    async getLpTokenExchangeRateItems(state: StableSwapState) {

        console.log("Token account address is: ", state.tokenA.reserve);
        let amountReserveA = (await this.connection.getTokenAccountBalance(state.tokenA.reserve)).value.uiAmount;
        console.log("Token account address is: ", state.tokenA.reserve);
        let amountReserveB = (await this.connection.getTokenAccountBalance(state.tokenB.reserve)).value.uiAmount;
        if (!amountReserveA || !amountReserveB) {
            throw Error("One of the reserve values is null!" + String(amountReserveA) + " " +  String(amountReserveB));
        }
        // We skip these right now, because we are based on USDC
        // Convert Reserve A to it's USD value
        // Convert Reserve B to it's USD value
        // Convert to the USD currency (We can skip this step because we focus on USD stablecoins for now..)

        console.log("Amount A and Amount B are: ", amountReserveA.toString(), amountReserveB.toString());
        // Add these up, to get an idea of how much total value is in the pool
        let poolContentsInUsdc = amountReserveA + amountReserveB;
        let supplyLpToken = (await this.connection.getTokenSupply(state.poolTokenMint)).value.uiAmount;
        console.log("Supply of all LP tokens is: ", supplyLpToken.toString());

        return {
            supplyLpToken: supplyLpToken,
            poolContentsInUsdc: poolContentsInUsdc
        };
    }

    // TODO: Again, make this cross-protocol compatible
    async getPortfolioUsdcValue() {
        console.log("#getPortfolioUsdcValue");
        let includedMints: Set<string> = new Set();
        let storedPositions = await this.getPortfolioInformation();
        let usdAmount = 0.;
        let storedPositionUsdcAmounts: any = [];

        console.log("All fetched data is: ", storedPositions);
        await Promise.all(storedPositions.map(async (position: PositionInfo) => {
            console.log("Position is: ", position);
            let saberPoolAddress = saberPoolLpToken2poolAddress(position.poolAddress);
            const stableSwapState = await this.getPoolState(saberPoolAddress);
            const {state} = stableSwapState;

            let {supplyLpToken, poolContentsInUsdc} = await this.getLpTokenExchangeRateItems(state);
            let amountUserLp = position.amountLp.uiAmount;
            console.log("Amount of Users LP tokens: ", amountUserLp.toString());
            if (!supplyLpToken) {
                throw Error("One of the LP information values is null or zero!" + String(supplyLpToken));
            }
            // This case is totall fine, actually
            if ((!amountUserLp) && ((amountUserLp != 0))) {
                throw Error("One of the LP information values is null or zero!" + String(amountUserLp));
            }

            // Calculate the exchange rate between lp tokens, and the total reserve values
            // The second operation defines the exchange rate, but we do it in a "safe" way
            // perhaps we should treat all these as BN ..
            let usdValueUserLp = (amountUserLp * poolContentsInUsdc) / supplyLpToken;
            console.log("User portfolio value is: ", usdValueUserLp);
            console.log("Token account address is: ", state.tokenA.reserve);
            let amountUserA = position.amountA.uiAmount;
            console.log("amountUserB", amountUserA);
            // Get Reserve B
            console.log("Token account address is: ", state.tokenB.reserve);
            let amountUserB = position.amountB.uiAmount;
            console.log("amountUserB", amountUserB);

            if ((!amountUserA && amountUserA != 0) || (!amountUserB && amountUserB != 0)) {
                throw Error("One of the reserve values is null!" + String(amountUserA) + " " +  String(amountUserB));
            }

            // Again, we skip this for now because all tokens we work with are USDC-based
            // // Also convert here to USD,
            // let usdValueUserA = amountUserA;
            // let usdValueUserB = amountUserB;
            //
            // // We can skip this step, bcs again, we only use stablecoins for now
            // let userPositionValue = usdValueUserA + usdValueUserB + usdValueUserLp;

            // Modify with the Pyth price
            // Treat the LP tokens as 1-to-1 (?)
            if (!includedMints.has(position.mintA.toString())) {
                console.log("Adding: position.mintA ", position.mintA.toString())
                usdAmount += amountUserA;
            } else {
                console.log("Skipping: position.mintA ", position.mintA.toString())
            }
            if (!includedMints.has(position.mintB.toString())) {
                console.log("Adding: position.mintB ", position.mintB.toString())
                usdAmount += amountUserB;
            } else {
                console.log("Skipping: position.mintB ", position.mintB.toString())
            }
            if (!includedMints.has(position.mintLp.toString())) {
                console.log("Adding: position.mintLp ", position.mintLp.toString())
                usdAmount += usdValueUserLp;
            } else {
                console.log("Skipping: position.mintLp ", position.mintLp.toString())
            }

            includedMints.add(position.mintA.toString());
            includedMints.add(position.mintB.toString());
            includedMints.add(position.mintLp.toString());

            storedPositionUsdcAmounts.push(
                {totalPositionValue: usdValueUserLp}
            )

        }));

        console.log("##getPortfolioUsdcValue");

        return {
            storedPositions: storedPositions,
            usdAmount: usdAmount,
            storedPositionUsdcAmounts: storedPositionUsdcAmounts,
        };
    }

    /**
     * List all instructions here, one by one first of all
     */

    /**
     * This model creates a portfolio where the base currency is USDC i.e the user only pays in USDC.
     * The steps 1-3 are permissioned, meaning that the user has to sign client side. The point is to
     * make these instructions fairly small such that they can all be bundled together in one transaction. 
     * Create a Portfolio workflow:
     * 1) create_portfolio(ctx,bump,weights,num_pos,amount_total):
     *      ctx: context of the portfolio
     *      bump: bump for the portfolio_pda
     *      weights: the weights in the portfolio (check if sum is normalized)
     *      num_positions: number of positions this portfolio will have
     *      amount: total amount of USDC in the portfolio
     * 
     * 2) for position_i in range(num_positions):
     *          approve_position_weight_{PROTOCOL_NAME}(ctx, args)
     * 
     * 3) transfer_to_portfolio():
     *      transfers the agreed upon amount to a ATA owned by portfolio_pda
     * 
    */

    /**
     * Send some SOL to the local keypair wallet
     */
    async sendToCrankWallet(tmpKeypair: PublicKey, lamports: number): Promise<TransactionInstruction> {
        return web3.SystemProgram.transfer({
            fromPubkey: this.owner.publicKey,
            toPubkey: tmpKeypair,
            lamports: lamports,
        })
    }

    /**
     *  Instructions to create the associated token accounts for the portfolios
     */
    // TODO: Make this also cross-platform (?)
    async registerAtaForLiquidityPortfolio(poolAddresses: PublicKey[]): Promise<TransactionInstruction[]> {
        console.log("#registerAtaForLiquidityPortfolio()");
        let txs = [];
        // I guess this should be called only for the pools, that we are deploying items into.
        // I will make the poolAddresses an argument instead

        // Just enumerate through all poolAddresses, and return the instructions
        await Promise.all(poolAddresses.map(async (poolAddress: PublicKey) => {
            console.log("Checkpoint (1)");
            console.log("Asking with pool address: ", poolAddress, poolAddress.toString(), typeof poolAddress);
            const stableSwapState = await this.getPoolState(poolAddress);
            console.log("Checkpoint (2)");
            const {state} = stableSwapState;
            let tx1 = await this.registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state);
            console.log("Checkpoint (3)");
            tx1.map((x: TransactionInstruction) => {
                if (x) {
                    txs.push(x);
                }
            })
        }));

        console.log("##registerAtaForLiquidityPortfolio()");
        return txs;
    }

    async registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state: StableSwapState): Promise<TransactionInstruction[]> {
        // Creating ATA accounts if not existent yet ...
        console.log("Checkpoint (2.1)");
        let userAccountA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
        let userAccountB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
        let userAccountPoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        console.log("Checkpoint (2.2)");

        let txs = [];
        // Check for each account if it exists, and if it doesn't exist, create it
        if (!(await tokenAccountExists(this.connection, userAccountA)) && !this.createdAtaAccounts.has(userAccountA.toString())) {
            console.log("Chaining userAccountA");
            this.createdAtaAccounts.add(userAccountA.toString());
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
        if (!(await tokenAccountExists(this.connection, userAccountB)) && !this.createdAtaAccounts.has(userAccountB.toString())) {
            console.log("Chaining userAccountB");
            this.createdAtaAccounts.add(userAccountB.toString());
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
        if (!(await tokenAccountExists(this.connection, userAccountPoolToken)) && !this.createdAtaAccounts.has(userAccountPoolToken.toString())) {
            console.log("Chaining userAccountPoolToken");
            this.createdAtaAccounts.add(userAccountPoolToken.toString());
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
        console.log("Checkpoint (2.3)");
        return txs;
    }

    async createPortfolioSigned(weights: Array<BN>, poolAddresses: Array<PublicKey>, initialAmountUsdc: u64): Promise<TransactionInstruction> {
        console.assert(weights.length === poolAddresses.length);
        if (weights.length != poolAddresses.length) {
            throw Error("Does not match in legth!");
        }
        const numPositions = new BN(weights.length);
        console.log("Creating Portfolio", this.portfolioPDA.toString());
        // console.log("Who is paying for it: ", this.payer)
        let create_transaction_instructions:TransactionInstruction  = this.solbondProgram.instruction.createPortfolio(
            new BN(this.portfolioBump),
            weights,
            new BN(numPositions),
            new BN(initialAmountUsdc),
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA, //randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [this.payer]
            }
        )
        console.log("##createPortfolio{Instruction}")
        return create_transaction_instructions;

    }

    async approvePositionWeightSaber(poolAddresses: Array<PublicKey>, amountA: u64, amountB: u64, minMintAmount: u64, index: number, weight: BN): Promise<TransactionInstruction> {

        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        let poolAddress = poolAddresses[index];
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;

        // Make sure to swap amountA and amountB accordingly ...
        // TODO: Make sure that A corresponds to USDC, or do a swap in general (i.e. push whatever there is, to the swap account)
        // TODO: Gotta define how much to pay in, depending on if mintA == USDC, or mintB == USDC
        let accounts: any = {
            accounts: {
                owner: this.owner.publicKey,
                positionPda: positionPDA,
                portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                poolMint: state.poolTokenMint,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                // Create liquidity accounts
            },
        };
        if (this.payer) {
            accounts = {...accounts, signers: [this.payer]}
        }
        console.log("Printing accounts: ", accounts);
        let approveWeightInstruction: TransactionInstruction = await this.solbondProgram.instruction.approvePositionWeightSaber(
            this.portfolioBump,
            bumpPosition,
            new BN(weight),
            new BN(amountA),
            new BN(amountB),
            new BN(minMintAmount),
            new BN(index),
            accounts
        )

        return approveWeightInstruction;
    }

    /**
     * Withdraw a Portfolio workflow:
     * 1) approve_withdraw_to_user(ctx,amount_total):
     *      ctx: context of the portfolio
     *      amount: total amount of USDC in the portfolio
     *
     * 2) for position_i in range(num_positions):
     *          approve_withdraw_amount_{PROTOCOL_NAME}(ctx, args)
     * 3) for position_i in range(num_positions):
     *          withdraw
     *
     * 3) transfer_redeemed_to_user():
     *      transfers the funds back to the user
     *
     */

    async signApproveWithdrawToUser(totalAmount: BN) {
        let ix = await this.solbondProgram.instruction.approveWithdrawToUser(
            this.portfolioBump,
            totalAmount,
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [this.payer]
            }
        )
        console.log("Signing separately")
        console.log("Done RPC Call!");
        return ix;
    }

    async approveRedeemFullPortfolio(): Promise<TransactionInstruction[]> {
        console.log("#redeemFullPortfolio()");
        console.log("(3) portfolio PDA: ", this.portfolioPDA, typeof this.portfolioPDA);
        console.log("aaa 1");
        let portfolioAccount: PortfolioAccount = (await this.solbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
        console.log("aaa 2");
        let tx: TransactionInstruction[] = [];
        for (let i = 0; i < portfolioAccount.numPositions; i++) {
            let tx0 = await this.approveWithdrawAmountSaber(i);
            if (tx0) {
                tx.push(tx0);
            }
        }
        console.log("##redeemFullPortfolio()");
        return tx;
    }

    async approveWithdrawAmountSaber(index: number): Promise<TransactionInstruction | null> {

        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        // Fetch the position
        console.log("aaa 3");
        let positionAccount: PositionAccountSaber = (await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 4");
        let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;
        let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

        // Skip this instruction, if Position has already been redeemed
        console.log("Is Redeemed is: ", positionAccount.isRedeemed);
        console.log(positionAccount);
        if (positionAccount.isRedeemed && !positionAccount.isFulfilled) {
            throw Error("Something major is off 2");
        }
        if (positionAccount.isRedeemed) {
            return null;
        }

        let ix: TransactionInstruction = await this.solbondProgram.instruction.approveWithdrawAmountSaber(
            this.portfolioBump,
            new BN(bumpPosition),
            new BN(lpAmount),
            new BN(1),
            new BN(index),
            {
                accounts: {
                    owner: this.owner.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: this.portfolioPDA,
                    poolMint: state.poolTokenMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [this.payer]
            }
        )

        return ix;

    }


    /**
     * Send USDC from the User's Wallet, to the Portfolio Account
     */
    async transferUsdcFromUserToPortfolio(): Promise<TransactionInstruction> {
        console.log("#transferUsdcFromUserToPortfolio()");
        let userUSDCAta = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);

        let ix: TransactionInstruction = this.solbondProgram.instruction.transferToPortfolio(
            new BN(this.portfolioBump),
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    userOwnedTokenAccount: userUSDCAta,
                    pdaOwnedTokenAccount: pdaUSDCAccount,
                    tokenMint: MOCK.DEV.SABER_USDC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                signers: [this.payer]
            }

        )
        console.log("##transferUsdcFromUserToPortfolio()");
        return ix;
    }

    // Now any Redeem Logic
    /**
     * Transaction to redeem the entire portfolio
     * We must get all the pool Addresses from the portfolio object
     */
    async redeemFullPortfolio(): Promise<TransactionInstruction[]> {
        console.log("#redeemFullPortfolio()");
        console.log("(3) portfolio PDA: ", this.portfolioPDA, typeof this.portfolioPDA);
        console.log("aaa 4");
        let portfolioAccount: PortfolioAccount = (await this.solbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
        console.log("aaa 5");
        let tx: TransactionInstruction[] = [];
        for (let i = 0; i < portfolioAccount.numPositions; i++) {
            let tx0 = await this.redeemSinglePositionOneSide(i);
            tx.push(tx0);
        }
        console.log("##redeemFullPortfolio()");
        return tx;
    }

    async redeemSinglePositionOneSide(index: number): Promise<TransactionInstruction> {
        console.log("#redeemSinglePositionOneSide()");
        // Get the pool address from the position PDA
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        console.log("(4) portfolio PDA: ", positionPDA, typeof positionPDA);
        console.log("aaa 6");
        let positionAccountSaber = (await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 7");
        let poolAddress = registry.saberPoolLpToken2poolAddress(positionAccountSaber.poolAddress);
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;

        console.log("positionPDA ", positionPDA.toString())
        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())

        // Gotta cross-check which one is the currency token, in this case
        let userAccount: PublicKey;
        let reserveA: PublicKey;
        let feesA: PublicKey;
        let mintA: PublicKey;
        let reserveB: PublicKey;
        // TODO: Replace this object. Replace any occurrence of MOCK.DEV.SABER_USDC with your function ...

        /**
         *  Terminology: Token A is our currency, and Token B is the other currency
         */
        // TODO: Replace the main currency
        if (MOCK.DEV.SABER_USDC.equals(state.tokenA.mint)) {
            userAccount = await getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
            reserveA = state.tokenA.reserve
            feesA = state.tokenA.adminFeeAccount
            mintA = state.tokenA.mint
            reserveB = state.tokenB.reserve

        } else if (MOCK.DEV.SABER_USDC.equals(state.tokenB.mint)) {
            userAccount = await getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
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

        // TODO: Again, this tokenAccountPool should be retrieved in the first place,
        //  and should be determined how much USDC it corresponds to, and should be retrieved as
        let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

        let ix: TransactionInstruction = this.solbondProgram.instruction.redeemPositionOneSaber(
            new BN(this.portfolioBump),
            new BN(bumpPosition),
            new BN(index),
            {
                accounts: {
                    positionPda: positionPDA,
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: this.owner.publicKey,
                    poolMint: state.poolTokenMint,
                    inputLp: userAccountpoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    swap:stableSwapState.config.swapAccount,
                    userA: userAccount,
                    reserveA: reserveA,
                    mintA: mintA,
                    reserveB: reserveB,
                    feesA: feesA,
                    saberSwapProgram: this.stableSwapProgramId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
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
        let userUSDCAta = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);

        // TODO: We assume this account exists ... gotta enforce it I guess lol
        // TODO: Again, we assume that this account exists
        let totalPDA_USDCAmount = (await this.connection.getTokenAccountBalance(pdaUSDCAccount)).value.amount;
        let ix: TransactionInstruction = this.solbondProgram.instruction.transferRedeemedToUser(
            new BN(this.portfolioBump),
            {
                accounts: {
                    portfolioOwner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    userOwnedUserA: userUSDCAta,
                    pdaOwnedUserA: pdaUSDCAccount,
                    // TODO: Also replace MOCK.DEV here
                    tokenMint: MOCK.DEV.SABER_USDC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    feesQpoolsA: this.qPoolsUsdcFees
                }
            }

        )
        console.log("##transferUsdcFromPortfolioToUser()");
        return ix;
    }

}
