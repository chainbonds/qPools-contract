import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider} from "@project-serum/anchor";
import {u64} from '@solana/spl-token';
import {WalletI} from "easy-spl";
import {Marinade, MarinadeConfig} from '@marinade.finance/marinade-ts-sdk';

import {
    accountExists,
    createAssociatedTokenAccountUnsignedInstruction,
    delay,
    getAccountForMintAndPDADontCreate,
    getAssociatedTokenAddressOffCurve,
    IWallet,
    tokenAccountExists
} from "../utils";
import {PortfolioAccount} from "../types/account/portfolioAccount";
import {PositionAccountSaber} from "../types/account/positionAccountSaber";

import * as registry from "../registry/registry-helper";
import {getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {fetchPortfolio, portfolioExists} from "../instructions/fetch/portfolio";
import {getLpTokenExchangeRateItems, getPoolState} from "../instructions/fetch/saber";
import {
    approvePortfolioWithdraw,
    createPortfolioSigned,
    registerCurrencyInputInPortfolio
} from "../instructions/modify/portfolio";
import {approvePositionWeightMarinade, approveWithdrawToMarinade} from "../instructions/modify/marinade";
import {Protocol} from "../types/positionInfo";
import {
    approvePositionWeightSaber,
    signApproveWithdrawAmountSaber
} from "../instructions/modify/saber";

import {
    approvePositionWeightSolend,
    signApproveWithdrawAmountSolend,
} from "../instructions/modify/solend";
import {
    sendLamports,
    transferUsdcFromUserToPortfolio
} from "../instructions/modify/portfolio-transfer";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk';
import {PositionInfo, ProtocolType} from "../types/positionInfo";
import {
    fetchAllPositionsMarinade,
    fetchAllPositionsSaber,
    fetchAllPositions
} from "../instructions/fetch/position";
import {PositionAccountMarinade} from "../types/account/positionAccountMarinade";
import {UserCurrencyAccount} from "../types/account/userCurrencyAccount";
import {getTotalInputAmount} from "../instructions/fetch/currency";
import {Registry} from "./registry";


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
export class PortfolioFrontendFriendlyChainedInstructions {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public providerWallet: IWallet;
    public wallet: Keypair;

    public portfolioPDA: PublicKey;
    public portfolioBump: number;

    public payer: Keypair;
    public owner: WalletI;

    public marinadeState: MarinadeState;
    public registry: Registry;

    // There are a lot of accounts that need would be created twice
    // (assuming we use the same pool, but that pool has not been instantiated yet)
    private createdAtaAccounts: Set<string> = new Set();

    // TODO: Should also include an async constructor probably ...
    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program
    ) {

        this.registry = new Registry();
        this.registry.initializeRegistry();

        this.owner = provider.wallet;

        if (!this.owner) {

            throw Error("Owner is empty!");
        }
        console.log("Owner is registered as: ", this.owner);
        console.log("Owner is registered as: ", this.owner.publicKey.toString());

        // @ts-expect-error
        this.payer = provider.wallet.payer as Keypair;

        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram;

        if (!this.solbondProgram) {
            throw Error("Solbond Program is empty ..");
        }
        if (!this.connection) {
            throw Error("Connection is empty ..");
        }

        this.providerWallet = this.provider.wallet;
        // Get the keypair from the provider wallet
        // @ts-expect-error
        this.wallet = this.provider.wallet.payer as Keypair;

        const marinadeConfig = new MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,

        });
        let marinade = new Marinade(marinadeConfig);
        MarinadeState.fetch(marinade).then((marinadeState: MarinadeState) => {
            this.marinadeState = marinadeState;
        });

        // Also include the solend config here ...


        // Perhaps initialize this with the mints ....
        getPortfolioPda(this.owner.publicKey, solbondProgram).then(([portfolioPDA, bumpPortfolio]) => {
            this.portfolioPDA = portfolioPDA
            this.portfolioBump = bumpPortfolio
        });
        // Wait until portfolio PDA is loaded
        delay(1000);
    }

    /**
     * Any overhead operations, such as creating associated token accuonts
     */
    async createAssociatedTokenAccounts(
        mints: PublicKey[],
        wallet: IWallet
    ): Promise<Transaction> {

        // let instructions: TransactionInstruction[] = [];
        // Change according to mainnet, or registry ...

        console.log("Getting portfolio PDA");
        let [portfolioPDA, portfolioBump] = await getPortfolioPda(this.owner.publicKey, this.solbondProgram);
        let createdAtaAccounts: Set<string> = new Set();
        // For the Portfolio!
        // For all saber pool addresses (tokenA, tokenB, LPToken), create associated token address
        // For MSOL, create associated token addresses
        // For USDC currency, create associated token account

        let tx: Transaction = new Transaction();
        // await Promise.all(saber_pool_addresses.map(async (poolAddress: PublicKey) => {
        //
        //     console.log("Getting portfolio PDA");
        //     // Hmm, portfolio PDA is not
        //     const stableSwapState = await getPoolState(this.connection, poolAddress);
        //     const {state} = stableSwapState;
        //     let ixs = await registerLiquidityPoolAssociatedTokenAccountsForPortfolio(
        //         this.connection,
        //         this.solbondProgram,
        //         this.owner.publicKey,
        //         wallet,
        //         state,
        //         createdAtaAccounts  // TODO: Is this shit pass-by-reference
        //     );
        //     ixs.map((x: TransactionInstruction) => {tx.add(x)})
        //
        // }));
        // Sign this transaction

        // let mints: PublicKey[] = mints.map(([pool, token]: [registry.ExplicitPool, registry.ExplicitToken]) => {
        //     let mint = new PublicKey(token.address);
        //     // if (mint != registry.getNativeSolMint()) {
        //     //     return null;
        //     // } else {
        //     //     return mint;
        //     // }
        // }).filter((x: PublicKey | null): x is PublicKey => (x !== null));

        await Promise.all(mints.map(async (mint: PublicKey) => {

            console.log("Getting portfolio PDA");
            // Hmm, portfolio PDA is not
            // if (!(await tokenAccountExists(this.connection, usdcPortfolioAta)) && !createdAtaAccounts.has(usdcPortfolioAta.toString())) {
            // let ixs = await registerLiquidityPoolAssociatedTokenAccountsForPortfolio(
            //     this.connection,
            //     this.solbondProgram,
            //     this.owner.publicKey,
            //     wallet,
            //     state,
            //     createdAtaAccounts
            // );
            // ixs.map((x: TransactionInstruction) => {tx.add(x)})

            if (mint.equals(await registry.getNativeSolMint())) {
                return null;
            }

            let portfolioAta = await getAssociatedTokenAddressOffCurve(mint, portfolioPDA);
            if (!(await tokenAccountExists(this.connection, portfolioAta)) && !createdAtaAccounts.has(portfolioAta.toString())) {
                console.log("Creating ATA: ", portfolioAta.toString());
                let tx1 = await createAssociatedTokenAccountUnsignedInstruction(
                    this.connection,
                    mint,
                    null,
                    portfolioPDA,
                    wallet,
                );
                createdAtaAccounts.add(portfolioAta.toString());
                tx.add(tx1);
            } else {console.log("Skipping Creation of ATA: ", portfolioAta.toString());}

            let userAta = await getAssociatedTokenAddressOffCurve(mint, this.owner.publicKey);
            if (!(await tokenAccountExists(this.connection, userAta)) && !createdAtaAccounts.has(userAta.toString())) {
                console.log("Creating ATA: ", userAta.toString());
                let tx2 = await createAssociatedTokenAccountUnsignedInstruction(
                    this.connection,
                    mint,
                    null,
                    this.owner.publicKey,
                    wallet,
                );
                createdAtaAccounts.add(userAta.toString());
                tx.add(tx2);
            } else {console.log("Skipping Creation of ATA: ", userAta.toString());}

        }));
        
        return tx;
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

    async fetchAllPositions(): Promise<(PositionAccountSaber | PositionAccountMarinade)[]> {
        return await fetchAllPositions(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    async fetchAllPositionsByProtocol(protocol: Protocol): Promise<[PositionAccountSaber[], PositionAccountMarinade[]]> {
        // For type-safe unpacking ...
        let out: [PositionAccountSaber[], PositionAccountMarinade[]];
        if (protocol.valueOf() === Protocol.saber.valueOf()) {
            let tmp: PositionAccountSaber[] = await fetchAllPositionsSaber(this.connection, this.solbondProgram, this.owner.publicKey);
            out = [tmp, []];
        } else if (protocol.valueOf() === Protocol.marinade.valueOf()) {
            let tmp: PositionAccountMarinade[] = await fetchAllPositionsMarinade(this.connection, this.solbondProgram, this.owner.publicKey);
            out = [[], tmp]
        } else {
            throw Error("Protocol is neither of Saber, Marinade, " + protocol);
        }
        return out;
    }

    // Create Operations
    async createPortfolioSigned(
        weights: BN[],
        pool_addresses: PublicKey[],
        numCurrencies: BN,
    ): Promise<TransactionInstruction> {
        let ix = await createPortfolioSigned(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            weights,
            pool_addresses,
            numCurrencies,
        );
        return ix;
    }

    async registerCurrencyInputInPortfolio(amount: u64, currencyMint: PublicKey): Promise<TransactionInstruction> {
        let ix = await registerCurrencyInputInPortfolio(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            amount,
            currencyMint
        );
        return ix;
    }

    // Redeem Operations
    async approveWithdrawPortfolio(): Promise<TransactionInstruction> {
        let ix = await approvePortfolioWithdraw(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey
        );
        return ix;
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
        lpTokenMint: PublicKey,
        token_a_amount: u64,
        token_b_amount: u64,
        min_mint_amount: u64,
        index: number,
        weight: BN
    ): Promise<TransactionInstruction> {
        // From the LP Mint, retrieve the saber pool address
        // TODO: Also change this LP-based logic in the test...
        let poolAddressFromLp = await registry.saberPoolLpToken2poolAddress(new PublicKey(lpTokenMint));
        let ix = await approvePositionWeightSaber(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            poolAddressFromLp,
            token_a_amount,
            token_b_amount,
            min_mint_amount,
            index,
            weight
        );
        return ix;
    }
    // Withdraw
    async signApproveWithdrawAmountSaber(index: number, minRedeemTokenAmount: u64): Promise<TransactionInstruction> {
        // Add some boilerplate checkers here
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        // Fetch the position
        // I guess, gotta double-check that Saber redeemable works ...
        console.log("aaa 28");
        let positionAccount: PositionAccountSaber = (await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 29");
        let poolAddress = await registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
        const stableSwapState = await getPoolState(this.connection, poolAddress);
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
            this.owner.publicKey,
            index,
            new BN(lpAmount),
            minRedeemTokenAmount
        );
        return ix;
    }


    async approvePositionWeightSolend(currencyMint: PublicKey, input_amount: u64, index: number, weight: BN) {
        let ix = await approvePositionWeightSolend(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            currencyMint,
            input_amount,
            index,
            weight
        );
        return ix
    }

    async approveWithdrawSolend(index: number, redeem_amount: u64) {
        let ix = await signApproveWithdrawAmountSolend(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            index, 
            redeem_amount,
        );
        return ix;
    }

    /**
     * POSITION: Marinade Operations (Fetch Approve);
     */
    // Deposit
    async approvePositionWeightMarinade(init_sol_amount: u64, index: number, weight: BN): Promise<TransactionInstruction> {
        let ix = await approvePositionWeightMarinade(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            init_sol_amount,
            index,
            weight
        );
        return ix;
    }

    // Withdraw
    async approveWithdrawToMarinade(index: number): Promise<TransactionInstruction> {
        let ix = await approveWithdrawToMarinade(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            index,
            this.marinadeState
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
    async transfer_to_portfolio(currencyMint: PublicKey) {
        // TODO: Fix this function!

        let ix = await transferUsdcFromUserToPortfolio(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            currencyMint,
            null
        );
        return ix;
    }



    // TODO: Could also port this into a separate instruction-only file
    async parseSaberPositionInfo(positionAccount: PositionAccountSaber): Promise<PositionInfo>{
        console.log("Fetching get pool state");
        console.log("Pool Address is: ", positionAccount);
        console.log("Pool Address is: ", positionAccount.poolAddress.toString());

        // Translate from Pool Mint to Pool Address. We need to coordinate better the naming
        let saberPoolAddress = await registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
        console.log("Saber Pool Address is: ", saberPoolAddress, typeof saberPoolAddress, saberPoolAddress.toString());
        const stableSwapState = await getPoolState(this.connection, saberPoolAddress);
        const {state} = stableSwapState;

        // Now from the state, you can infer LP tokens, mints, the portfolio PDAs mints
        let portfolioAtaA = await getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
        let portfolioAtaB = await getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
        let portfolioAtaLp = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

        // Also get the token amounts, I guess lol
        let tokenAAmount = (await this.connection.getTokenAccountBalance(portfolioAtaA)).value;
        let tokenBAmount = (await this.connection.getTokenAccountBalance(portfolioAtaB)).value;
        let tokenLPAmount = (await this.connection.getTokenAccountBalance(portfolioAtaLp)).value;

        // Convert each token by the pyth price conversion, (or whatever calculation is needed here), to arrive at the USDC price
        let usdcValueA = tokenAAmount.uiAmount;
        let usdcValueB = tokenBAmount.uiAmount;
        // TODO: Find a way to calculate the conversion rate here easily ...
        let usdcValueLP = tokenLPAmount.uiAmount;

        // TODO: Calculate the virtualPrice of the LP tokens
        // TODO: Need to use whatever protocol has implemented them, depending on the curve and exact pool,
        //  this will change ...
        // Sum up all the values here to arrive at the Total Position Value?
        //  In the case of DEXLP Pools, we should only look at the LP token.
        //  There may ofc be some more tokens the portfolio account holds, we should calculate these into it in the total Portfolio value
        // usdcValueA + usdcValueB +
        let totalPositionValue = usdcValueLP;

        // Add to the portfolio account
        let out = {
            protocolType: ProtocolType.DEXLP,
            protocol: Protocol.saber,
            index: positionAccount.index,
            poolAddress: positionAccount.poolAddress,
            portfolio: this.portfolioPDA,
            mintA: state.tokenA.mint,
            ataA: portfolioAtaA,
            amountA: tokenAAmount,
            usdcValueA: usdcValueA,
            mintB: state.tokenB.mint,
            ataB: portfolioAtaB,
            amountB: tokenBAmount,
            usdcValueB: usdcValueB,
            mintLp: state.poolTokenMint,
            ataLp: portfolioAtaLp,
            amountLp: tokenLPAmount,
            usdcValueLP: usdcValueLP,
            totalPositionValue: totalPositionValue
        };

        return out;
    }

    async parseMarinadePositionInfo(positionAccount: PositionAccountMarinade): Promise<PositionInfo>{
        console.log("Pool Address is: ", positionAccount);
        // You can make the pool address the mSOL mint for now
        // console.log("Pool Address is: ", positionAccount.poolAddress.toString());
        // Translate from Pool Mint to Pool Address. We need to coordinate better the naming
        // Now from the state, you can infer LP tokens, mints, the portfolio PDAs mints
        // Also again maybe don't hard code this (not sure if possible tho, in the end, this is also a protocol...?)
        let mSOLMint = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
        // This is also the LP Mint ...
        // Gotta store this in the registry
        // TODO: Make this multi-asset logic more scalable
        let portfolioAtaMSol = await getAccountForMintAndPDADontCreate(mSOLMint, this.portfolioPDA);

        // Also get the token amounts, I guess lol
        let mSOLAmount = (await this.connection.getTokenAccountBalance(portfolioAtaMSol)).value;
        console.log("mSOL amount in the portfolio is...: ", mSOLAmount);

        // Interesting ... In the case of the staking and lending, the LP tokens is equivalent to the MintA Token!
        // In fact, we should probably remove the LP Token, or the MintA token from the struct in this case ...

        // Again, convert by the pyth price ...
        let usdcValueA = await registry.multiplyAmountByPythprice(mSOLAmount.uiAmount, mSOLMint); //  * 93.23;
        let usdcValueLP = await registry.multiplyAmountByPythprice(mSOLAmount.uiAmount, mSOLMint);

        // Sum up all the values here to arrive at the Total Position Value?
        // The LP token is equivalent to the MintA token, so we don't need to sum these up ...
        let totalPositionValue = usdcValueLP;

        // Again, perhaps we should remove the MintA token, and instead just keep the LP token ...
        // Add to the portfolio account
        let out = {
            protocolType: ProtocolType.Staking,
            protocol: Protocol.marinade,
            index: positionAccount.index,
            poolAddress: null,
            portfolio: this.portfolioPDA,
            mintA: mSOLMint,
            ataA: portfolioAtaMSol,
            amountA: mSOLAmount,
            usdcValueA: usdcValueA,
            mintB: null,
            ataB: null,
            amountB: null,
            usdcValueB: 0.,
            mintLp: mSOLMint,
            ataLp: portfolioAtaMSol,
            amountLp: mSOLAmount,
            usdcValueLP: usdcValueLP,
            totalPositionValue: totalPositionValue
        };
        return out;
    }

    async getPortfolioAndPositions(): Promise<{
        portfolio: PortfolioAccount,
        positionsSaber: PositionAccountSaber[],
        positionsMarinade: PositionAccountMarinade[]
    }> {
        // let allPositions: (PositionAccountSaber | PositionAccountMarinade)[] = await this.fetchPositions();
        let portfolio: PortfolioAccount = await this.fetchPortfolio();
        let positionsSaber: PositionAccountSaber[] = (await this.fetchAllPositionsByProtocol(Protocol.saber))[0];
        let positionsMarinade: PositionAccountMarinade[] = (await this.fetchAllPositionsByProtocol(Protocol.marinade))[1];
        return {
            portfolio: portfolio,
            positionsSaber: positionsSaber,
            positionsMarinade: positionsMarinade
        }
    }

    async approveRedeemAllPositions(portfolio: PortfolioAccount, positionsSaber: PositionAccountSaber[], positionsMarinade: PositionAccountMarinade[]): Promise<TransactionInstruction[]> {
        // let {portfolio, positionsSaber, positionsMarinade} = await this.getPortfolioAndPositions();
        let out: TransactionInstruction[] = [];
        await Promise.all(positionsSaber.map(async(x: PositionAccountSaber) => {
            let minRedeemAmount = new BN(0);  // This is the minimum amount of tokens that should be put out ...
            let IxApproveWithdrawSaber = await this.signApproveWithdrawAmountSaber(x.index, minRedeemAmount);
            out.push(IxApproveWithdrawSaber);
        }));
        await Promise.all(positionsMarinade.map(async(x: PositionAccountMarinade) => {
            let IxApproveWithdrawSaber = await this.approveWithdrawToMarinade(x.index);
            out.push(IxApproveWithdrawSaber);
        }));
        console.log("Approving Marinade Withdraw");
        return out;
    }


    async flushAllAccountsToConsole(): Promise<any> {
        console.log("#flushAllAccountsToConsole()");
        console.log("Flushing ...");
        // Get portfolio
        let portfolio = await this.fetchPortfolio();

        // Get all positions
        let allSaberPositions = await this.fetchAllPositionsByProtocol(Protocol.saber);
        let allMarinadePositions = await this.fetchAllPositionsByProtocol(Protocol.marinade);

        // // Get all Usdc
        let allCurrencyAccounts = await this.fetchAllCurrencyAccounts();
        // let allCurrencyPositions = await this.

        console.log("Printing the state of our world ...");
        console.log(portfolio);
        console.log(allSaberPositions);
        console.log(allMarinadePositions);
        console.log(allCurrencyAccounts)

        //
        console.log("##flushAllAccountsToConsole()");
    }

    async fetchAllCurrencyAccounts(): Promise<UserCurrencyAccount[]> {
        let out: UserCurrencyAccount[] = await getTotalInputAmount(this.connection, this.solbondProgram, this.owner.publicKey);
        return out;
    }

    async getInitialDepositInAllCurrencies(): Promise<any> {
        let out = await this.fetchAllCurrencyAccounts();
        console.log("Out is: ", out);
        // Sign up all these, and translate the mint's through pyth before putting out
        // let totalUsdc = 0.;
        // out.map((x) => {
        //     totalUsdc += x.initial_amount;
        // });
        let totalUsdc = 0.;

        // Todo do a "new TokenAccount" from a mint, which takes into account decimals

        return totalUsdc;
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
        console.log("Hello");
        console.log("Portfolio PDA is: ", this.portfolioPDA.toString());
        if (!(await accountExists(this.connection, this.portfolioPDA))) {
            console.log("Empty Portfolio");
            return []
        }

        // let allPositions: (PositionAccountSaber | PositionAccountMarinade)[] = await this.fetchPositions();
        let portfolio: PortfolioAccount = await this.fetchPortfolio();
        let out: PositionInfo[] = [];
        // right now, position 0 is saber, position 1 is marinade ....
        console.log("Fetching the portfolio account: ", portfolio);
        // Could actually replace this also with the function i wrote above ...
        // Perhaps it's better to do that first ...
        // For all Saber positions. redeem them like this ...
        let positionsSaber: PositionAccountSaber[] = (await this.fetchAllPositionsByProtocol(Protocol.saber))[0];
        let positionsMarinade: PositionAccountMarinade[] = (await this.fetchAllPositionsByProtocol(Protocol.marinade))[1];

        console.log("Positions Saber and Positions Marinade are: ");
        console.log(positionsSaber);
        console.log(positionsMarinade);

        // Now for each one, run their own get-position-info-algorithm
        // Could even do an async map here actually
        await Promise.all(positionsSaber.map(async (positionSaber: PositionAccountSaber) => {
            let processedPosition: PositionInfo = await this.parseSaberPositionInfo(positionSaber);
            out.push(processedPosition);
        }));

        await Promise.all(positionsMarinade.map(async (positionMarinade: PositionAccountMarinade) => {
            let processedPosition: PositionInfo = await this.parseMarinadePositionInfo(positionMarinade);
            out.push(processedPosition);
        }));

        console.log("Existing positions are: ", out);
        console.log("##getPortfolioInformation");
        return out;
    }

    // TODO: Again, make this cross-protocol compatible
    async getPortfolioUsdcValue() {
        console.log("#getPortfolioUsdcValue");
        let includedMints: Set<string> = new Set();
        let storedPositions: PositionInfo[] = await this.getPortfolioInformation();
        let usdAmount = 0.;
        let storedPositionUsdcAmounts: any = [];

        // TODO: there will be conflicts if we just take the usdc value for each position. we gotta remove redundant Mints

        console.log("All fetched data is: ", storedPositions);
        await Promise.all(storedPositions.map(async (position: PositionInfo) => {

            if (position.protocol === Protocol.saber) {
                console.log("Position (DEX) is: ", position);
                let saberPoolAddress = await registry.saberPoolLpToken2poolAddress(position.poolAddress);
                const stableSwapState = await getPoolState(this.connection, saberPoolAddress);
                const {state} = stableSwapState;

                let {supplyLpToken, poolContentsInUsdc} = await getLpTokenExchangeRateItems(
                    this.connection,
                    this.solbondProgram,
                    this.owner.publicKey,
                    state
                );
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
                console.log("amountUserA", amountUserA);
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
                // if (!includedMints.has(position.mintA.toString())) {
                //     console.log("Adding: position.mintA ", position.mintA.toString())
                //     usdAmount += amountUserA;
                // } else {
                //     console.log("Skipping: position.mintA ", position.mintA.toString())
                // }
                // if (!includedMints.has(position.mintB.toString())) {
                //     console.log("Adding: position.mintB ", position.mintB.toString())
                //     usdAmount += amountUserB;
                // } else {
                //     console.log("Skipping: position.mintB ", position.mintB.toString())
                // }
                if (!includedMints.has(position.mintLp.toString())) {
                    console.log("Adding: position.mintLp ", position.mintLp.toString())
                    usdAmount += usdValueUserLp;
                } else {
                    console.log("Skipping: position.mintLp ", position.mintLp.toString())
                }

                // Just take all the mint values, and add them if the respective mint has not yet been added

                includedMints.add(position.mintA.toString());
                includedMints.add(position.mintB.toString());
                includedMints.add(position.mintLp.toString());

                storedPositionUsdcAmounts.push(
                    {totalPositionValue: usdValueUserLp}
                )
            } else if (position.protocol === Protocol.marinade) {
                console.log("Position (Staking) is: ", position);

                // Just take the totalPositionUsdcAmount ...

                // let marinadeToken = position.amountA.uiAmount;
                // Multiply this with the marinade token
                // TODO: Change this with pyth oracle pricing from registry

                let marinadeUsdcAmount = await registry.multiplyAmountByPythprice(position.amountLp.uiAmount, position.mintLp);
                // let marinadeUsdcAmount = marinadeToken * 93;
                console.log("Marinade USDC Amount is: ", marinadeUsdcAmount)
                usdAmount += marinadeUsdcAmount
                // Again, we skip this for now because all tokens we work with are USDC-based
                // // Also convert here to USD,
                // let usdValueUserA = amountUserA;
                // let usdValueUserB = amountUserB;
                //
                // // We can skip this step, bcs again, we only use stablecoins for now
                // let userPositionValue = usdValueUserA + usdValueUserB + usdValueUserLp;
                includedMints.add(position.mintLp.toString());

                storedPositionUsdcAmounts.push(
                    {totalPositionValue: marinadeUsdcAmount}
                )
            } else {
                throw Error("Protocol Type is none of: " + JSON.stringify(position));
            }

        }));

        console.log("##getPortfolioUsdcValue");

        return {
            storedPositions: storedPositions,
            usdAmount: usdAmount,
            storedPositionUsdcAmounts: storedPositionUsdcAmounts,
        };
    }

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
}
