import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {BN, Program, Provider} from "@project-serum/anchor";
import {u64} from '@solana/spl-token';
import {
    createAssociatedTokenAccountSendUnsigned,
    createAssociatedTokenAccountUnsigned, getAssociatedTokenAddressOffCurve,
    IWallet,
    sendAndSignInstruction
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
    redeem_single_position
} from "./instructions/modify/saber";
import {
    signApproveWithdrawToUser,
    transfer_to_user,
    transferUsdcFromUserToPortfolio
} from "./instructions/modify/portfolio-transfer";

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

        //// @ts-expect-error
        this.wallet = wallet;
        this.providerWallet = this.provider.wallet;
    }

    async getAccountForMintAndPDA(mintKey: PublicKey, pda: PublicKey) {

        // Gotta Hmm, should we pass on this function (?)
        // I guess better to just create these accounts if they don't exist yet ...
        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                this.connection,
                mintKey,
                null,
                pda,
                this.providerWallet,
            );

            const sg = await this.connection.sendTransaction(tx, [this.wallet]);
            await this.connection.confirmTransaction(sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }

        const userAccount = await getAssociatedTokenAddressOffCurve(mintKey, pda);
        return userAccount;
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
        let ix = await approvePositionWeightSaber(
            this.connection,
            this.solbondProgram,
            owner_keypair.publicKey,
            pool_addresses,
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
        let ix = await redeemSinglePositionOnlyOne(
            this.connection,
            this.solbondProgram,
            owner.publicKey,
            pool_addresses,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

}
