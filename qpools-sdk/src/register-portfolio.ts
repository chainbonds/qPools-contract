import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import {u64} from '@solana/spl-token';
import {
    createAssociatedTokenAccountSendUnsigned,
    createAssociatedTokenAccountUnsigned,
    createAssociatedTokenAccountUnsignedInstruction,
    getAccountForMintAndPDADontCreate,
    getAssociatedTokenAddressOffCurve,
    IWallet,
    sendAndSignInstruction, tokenAccountExists
} from "./utils";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk'
import {createPortfolioSigned, registerCurrencyInputInPortfolio} from "./instructions/modify/portfolio";
import {
    approvePositionWeightMarinade,
    approveWithdrawToMarinade,
    createPositionMarinade
} from "./instructions/modify/marinade";
import {
    approvePositionWeightSaber,
    permissionlessFulfillSaber, redeemSinglePositionOnlyOne,
    signApproveWithdrawAmountSaber,
    redeem_single_position, registerLiquidityPoolAssociatedTokenAccountsForPortfolio
} from "./instructions/modify/saber";
import {
    signApproveWithdrawToUser,
    transfer_to_user,
    transferUsdcFromUserToPortfolio
} from "./instructions/modify/portfolio-transfer";
import {getPortfolioPda, getPositionPda} from "./types/account/pdas";
import {getPoolState} from "./instructions/fetch/saber";
import {MOCK} from "./const";
import {sendAndConfirm} from "easy-spl/dist/util";

// TODO: Replace all these functions by the functional functions
// And make sure that the tests are passing

export interface PositionsInput {
    percentageWeight: BN,
    poolAddress: PublicKey,
    amount: u64
}

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class Portfolio {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public wallet: Keypair;
    public providerWallet: IWallet;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program,
        wallet: Keypair,
    ) {
        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram

        this.wallet = wallet;
        this.providerWallet = this.provider.wallet;
    }

    // TODO: Create Associated Token Accounts for all Pools, Mints, Etc.
    // users' currency ATAs
    // portfolio's currency ATAs
    // portfolioPDA for all pools's Reserve Mints, and LP Mints
    async createAssociatedTokenAccounts(
        saber_pool_addresses: PublicKey[],
        owner_keypair: Keypair,
        wallet: IWallet
    ) {

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

        // let wSOL = new PublicKey("So11111111111111111111111111111111111111112");
        let wSOL = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
        // For the User!
        // Iterate through every currency ...
        // For USDC currency, create associated token account
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
     * Refactor all functions above this here!
     * @param weights
     * @param owner_keypair
     * @param num_positions
     * @param pool_addresses
     */
    async createPortfolioSigned(weights: Array<u64>, owner_keypair: Keypair, num_positions: BN, pool_addresses: Array<PublicKey>) {
        let ix = await createPortfolioSigned(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            weights,
            pool_addresses
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async registerCurrencyInputInPortfolio(owner_keypair: Keypair, amount: u64, currencyMint: PublicKey) {
        let ix = await registerCurrencyInputInPortfolio(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            amount,
            currencyMint
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async approvePositionWeightMarinade(init_sol_amount: u64, index: number, weight: BN, owner_keypair: Keypair) {
        let ix = await approvePositionWeightMarinade(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            init_sol_amount,
            index,
            weight
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async createPositionMarinade(owner_keypair: Keypair, index: number, marinade_state: MarinadeState) {
        let ix = await createPositionMarinade(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            index,
            marinade_state
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async approvePositionWeightSaber(pool_addresses: PublicKey[], token_a_amount: u64, token_b_amount: u64, min_mint_amount: u64, index: number, weight: BN, owner_keypair: Keypair) {
        let pool_address = pool_addresses[index];
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

    async approveWithdrawToMarinade(owner_keypair: Keypair, index: number, marinade_state: MarinadeState) {
        let ix = await approveWithdrawToMarinade(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            index,
            marinade_state
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async signApproveWithdrawAmountSaber(owner_keypair: Keypair, poolAddress: PublicKey, index: number, poolTokenAmount: u64, tokenAAmount: u64) {
        let ix = await signApproveWithdrawAmountSaber(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            poolAddress,
            index,
            poolTokenAmount,
            tokenAAmount
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async permissionlessFulfillSaber(owner_keypair: Keypair, poolAddress: PublicKey, index: number) {
        let ix = await permissionlessFulfillSaber(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            poolAddress,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async redeem_single_position(poolAddress: PublicKey, index: number, owner: Keypair) {
        let ix = await redeem_single_position(
            this.connection,
            this.solbondProgram,
            owner.publicKey,
            poolAddress,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

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

    async transfer_to_user(owner: IWallet, currencyMint: PublicKey) {
        // Creating the user-account if it doesn't yet exist
        let userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            currencyMint,
            this.wallet.publicKey,
            owner
        );
        let ix = await transfer_to_user(
            this.connection,
            this.solbondProgram,
            owner.publicKey,
            currencyMint
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    // TODO: Ported, and final I believe
    async redeem_single_position_only_one(pool_addresses: PublicKey[], index: number, owner: Keypair) {
        const pool_address = pool_addresses[index];
        let ix = await redeemSinglePositionOnlyOne(
            this.connection,
            this.solbondProgram,
            owner.publicKey,
            pool_address,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

}
