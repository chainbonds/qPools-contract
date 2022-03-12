import {Connection, Keypair, PublicKey, TokenAmount, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {
    findSwapAuthorityKey, normalizedTradeFee,
    StableSwap,
    StableSwapState
} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "../const";
import {WalletI} from "easy-spl";
import {SaberInteractToolFrontendFriendly} from "./saber-cpi-endpoints-wallet";
import {
    accountExists,
    bnTo8,
    createAssociatedTokenAccountUnsignedInstruction,
    getAssociatedTokenAddressOffCurve,
    tokenAccountExists
} from "../utils";
import {SEED} from "../seeds";
import {PortfolioAccount} from "../types/account/portfolioAccount";
import {PositionAccountSaber} from "../types/account/positionAccountSaber";
import {delay} from "../utils";
import {PositionInfo} from "../types/positionInfo";
import {getMethods} from "../debug-utils";
import {saberPoolLpToken2poolAddress} from "../registry/registry-helper";

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

        // Replace with currency
        // TODO: Always assume that this address exists. Write a short deploy script that includes this
        this.getAccountForMintAndPDADontCreate(
            MOCK.DEV.SABER_USDC,
            new PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs")
        ).then((x: PublicKey) => {
            this.qPoolsUsdcFees = x;
        });

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

        // console.log(getMethods(this.solbondProgram.accounts.portfolioAccount).join("\n"));
        // let response = await this.connection.getAccountInfo(portfolioPDA);
        // let portfolioContent1 = bufferToPortfolio(response.data);
        // // Fetch account, and maybe deserialize manually?
        // console.log("Portfolio Content", portfolioContent1);
        // // await delay(5000);

        let portfolioContent = (await this.solbondProgram.account.portfolioAccount.fetch(portfolioPDA)) as PortfolioAccount;
        console.log("Now fetching again ...", portfolioContent);

        console.log("##fetchPortfolio()");
        return portfolioContent;
    }

    async fetchAllPositions(): Promise<PositionAccountSaber[]> {
        console.log("#fetchAllPositions()");
        let responses = [];
        // Get the portfolio
        for (var i = 0; i < 3; i++) {
            let positionContent = await this.fetchSinglePosition(i);
            console.log("Position Content", positionContent);
            responses.push(positionContent);
        }
        console.log("##fetchAllPositions()");
        return responses;
    }

    async fetchSinglePosition(index: number): Promise<PositionAccountSaber> {
        console.log("#fetchSinglePosition()");
        let indexAsBuffer = bnTo8(new BN(index));
        let [positionPDA, bumpPosition] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))],
            this.solbondProgram.programId
        );
        console.log("Fetching position PDA ..", positionPDA.toString());
        let response = await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA);
        let positionContent = response as PositionAccountSaber;
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
    async getPortfolioInformation(): Promise<PositionInfo[]>{
        console.log("#getPortfolioInformation");

        // Get the saber stableswap state for all positions

        // return empty array if portfolio ID does not exist
        if (!(await accountExists(this.connection, this.portfolioPDA))) {
            return []
        }

        // Get the portfolio
        console.log("Fetching portfolio");
        let portfolio: PortfolioAccount = await this.fetchPortfolio();
        // Get how many positions are in the portfolio
        // console.log("Num positions are: ", portfolio.numPositions, typeof portfolio.numPositions);
        let allPositions: number = portfolio.numPositions;

        // fetchSinglePosition
        let out: PositionInfo[] = [];
        for (var index = 0; index < allPositions; index++) {

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
            console.log("Fetching account PDAs");
            let portfolioAtaA = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
            let portfolioAtaB = await this.getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
            let portfolioAtaLp = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

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

    async getLpTokenExchangeRateItems(state: StableSwapState) {

        // Get Reserve A
        console.log("Token account address is: ", state.tokenA.reserve);
        let amountReserveA = (await this.connection.getTokenAccountBalance(state.tokenA.reserve)).value.uiAmount;
        // Get Reserve B
        console.log("Token account address is: ", state.tokenA.reserve);
        let amountReserveB = (await this.connection.getTokenAccountBalance(state.tokenB.reserve)).value.uiAmount;

        if (!amountReserveA || !amountReserveB) {
            throw Error("One of the reserve values is null!" + String(amountReserveA) + " " +  String(amountReserveB));
        }
        // Convert Reserve A to it's USD value
        // Convert Reserve B to it's USD value
        // Convert to the USD currency (We can skip this step because we focus on USD stablecoins for now..)

        // Add these up, to get an idea of how much total value is in the pool
        let poolContentsInUsdc = amountReserveA + amountReserveB;
        let supplyLpToken = (await this.connection.getTokenSupply(state.poolTokenMint)).value.uiAmount;

        return {
            supplyLpToken: supplyLpToken,
            poolContentsInUsdc: poolContentsInUsdc
        };
    }

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
    async registerAtaForLiquidityPortfolio(): Promise<TransactionInstruction[]> {
        console.log("#registerAtaForLiquidityPortfolio()");
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
        console.log("##registerAtaForLiquidityPortfolio()");
        return txs;
    }

    
    async createPortfolioSigned(weights: Array<BN>, initial_amount_USDC: u64): Promise<TransactionInstruction> {
        const num_positions = new BN(weights.length);
        console.log("Creating Portfolio", this.portfolioPDA.toString());
        // console.log("Who is paying for it: ", this.payer)
        let create_transaction_instructions:TransactionInstruction  = this.solbondProgram.instruction.createPortfolio(
            new BN(this.portfolioBump),
            weights,
            new BN(num_positions),
            new BN(initial_amount_USDC),
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

    async approvePositionWeightSaber(amountA: u64, amountB: u64, minMintAmount: u64, index: number, weight: BN): Promise<TransactionInstruction> {

        // console.log("Seed String is:", [this.owner.publicKey.toString(), index.toString() + SEED.POSITION_ACCOUNT_APPENDUM]);
        // console.log("hurensohn", index);
        // console.log("hurensohn", (new BN(index)));
        // console.log("hurensohn", (new BN(index)).toString());
        // let bnIndex: BN = new BN(index);
        // console.log(bnIndex);
        // console.log(bnIndex.toString());
        let indexAsBuffer = bnTo8(new BN(index));
        // console.log("bn byte is:");
        // console.log(bn);
        // console.log(bnIndex.toBuffer());
        // throw Error('err');

        // console.log("hurensohn", (new BN(index)).toBuffer());
        // console.log("hurensohn", (new BN(index)).toBuffer('le'));
        console.log("Seed String is:", [this.owner.publicKey.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))]);

        // index.toString()
        let [positionPDA, bumpPosition] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))],
            this.solbondProgram.programId
        );

        let poolAddress = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;

        // TODO: Make sure that A corresponds to USDC, or do a swap in general (i.e. push whatever there is, to the swap account)
        console.log("All accounts are: ");
        console.log({
            accounts: {
                owner: this.owner.publicKey.toString(),
                positionPda: positionPDA.toString(),
                portfolioPda: this.portfolioPDA.toString(),//randomOwner.publicKey,
                poolMint: state.poolTokenMint.toString(),
                tokenProgram: TOKEN_PROGRAM_ID.toString(),
                systemProgram: web3.SystemProgram.programId.toString(),
                rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
                // Create liquidity accounts
            },
            signers: [this.payer]
        })
        
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

    async signApproveWithdrawToUser(totalAmount: BN) {
        let ix = await this.solbondProgram.instruction.approveWithdrawToUser(
            this.portfolioBump,
            totalAmount,
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [this.payer]
            }
        )
        console.log("Signing separately")
        console.log("Done RPC Call!");
        return ix;
    }

    async approveWithdrawAmountSaber(index: number) {

        let indexAsBuffer = bnTo8(new BN(index));
        let [positionPDA, bumpPosition] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))],
            this.solbondProgram.programId
        );
        
        let poolAddress = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;
        let userAccountpoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

        let finaltx:TransactionInstruction = await this.solbondProgram.instruction.approveWithdrawAmountSaber(
            this.portfolioBump,
            new BN(bumpPosition),
            new BN(lpAmount),
            new BN(1),
            new BN(index),
            {
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
                signers: [this.payer]
            }
        )

        return finaltx;

    }


    /**
     * Send USDC from the User's Wallet, to the Portfolio Account
     */
    async transferUsdcFromUserToPortfolio(): Promise<TransactionInstruction> {
        console.log("#transferUsdcFromUserToPortfolio()");
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        let pdaUSDCAccount = await this.getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);

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

    /**OLD
     * Register Portfolio Values
     
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
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                signers: [this.payer]
            }
        )
        console.log("##registerPortfolio()");
        return ix;
    }
    */

    async registerLiquidityPoolAssociatedTokenAccountsForPortfolio(state: StableSwapState): Promise<TransactionInstruction[]> {
        // Creating ATA accounts if not existent yet ...
        let userAccountA = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
        let userAccountB = await this.getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
        let userAccountPoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

        let txs = [];

        console.log("The individual accounts are: ");
        console.log(userAccountA.toString());
        console.log(userAccountB.toString());
        console.log(userAccountPoolToken.toString());

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
        return txs;
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
        /*let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );*/
        //console.log("poolPDA ", poolPDA.toString());

        let indexAsBuffer = bnTo8(new BN(index));
        let [positionPDA, bumpPosition] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), indexAsBuffer, Buffer.from(anchor.utils.bytes.utf8.encode(SEED.POSITION_ACCOUNT_APPENDUM))],
            this.solbondProgram.programId
        );
        console.log("positionPDA ", positionPDA.toString())
        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())

        // Gotta cross-check which one is the currency token, in this case

        let currencyMint: PublicKey;
        let userAccount: PublicKey;

        let reserveA: PublicKey;
        let feesA: PublicKey;
        let mintA: PublicKey;
        let reserveB: PublicKey;
        // TODO: Replace this object. Replace any occurrence of MOCK.DEV.SABER_USDC with your function ...

        /**
         *  Terminology: Token A is our currency, and Token B is the other currency
         */
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
        // TODO: Again, this tokenAccountPool should be retrieved in the first place,
        //  and should be determined how much USDC it corresponds to, and should be retrieved as
        let userAccountpoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value.amount;

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
                    // Create liquidity accounts
                },
                //signers:[this.wallet]
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
        // TODO: Again, we assume that this account exists
        let totalPDA_USDCAmount = (await this.connection.getTokenAccountBalance(pdaUSDCAccount)).value.amount;
        let ix: TransactionInstruction = this.solbondProgram.instruction.transferRedeemedToUser(
            new BN(this.portfolioBump),
            //new BN(totalPDA_USDCAmount),
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
                },
                //signers: [this.payer]
            }

        )
        console.log("##transferUsdcFromPortfolioToUser()");
        return ix;
    }

}
