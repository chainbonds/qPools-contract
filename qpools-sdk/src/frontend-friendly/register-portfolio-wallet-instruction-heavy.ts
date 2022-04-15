import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    TokenAmount,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {BN, Program, Provider} from "@project-serum/anchor";
import {u64} from '@solana/spl-token';
import {WalletI} from "easy-spl";
import {Marinade, MarinadeConfig} from '@marinade.finance/marinade-ts-sdk';
import {
    accountExists,
    createAssociatedTokenAccountUnsignedInstruction,
    delay,
    getAssociatedTokenAddressOffCurve, getTokenAmount,
    IWallet,
    tokenAccountExists
} from "../utils";
import type {PortfolioAccount} from "../types/account/PortfolioAccount";
import type {PositionAccountSaber} from "../types/account/PositionAccountSaber";
import {getATAPda, getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk';
import type {PositionAccountMarinade} from "../types/account/PositionAccountMarinade";
import type {UserCurrencyAccount} from "../types/account/UserCurrencyAccount";
import {Registry} from "./registry";
import {multiplyAmountByPythprice} from "../instructions/pyth/multiplyAmountByPythPrice";
import {getWrappedSolMint} from "../const";
import type {PositionAccountSolend} from "../types/account/PositionAccountSolend";
import {SolendReserve, syncNative} from "@solendprotocol/solend-sdk";
import {closeAccount} from "easy-spl/dist/tx/token-instructions";
import * as instructions from "../instructions";
import {PositionInfo, Protocol, ProtocolType} from "../types/interfacing/PositionInfo";

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

    // @ts-ignore
    public portfolioPDA: PublicKey;
    // @ts-ignore
    public portfolioBump: number;

    public payer: Keypair;
    public owner: WalletI;

    // @ts-ignore
    public marinadeState: MarinadeState;
    public registry: Registry;

    // There are a lot of accounts that need would be created twice
    // (assuming we use the same pool, but that pool has not been instantiated yet)
    private createdAtaAccounts: Set<string> = new Set();

    // TODO: Should also include an async constructor probably ...
    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program,
        registry: Registry
    ) {

        this.registry = registry;

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

    async initializeState() {
        const marinadeConfig = new MarinadeConfig({
            connection: this.connection,
            publicKey: this.provider.wallet.publicKey,
        });
        let marinade = new Marinade(marinadeConfig);
        this.marinadeState = await MarinadeState.fetch(marinade);

        // Also include the solend config here ...

        // Perhaps initialize this with the mints ....
        [this.portfolioPDA, this.portfolioBump] = await getPortfolioPda(this.owner.publicKey, this.solbondProgram);
    }

    async wrapSolTransaction(lamports: BN): Promise<Transaction> {
        // First close the account if it exists, then re-create it again ...
        let out: Transaction = new Transaction();
        let wrappedSolAta = await getAssociatedTokenAddressOffCurve(
            getWrappedSolMint(),
            this.providerWallet.publicKey!
        );
        // Can only close account if it exists already ...
        // We assume that the createAssociatedTokenAccount creates these
        // Throw error if this account is not yet created ...?
        out.add(
            SystemProgram.transfer({
                fromPubkey: this.providerWallet.publicKey!,
                toPubkey: wrappedSolAta,
                lamports: lamports.toNumber(),
            })
        );
        out.add(
            syncNative(wrappedSolAta)
        )
        return out;
    }

    async unwrapSolTransaction(): Promise<Transaction> {
        let out: Transaction = new Transaction();
        let wrappedSolAta = await getAssociatedTokenAddressOffCurve(
            getWrappedSolMint(),
            this.providerWallet.publicKey!
        );
        // Add a token transfer to the guy, and then unwrap the SOL
        // TODO: Can only close account if it exists already ...
        if ((await tokenAccountExists(this.connection, wrappedSolAta))) {
            console.log("Wrapped Sol Account is closing ...!", wrappedSolAta.toString());
            out.add(
                closeAccount({
                    source: wrappedSolAta,
                    destination: this.providerWallet.publicKey!,
                    owner: this.providerWallet.publicKey!
                })
            );
        }
        return out;
    }

    /**
     * Any overhead operations, such as creating associated token accuonts
     */
    async createAssociatedTokenAccounts(
        mints: PublicKey[],
        wallet: IWallet
    ): Promise<Transaction> {

        console.log("Getting portfolio PDA");
        let createdAtaAccounts: Set<string> = new Set();
        // For the Portfolio!
        // For all saber pool addresses (tokenA, tokenB, LPToken), create associated token address
        // For MSOL, create associated token addresses
        // For USDC currency, create associated token account

        // Append the wrapped SOL mint to this just in case ..
        mints = [...mints, getWrappedSolMint()];
        // De-duplicate these mints beforehand ...
        mints = mints.map((x: PublicKey) => x.toString()).filter(function(elem, index, self) {
            return index === self.indexOf(elem);
        }).map((x: string) => new PublicKey(x));

        let tx: Transaction = new Transaction();

        // I think in an async-environment, the set logic is wrong !!!
        await Promise.all(mints.map(async (mint: PublicKey) => {
            let userAta = await getAssociatedTokenAddressOffCurve(mint, this.owner.publicKey);
            if (!(await tokenAccountExists(this.connection, userAta))) {
                console.log("Creating ATA: ", userAta.toString());
                let tx2 = await createAssociatedTokenAccountUnsignedInstruction(
                    this.connection,
                    mint,
                    userAta,
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
        if (!this.owner) {
            console.log("Warning: Owner not found!");
            return false;
        }
        return await instructions.fetch.portfolio.portfolioExists(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    async fetchPortfolio(): Promise<PortfolioAccount | null> {
        return await instructions.fetch.portfolio.fetchPortfolio(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    async fetchAllPositions(): Promise<(PositionAccountSaber | PositionAccountMarinade)[]> {
        return await instructions.fetch.position.fetchAllPositions(this.connection, this.solbondProgram, this.owner.publicKey);
    }

    async fetchAllPositionsByProtocol(protocol: Protocol): Promise<[PositionAccountSaber[], PositionAccountMarinade[], PositionAccountSolend[]]> {
        // For type-safe unpacking ...
        let out: [PositionAccountSaber[], PositionAccountMarinade[], PositionAccountSolend[]];
        if (protocol.valueOf() === Protocol.saber.valueOf()) {
            let tmp: PositionAccountSaber[] = await instructions.fetch.position.fetchAllPositionsSaber(this.connection, this.solbondProgram, this.owner.publicKey);
            out = [tmp, [], []];
        } else if (protocol.valueOf() === Protocol.marinade.valueOf()) {
            let tmp: PositionAccountMarinade[] = await instructions.fetch.position.fetchAllPositionsMarinade(this.connection, this.solbondProgram, this.owner.publicKey);
            out = [[], tmp, []]
        } else if (protocol.valueOf() === Protocol.solend.valueOf()) {
            let tmp: PositionAccountSolend[] = await instructions.fetch.position.fetchAllPositionsSolend(this.connection, this.solbondProgram, this.owner.publicKey);
            out = [[], [], tmp]
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
        let ix = await instructions.modify.portfolio.createPortfolioSigned(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            weights,
            pool_addresses,
            numCurrencies,
        );
        return ix;
    }

    async registerCurrencyInputInPortfolio(amount: BN, currencyMint: PublicKey): Promise<TransactionInstruction> {
        let ix = await instructions.modify.portfolio.registerCurrencyInputInPortfolio(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            amount,
            currencyMint
        );
        return ix;
    }

    // Redeem Operations
    async approveWithdrawPortfolio(): Promise<Transaction> {
        let tx = await instructions.modify.portfolio.approvePortfolioWithdraw(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey
        );
        return tx;
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
        token_a_amount: BN,
        token_b_amount: BN,
        min_mint_amount: BN,
        index: number,
        weight: BN
    ): Promise<TransactionInstruction> {
        // From the LP Mint, retrieve the saber pool address
        // TODO: Also change this LP-based logic in the test...
        let poolAddressFromLp = await this.registry.saberPoolLpToken2poolAddress(new PublicKey(lpTokenMint));
        if (!poolAddressFromLp) {
            throw Error("Pool address from LP not found!" + String(poolAddressFromLp));
        }
        let ix = await instructions.modify.saber.approvePositionWeightSaber(
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
    async signApproveWithdrawAmountSaber(index: number, minRedeemTokenAmount: BN): Promise<Transaction> {
        // Add some boilerplate checkers here
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        let tx = new Transaction();
        // Fetch the position
        // I guess, gotta double-check that Saber redeemable works ...
        console.log("aaa 28");
        let positionAccount: PositionAccountSaber = (await this.solbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 29");
        let poolAddress = await this.registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
        console.log("Calling Stableswap");
        if (!poolAddress) {
            throw Error("Pool Address for given lp token not found! " + String(poolAddress));
        }
        const stableSwapState = await instructions.fetch.saber.getPoolState(this.connection, poolAddress);
        console.log("getting state");
        const {state} = stableSwapState;
        console.log("get account for mint and pda");
        // let userAccountpoolToken = await getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);
        let [userAccountPoolToken, _] = await getATAPda(this.owner.publicKey, state.poolTokenMint, this.solbondProgram);
        console.log("lp amount");
        let lpAmount = (await this.connection.getTokenAccountBalance(userAccountPoolToken)).value.amount;
        console.log("Is Redeemed is: ", positionAccount.isRedeemed);
        console.log(positionAccount);
        // This is not necessarily anything off ...
        if (positionAccount.isRedeemed && !positionAccount.isFulfilled) {
            throw Error("Something major is off 2");
        }
        if (positionAccount.redeemApproved) {
            console.log("Marinade is already redeemed!");
            return tx;
        }
        let ix: Transaction = await instructions.modify.saber.signApproveWithdrawAmountSaber(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            index,
            new BN(lpAmount),
            minRedeemTokenAmount,
            this.registry
        );
        tx.add(ix);
        return tx;
    }

    /**
     * POSITION: Solend Operations (Fetch Approve);
     */
    async approvePositionWeightSolend(currencyMint: PublicKey, input_amount: BN, index: number, weight: BN) {
        let ix = await instructions.modify.solend.approvePositionWeightSolend(
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

    async approveWithdrawSolend(index: number): Promise<Transaction> {
        // Make redeem-amount the full amount

        // TODO: How do I get the balance from the solend account ...?
        // let tokenAAmount = (await this.connection.getTokenAccountBalance(portfolioAtaA)).value;
        // throw Error("Not implemented yet!");

        let tx = await instructions.modify.solend.signApproveWithdrawAmountSolend(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            index,
        );
        return tx;
    }

    /**
     * POSITION: Marinade Operations (Fetch Approve);
     */
    // Deposit
    async approvePositionWeightMarinade(init_sol_amount: BN, index: number, weight: BN): Promise<TransactionInstruction> {
        let ix = await instructions.modify.marinade.approvePositionWeightMarinade(
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
    async approveWithdrawToMarinade(index: number): Promise<Transaction> {
        let ix = await instructions.modify.marinade.approveWithdrawToMarinade(
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
    async sendToCrankWallet(tmpKeypair: PublicKey, lamports: BN): Promise<TransactionInstruction> {
        return instructions.modify.portfolioTransfer.sendLamports(this.owner.publicKey, tmpKeypair, lamports);
    }

    /**
     * Send USDC from the User's Wallet, to the Portfolio Account
     */
    async transfer_to_portfolio(currencyMint: PublicKey) {
        // TODO: Fix this function!

        // TODO: Please o god, rename this function and remove unnecessary input signatures
        let ix = await instructions.modify.portfolioTransfer.transferUsdcFromUserToPortfolio(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            currencyMint
        );
        return ix;
    }

    async parseSolendPositionInfo(positionAccount: PositionAccountSolend): Promise<PositionInfo>{
        console.log("#parseSolendPositionInfo()");

        // Add to the portfolio account
        // TODO: Implement members, gotta understand Solend for this
        // throw Error("Not yet implemented solend parseSolendPositionInfo!");
        // // @ts-ignore

        let [portfolioCurrencyAta, portfolioCurrencyAtaBump] = await getATAPda(this.owner.publicKey, positionAccount.currencyMint, this.solbondProgram);
        // Check if the portfolio has this account, and fetch any funds ...
        let currencyAmount: TokenAmount;
        if (await tokenAccountExists(this.connection, portfolioCurrencyAta)) {
            console.log("Setting currencAmount to non-zero");
            currencyAmount = (await this.connection.getTokenAccountBalance(portfolioCurrencyAta)).value;
        } else {
            console.log("Setting currencAmount to zero");
            currencyAmount = getTokenAmount(new BN(0), new BN(9));
        }
        let usdcValueA: number | null = await multiplyAmountByPythprice(currencyAmount.uiAmount!, positionAccount.currencyMint);
        if (!usdcValueA && usdcValueA !== 0) {
            throw Error("currency mint not in pyth registry: " + positionAccount.currencyMint.toString());
        }

        // Now get the lp token from the currency mint
        // and then get the funds of the user
        let solendReserve: SolendReserve | null = await this.registry.getSolendReserveFromInputCurrencyMint(positionAccount.currencyMint);
        if (!solendReserve) {
            console.log(solendReserve);
            throw Error("For this currency, no solend reserve was found! " + String(positionAccount.currencyMint));
        }

        // read out the token balance of the collateral mint account ..



        // From the reserve create a solend action or so

        // let solendObligation = new SolendObligation();
        // instead of a constructor, they just use an initialize function keyword

        // let solendAction: SolendAction = await SolendAction.initialize(
        //     "mint",
        //     new BN(0),
        //     solendReserve.config.symbol,
        //     this.portfolioPDA,
        //     this.connection,
        //     "devnet"
        // );
        // console.log("solendAction for this reserve and portfolio is: ", solendAction);

        // let solendObligation: SolendObligation = new SolendObligation(
        //     this.portfolioPDA,
        //     null,
        //     null,
        //     [solendReserve]
        // );
        // console.log("solendObligation for this reserve and portfolio is: ", solendObligation);

        let collateralMint = new PublicKey(solendReserve.config.collateralMintAddress);
        let [portfolioCollateralAta, portfolioCollateralAtaBump] = await getATAPda(this.owner.publicKey, new PublicKey(solendReserve.config.collateralMintAddress), this.solbondProgram);
        // Check if the portfolio has this account, and fetch any funds ...
        let collateralAmount: TokenAmount;
        if (await tokenAccountExists(this.connection, portfolioCollateralAta)) {
            console.log("Setting collateral to non-zero");
            collateralAmount = (await this.connection.getTokenAccountBalance(portfolioCollateralAta)).value;
        } else {
            console.log("Setting collateral to zero");
            collateralAmount = getTokenAmount(new BN(0), new BN(9));
        }
        let usdcValueLp: number | null = await multiplyAmountByPythprice(collateralAmount.uiAmount!, portfolioCollateralAta);
        if (!usdcValueLp && usdcValueLp !== 0) {
            throw Error("Collateral account not found! " + portfolioCollateralAta.toString());
        }

        let totalPositionValue = usdcValueA + usdcValueLp;
        // throw Error("Done!");

        // Also update the positionInfo at some point ...
        let out: PositionInfo = {
            protocolType: ProtocolType.Lending,
            protocol: Protocol.solend,
            index: positionAccount.index,

            // poolAddress: undefined,
            portfolio: positionAccount.portfolioPda,

            // A is the input token ...
            mintA: positionAccount.currencyMint,
            ataA: portfolioCurrencyAta,
            amountA: currencyAmount,
            usdcValueA: usdcValueA,

            // B will be fully empty ..
            // mintB: undefined,
            // ataB: undefined,
            // amountB: undefined,
            usdcValueB: 0.,

            // Will be the c-token
            mintLp: collateralMint,
            ataLp: portfolioCollateralAta,
            amountLp: collateralAmount,
            usdcValueLP: usdcValueLp,


            // Gotta calculate this from tokens a and b
            totalPositionValue: totalPositionValue
        };
        console.log("##parseSolendPositionInfo()");
        return out;
    }



    // TODO: Could also port this into a separate instruction-only file
    async parseSaberPositionInfo(positionAccount: PositionAccountSaber): Promise<PositionInfo>{
        console.log("Fetching get pool state");
        console.log("Pool Address is: ", positionAccount);
        console.log("Pool Address is: ", positionAccount.poolAddress.toString());

        // Translate from Pool Mint to Pool Address. We need to coordinate better the naming
        let saberPoolAddress: PublicKey | null = await this.registry.saberPoolLpToken2poolAddress(positionAccount.poolAddress);
        if (!saberPoolAddress) {
            throw Error("LP Mint not found! " + String(saberPoolAddress))
        }
        console.log("Saber Pool Address is: ", saberPoolAddress, typeof saberPoolAddress, saberPoolAddress.toString());
        const stableSwapState = await instructions.fetch.saber.getPoolState(this.connection, saberPoolAddress);
        const {state} = stableSwapState;

        // Now from the state, you can infer LP tokens, mints, the portfolio PDAs mints
        let [portfolioAtaA, portfolioAtaABump] = await getATAPda(this.owner.publicKey, state.tokenA.mint, this.solbondProgram);
        let [portfolioAtaB, portfolioAtaBBump] = await getATAPda(this.owner.publicKey, state.tokenB.mint, this.solbondProgram);
        let [portfolioAtaLp, portfolioAtaLpBump] = await getATAPda(this.owner.publicKey, state.poolTokenMint, this.solbondProgram);

        // Also get the token amounts, I guess lol
        let tokenAAmount = (await this.connection.getTokenAccountBalance(portfolioAtaA)).value;
        let tokenBAmount = (await this.connection.getTokenAccountBalance(portfolioAtaB)).value;
        let tokenLPAmount = (await this.connection.getTokenAccountBalance(portfolioAtaLp)).value;

        // Convert each token by the pyth price conversion, (or whatever calculation is needed here), to arrive at the USDC price
        let usdcValueA = tokenAAmount.uiAmount!;
        let usdcValueB = tokenBAmount.uiAmount!;
        // TODO: Find a way to calculate the conversion rate here easily ...
        let usdcValueLP = tokenLPAmount.uiAmount!;

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
        console.log("#parseMarinadePositionInfo()");
        console.log("Pool Address is: ", positionAccount);
        // You can make the pool address the mSOL mint for now
        // console.log("Pool Address is: ", positionAccount.poolAddress.toString());
        // Translate from Pool Mint to Pool Address. We need to coordinate better the naming
        // Now from the state, you can infer LP tokens, mints, the portfolio PDAs mints
        // Also again maybe don't hard code this (not sure if possible tho, in the end, this is also a protocol...?)
        let mSOLMint = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
        let wrappedSolMint = getWrappedSolMint();
        // This is also the LP Mint ...
        // Gotta store this in the registry
        // TODO: Make this multi-asset logic more scalable
        let [portfolioAtaMSol, portfolioAtaMSolBump] = await getATAPda(this.owner.publicKey, mSOLMint, this.solbondProgram);
        let [portfolioAtaWrappedMSol, portfolioAtaWrappedMSolBump] = await getATAPda(this.owner.publicKey, wrappedSolMint, this.solbondProgram);

        // Also get the token amounts, I guess lol
        console.log("Getting token account balances ...")
        let mSOLAmount: TokenAmount;
        if (await tokenAccountExists(this.connection, portfolioAtaMSol)) {
            mSOLAmount = (await this.connection.getTokenAccountBalance(portfolioAtaMSol)).value;
        } else {
            mSOLAmount = getTokenAmount(new BN(0), new BN(9));
        }
        // Only grab these, if the respective account exists ...
        let wrappedSolAmount: TokenAmount;
        if (await tokenAccountExists(this.connection, portfolioAtaWrappedMSol)) {
            wrappedSolAmount = (await this.connection.getTokenAccountBalance(portfolioAtaWrappedMSol)).value;
        } else {
            wrappedSolAmount = getTokenAmount(new BN(0), new BN(9));
        }
        console.log("mSOL amount in the portfolio is...: ", mSOLAmount);
        console.log("mSOL amount in the portfolio is...: ", wrappedSolAmount);

        // Interesting ... In the case of the staking and lending, the LP tokens is equivalent to the MintA Token!
        // In fact, we should probably remove the LP Token, or the MintA token from the struct in this case ...

        // Here, the usdcValueA should be normal SOL!!! (it is the input token afterall

        // Again, convert by the pyth price ...
        let usdcValueA: number | null = await multiplyAmountByPythprice(wrappedSolAmount.uiAmount!, wrappedSolMint); //  * 93.23;
        if (!usdcValueA && usdcValueA !== 0) {
            throw Error("Mint not found! This should not happen " + wrappedSolMint.toString());
        }
        let usdcValueLP: number | null = await multiplyAmountByPythprice(mSOLAmount.uiAmount!, mSOLMint);
        if (!usdcValueLP && usdcValueLP !== 0) {
            throw Error("Mint not found! This should not happen " + mSOLMint.toString());
        }

        // Sum up all the values here to arrive at the Total Position Value?
        // The LP token is equivalent to the MintA token, so we don't need to sum these up ...
        let totalPositionValue = usdcValueLP;

        // Again, perhaps we should remove the MintA token, and instead just keep the LP token ...
        // Add to the portfolio account
        let out = {
            protocolType: ProtocolType.Staking,
            protocol: Protocol.marinade,
            index: positionAccount.index,
            // poolAddress: null,
            portfolio: this.portfolioPDA,

            // Should replace this with the input currency ...
            mintA: mSOLMint,
            ataA: portfolioAtaMSol,
            amountA: mSOLAmount,
            usdcValueA: usdcValueA,

            usdcValueB: 0.,
            mintLp: mSOLMint,
            ataLp: portfolioAtaMSol,
            amountLp: mSOLAmount,
            usdcValueLP: usdcValueLP,
            totalPositionValue: totalPositionValue
        };
        console.log("##parseMarinadePositionInfo()");
        return out;
    }

    async getPortfolioAndPositions(): Promise<{
        portfolio: PortfolioAccount,
        positionsSaber: PositionAccountSaber[],
        positionsMarinade: PositionAccountMarinade[],
        positionsSolend: PositionAccountSolend[]
    }> {
        // let allPositions: (PositionAccountSaber | PositionAccountMarinade)[] = await this.fetchPositions();
        let portfolio: PortfolioAccount | null = await this.fetchPortfolio();
        if (!portfolio) {
            throw Error("No portfolio exists! You cannot get positions and stuff yet .. ");
        }
        let positionsSaber: PositionAccountSaber[] = (await this.fetchAllPositionsByProtocol(Protocol.saber))[0];
        let positionsMarinade: PositionAccountMarinade[] = (await this.fetchAllPositionsByProtocol(Protocol.marinade))[1];
        let positionsSolend: PositionAccountSolend[] = (await this.fetchAllPositionsByProtocol(Protocol.solend))[2];
        return {
            portfolio: portfolio,
            positionsSaber: positionsSaber,
            positionsMarinade: positionsMarinade,
            positionsSolend: positionsSolend
        }
    }

    async approveRedeemAllPositions(
        portfolio: PortfolioAccount,
        positionsSaber: PositionAccountSaber[],
        positionsMarinade: PositionAccountMarinade[],
        positionsSolend: PositionAccountSolend[]
    ): Promise<Transaction> {
        // let {portfolio, positionsSaber, positionsMarinade} = await this.getPortfolioAndPositions();
        // let out: TransactionInstruction[] = [];
        let out: Transaction = new Transaction();
        await Promise.all(positionsSaber.map(async(x: PositionAccountSaber) => {
            let minRedeemAmount = new BN(0);  // This is the minimum amount of tokens that should be put out ...
            let IxApproveWithdrawSaber = await this.signApproveWithdrawAmountSaber(x.index, minRedeemAmount);
            out.add(IxApproveWithdrawSaber);
        }));
        await Promise.all(positionsMarinade.map(async(x: PositionAccountMarinade) => {
            let IxApproveWithdrawMarinade = await this.approveWithdrawToMarinade(x.index);
            out.add(IxApproveWithdrawMarinade);
        }));
        await Promise.all(positionsSolend.map(async(x: PositionAccountSolend) => {
            let IxApproveWithdrawSolend = await this.approveWithdrawSolend(x.index);
            out.add(IxApproveWithdrawSolend);
        }));
        console.log("Approving Marinade Withdraw");
        return out;
    }


    async flushAllAccountsToConsole(): Promise<any> {
        console.log("#flushAllAccountsToConsole()");
        console.log("Flushing ...");
        // Get portfolio
        let portfolio: PortfolioAccount | null = await this.fetchPortfolio();
        if (!portfolio) {
            throw Error("No portfolio exists! You cannot get positions and stuff yet (2) .. ");
        }

        // Get all positions
        let allSaberPositions = await this.fetchAllPositionsByProtocol(Protocol.saber);
        let allMarinadePositions = await this.fetchAllPositionsByProtocol(Protocol.marinade);
        let allSolendPositions = await this.fetchAllPositionsByProtocol(Protocol.solend);

        // // Get all Usdc
        let allCurrencyAccounts = await this.fetchAllCurrencyAccounts();
        // let allCurrencyPositions = await this.

        console.log("Printing the state of our world ...");
        console.log(portfolio);
        console.log(allSaberPositions);
        console.log(allMarinadePositions);
        console.log(allSolendPositions);
        console.log(allCurrencyAccounts)

        //
        console.log("##flushAllAccountsToConsole()");
    }

    async fetchAllCurrencyAccounts(): Promise<UserCurrencyAccount[]> {
        let out: UserCurrencyAccount[] = await instructions.fetch.currency.getTotalInputAmount(this.connection, this.solbondProgram, this.owner.publicKey);
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
        let portfolio: PortfolioAccount | null = await this.fetchPortfolio();
        if (!portfolio) {
            throw Error("No portfolio exists! You cannot get positions and stuff yet (3).. ");
        }
        let out: PositionInfo[] = [];
        // right now, position 0 is saber, position 1 is marinade ....
        console.log("Fetching the portfolio account: ", portfolio);
        // Could actually replace this also with the function i wrote above ...
        // Perhaps it's better to do that first ...
        // For all Saber positions. redeem them like this ...
        let positionsSaber: PositionAccountSaber[] = (await this.fetchAllPositionsByProtocol(Protocol.saber))[0];
        let positionsMarinade: PositionAccountMarinade[] = (await this.fetchAllPositionsByProtocol(Protocol.marinade))[1];
        let positionsSolend: PositionAccountSolend[] = (await this.fetchAllPositionsByProtocol(Protocol.solend))[2];

        console.log("Positions Saber and Positions Marinade are: ");
        console.log(positionsSaber);
        console.log(positionsMarinade);
        console.log(positionsSolend);
        console.log("Processing all positions ...");

        // Now for each one, run their own get-position-info-algorithm
        // Could even do an async map here actually
        await Promise.all(positionsSaber.map(async (positionSaber: PositionAccountSaber) => {
            let processedPosition: PositionInfo = await this.parseSaberPositionInfo(positionSaber);
            out.push(processedPosition);
        }));
        console.log("Done processing Saber");

        await Promise.all(positionsMarinade.map(async (positionMarinade: PositionAccountMarinade) => {
            let processedPosition: PositionInfo = await this.parseMarinadePositionInfo(positionMarinade);
            out.push(processedPosition);
        }));
        console.log("Done processing Marinade");

        await Promise.all(positionsSolend.map(async (positionSolend: PositionAccountSolend) => {
            let processedPosition: PositionInfo = await this.parseSolendPositionInfo(positionSolend);
            out.push(processedPosition);
        }));
        console.log("Done processing Solend");

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
                let saberPoolAddress: PublicKey | null = await this.registry.saberPoolLpToken2poolAddress(position.poolAddress!);
                if (!saberPoolAddress) {
                    throw Error("Saber pool address not found " + String(saberPoolAddress));
                }
                const stableSwapState = await instructions.fetch.saber.getPoolState(this.connection, saberPoolAddress);
                const {state} = stableSwapState;

                let {supplyLpToken, poolContentsInUsdc} = await instructions.fetch.saber.getLpTokenExchangeRateItems(
                    this.connection,
                    this.solbondProgram,
                    this.owner.publicKey,
                    state
                );
                let amountUserLp = position.amountLp.uiAmount;
                console.log("Amount of Users LP tokens: ", String(amountUserLp));
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
                let amountUserA = position.amountA.uiAmount!;
                console.log("amountUserA", amountUserA);
                // Get Reserve B

                console.log("Token account address is: ", state.tokenB.reserve);
                let amountUserB = position.amountB!.uiAmount!;
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
                includedMints.add(position.mintB!.toString());
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

                let solendUsdcAmount = position.usdcValueA + position.usdcValueLP;
                usdAmount += solendUsdcAmount;
                // Again, we skip this for now because all tokens we work with are USDC-based
                // // Also convert here to USD,
                // let usdValueUserA = amountUserA;
                // let usdValueUserB = amountUserB;
                //
                // // We can skip this step, bcs again, we only use stablecoins for now
                // let userPositionValue = usdValueUserA + usdValueUserB + usdValueUserLp;
                includedMints.add(position.mintLp.toString());

                storedPositionUsdcAmounts.push(
                    {totalPositionValue: solendUsdcAmount}
                )
            } else if (position.protocol === Protocol.solend) {

                console.log("Position (Staking) is: ", position);

                // Just take the totalPositionUsdcAmount ...

                // let marinadeToken = position.amountA.uiAmount;
                // Multiply this with the marinade token
                // TODO: Change this with pyth oracle pricing from registry

                let marinadeUsdcAmount: number | null = await multiplyAmountByPythprice(position.amountLp.uiAmount!, position.mintLp);
                if (!marinadeUsdcAmount && marinadeUsdcAmount !== 0) {
                    throw Error("Position LP mint not registered in pyth " + position.mintLp.toString());
                }
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
}
