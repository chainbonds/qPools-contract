import {Connection, Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {WalletI} from "easy-spl";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import QWallet, {
     createAssociatedTokenAccountSendUnsigned,
    delay,
    IWallet, sendAndSignInstruction
} from "../utils";
import {StableSwapState} from "@saberhq/stableswap-sdk";
import {getSolbondProgram} from "../index";
import {NETWORK} from "../types/cluster";
import {PositionAccountSaber} from "../types/account/positionAccountSaber";
import * as registry from "../registry/registry-helper";
import {getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {createPositionMarinade} from "../instructions/modify/marinade";
import {
    permissionlessFulfillSaber,
    redeem_single_position,
    redeemSinglePositionOnlyOne
} from "../instructions/modify/saber";
import {sendLamports, transfer_to_user} from "../instructions/modify/portfolio-transfer";
import {getPoolState} from "../instructions/fetch/saber";
import { Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk';

export class CrankRpcCalls {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public providerWallet: IWallet;
    public wallet: Keypair;

    public portfolioPDA: PublicKey;
    public portfolioBump: number;
    public poolAddresses: registry.ExplicitSaberPool[];
    public portfolioOwner: PublicKey;

    public payer: Keypair;
    public owner: WalletI;

    // Gotta make sure that the crank-wallet sends the signatures
    public crankWallet;
    public crankProvider;
    public crankSolbondProgram;

    public marinadeState: MarinadeState;

    constructor(
        connection: Connection,
        tmpKeypair: Keypair,
        provider: Provider,
        solbondProgram: Program
    ) {

        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram;

        // Create a new provider
        // The crank covers the keypair within the provider

        // Clean the different types of providers ...

        this.crankWallet = new QWallet(tmpKeypair);
        this.crankProvider = new anchor.Provider(this.connection, this.crankWallet, {
            preflightCommitment: "confirmed"
        });
        this.crankSolbondProgram = getSolbondProgram(connection, this.crankProvider, NETWORK.DEVNET);

        this.providerWallet = this.provider.wallet;
        console.log("PPP Pubkey is: ", this.providerWallet.publicKey);
        // Get the keypair from the provider wallet

        // @ts-expect-error
        this.wallet = this.provider.wallet.payer as Keypair;

        // Also save all the pool here
        // TODO: Again, these are also duplicates. Make sure that you merge all these items!
        this.poolAddresses = registry.getActivePools();

        this.owner = provider.wallet;
        // @ts-expect-error
        this.payer = provider.wallet.payer as Keypair;

        this.loadPortfolioPdas();

        const marinadeConfig = new MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,

        });
        let marinade = new Marinade(marinadeConfig);
        MarinadeState.fetch(marinade).then((marinadeState: MarinadeState) => {
            this.marinadeState = marinadeState;
        });

        delay(1000);
    }

    async loadPortfolioPdas() {
        let [portfolioPDA, bumpPortfolio] = await getPortfolioPda(this.owner.publicKey, this.solbondProgram);
        this.portfolioPDA = portfolioPDA
        this.portfolioBump = bumpPortfolio
    }

    /**
     * Transfers
     */
    async transfer_to_user(currencyMint: PublicKey) {
        // Creating the user-account if it doesn't yet exist
        let userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            currencyMint,
            this.wallet.publicKey,
            this.owner
        );
        let ix = await transfer_to_user(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            currencyMint
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async sendToUsersWallet(tmpKeypair: PublicKey, lamports: number): Promise<TransactionInstruction> {
        return sendLamports(tmpKeypair, this.owner.publicKey, lamports);
    }

    /**
     * Saber
     */
    async permissionlessFulfillSaber(index: number) {

        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);

        // TODO: Perhaps just skip it, or check first if this exists (?)
        // Make a request, and convert it
        console.log("aaa 10");
        let currentPosition = (await this.crankSolbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 11");
        // TODO: Skip, if the isFullfilled boolean is correct
        if (currentPosition.isFulfilled) {
            console.log("Already fulfilled!");
            return;
        }

        let poolAddress = registry.saberPoolLpToken2poolAddress(currentPosition.poolAddress);
        const stableSwapState = await getPoolState(this.connection, poolAddress);
        const {state} = stableSwapState;

        // Fetch this position PDA
        // if (await accountExists(this.connection, positionPDA)) {
        // let currentPosition = await this.crankSolbondProgram.account.positionAccountSaber.fetch(positionPDA) as PositionAccountSaber;
        // Return if the current position was already fulfilled
        if (currentPosition.isFulfilled) {
            console.log("Orders were already fulfilled!");
            return "";
        }
        // }

        let ix = await permissionlessFulfillSaber(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            poolAddress,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async redeem_single_position(poolAddress: PublicKey, index: number) {
        // TODO: Rename to sth saber, or make module imports ...
        let ix = await redeem_single_position(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            poolAddress,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    async redeem_single_position_only_one(index: number) {
        // TODO: Rename function to include saber
        // TODO: Implement similar checks to the marinade commands ...
        // Or make modular imports
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        // Fetch the pool address from the position
        console.log("aaa 14");
        let currentPosition = (await this.crankSolbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        console.log("aaa 15");
        let poolAddress = registry.saberPoolLpToken2poolAddress(currentPosition.poolAddress);

        if (currentPosition.isRedeemed && !currentPosition.isFulfilled) {
            console.log("Crank Orders were already redeemed!");
            throw Error("Something major is off!");
            return;
        }

        if (currentPosition.isRedeemed) {
            console.log("Crank Orders were already redeemed!");
            return;
        }
        let ix = await redeemSinglePositionOnlyOne(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            poolAddress,
            index
        );
        return await sendAndSignInstruction(this.provider, ix);
    }

    /**
     * Marinade
     */
    async createPositionMarinade(index: number) {
        let ix = await createPositionMarinade(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            index,
            this.marinadeState
        );
        return await sendAndSignInstruction(this.provider, ix);
    }












    // async fullfillAllPermissionless(): Promise<boolean> {
    //     await this.loadPortfolioPdas();
    //     console.log("aaa 8");
    //     let portfolioAccount: PortfolioAccount = (await this.crankSolbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
    //     console.log("aaa 9");
    //     for (let index = 0; index < portfolioAccount.numPositions; index++) {
    //         await this.permissionlessFulfillSaber(index);
    //     }
    //     return true;
    // }
    //
    // /**
    //  * Send all the rest of SOL back to the user
    //  */

    // async fullfillAllWithdrawalsPermissionless(): Promise<void> {
    //     console.log("aaa 12");
    //     let portfolioAccount: PortfolioAccount = (await this.crankSolbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
    //     console.log("aaa 13");
    //     for (let index = 0; index < portfolioAccount.numPositions; index++) {
    //         await this.redeemSinglePositionOnlyOne(index);
    //     }
    // }
    //
    // async redeemSinglePositionOnlyOne(index: number): Promise<string[]> {
    // TODO: This case-distinction is important! To know which parameter to take out ...
    // TODO: Might require some more refactoring in the backend ..
    // TODO: Maybe add a refactoring item somewhere
    //     const stableSwapState = await this.getPoolState(poolAddress);
    //     const {state} = stableSwapState;
    //     console.log("got state ", state);
    //
    //     let poolTokenMint = state.poolTokenMint
    //     console.log("poolTokenMint ", poolTokenMint.toString());
    //
    //     const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
    //     console.log("authority ", authority.toString());
    //
    //     // TODO: Depending on if USDC == mintA or USDC == mintB, you should reverse these
    //
    //     let userAccount;
    //     let reserveA: PublicKey;
    //     let feesA: PublicKey;
    //     let mintA: PublicKey;
    //     let reserveB: PublicKey;
    //     let userAccountpoolToken = await getAccountForMintAndPDADontCreate(poolTokenMint, this.portfolioPDA);
    //
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
    //     console.log("👀 positionPda ", positionPDA.toString());
    //
    //     console.log("😸 portfolioPda", this.portfolioPDA.toString());
    //     console.log("👾 owner.publicKey",  this.owner.publicKey.toString());
    //
    //     console.log("🟢 poolTokenMint", poolTokenMint.toString());
    //     console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    //
    //     console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    //
    //     console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    //     console.log("🤥 userAccountA", userAccount.toString());
    //     console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    //
    //     console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    //
    //     console.log("🦒 mint A", state.tokenA.mint.toString());
    //     console.log("🦒 mint B", state.tokenB.mint.toString());
    //     console.log("🦒 mint LP", poolTokenMint.toString());
    //
    //     let finaltx = await this.crankSolbondProgram.rpc.redeemPositionOneSaber(
    //         new BN(this.portfolioBump),
    //         new BN(bumpPosition),
    //         new BN(index),
    //         {
    //             accounts: {
    //                 positionPda: positionPDA,
    //                 portfolioPda: this.portfolioPDA,
    //                 portfolioOwner: this.owner.publicKey,
    //                 poolMint: poolTokenMint,
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
    //
    //     await this.provider.connection.confirmTransaction(finaltx);
    //     console.log("Single Redeem Transaction is : ", finaltx);
    //
    //     return [finaltx];
    // }
    //
    // async transferToUser(): Promise<string[]> {
    //
    //     // Get user's PDA for USDC
    //     let userUsdcata = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.owner.publicKey);
    //     let pdaUSDCAccount = await getAccountForMintAndPDADontCreate(MOCK.DEV.SABER_USDC, this.portfolioPDA);
    //
    //     console.log("Check if these accounts exist, already ...");
    //     console.log("userUsdcata", userUsdcata.toString());
    //     console.log("pdaUSDCAccount", pdaUSDCAccount.toString());
    //     console.log("userUsdcata", await tokenAccountExists(this.connection, userUsdcata));
    //     console.log("pdaUSDCAccount", await tokenAccountExists(this.connection, pdaUSDCAccount));
    //
    //     let finaltx = await this.crankSolbondProgram.rpc.transferRedeemedToUser(
    //         new BN(this.portfolioBump),
    //         {
    //             accounts: {
    //                 portfolioPda: this.portfolioPDA,
    //                 portfolioOwner: this.owner.publicKey,
    //                 userOwnedUserA: userUsdcata,
    //                 pdaOwnedUserA: pdaUSDCAccount,
    //                 tokenProgram: TOKEN_PROGRAM_ID,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //
    //                 // Create liquidity accounts
    //             },
    //             //signers:[signer]
    //         }
    //     )
    //     await this.provider.connection.confirmTransaction(finaltx);
    //     console.log("gave user money back : ", finaltx);
    //
    //     return [finaltx];
    // }

}
