import {Connection, Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider} from "@project-serum/anchor";
import {delay, IWallet, QWallet, sendAndSignInstruction} from "../utils";
import {Marinade, MarinadeConfig, MarinadeState} from "@marinade.finance/marinade-ts-sdk";
import {Registry} from "./registry";
import {getSolbondProgram} from "../index";
import {getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {sendLamports} from "../instructions/modify/portfolio-transfer";
import {PortfolioAccount, PositionAccountMarinade, PositionAccountSaber} from "../types/account";
import {redeemSinglePositionOnlyOne} from "../instructions/modify/saber";
import {SolendAction} from "@solendprotocol/solend-sdk";
import {permissionlessFulfillSolend} from "../instructions/modify/solend";
import * as instructions from "../instructions";
import {Cluster, getNetworkCluster} from "../network";

export class CrankRpcCalls {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public providerWallet: IWallet;
    public wallet: Keypair;

    public portfolioPDA: PublicKey;
    public portfolioBump: number;
    public portfolioOwner: PublicKey;

    public payer: Keypair;
    public owner: IWallet;

    // Gotta make sure that the crank-wallet sends the signatures
    public crankWallet;
    public crankProvider;
    public crankSolbondProgram;
    public registry;

    public marinadeState: MarinadeState;

    constructor(
        connection: Connection,
        tmpKeypair: Keypair,
        provider: Provider,
        solbondProgram: Program,
        registry: Registry
    ) {

        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram;
        this.registry = registry;

        // Create a new provider
        // The crank covers the keypair within the provider

        // Clean the different types of providers ...

        this.crankWallet = new QWallet(tmpKeypair);
        this.crankProvider = new Provider(this.connection, this.crankWallet, {preflightCommitment: "confirmed"});
        let cluster: Cluster;
        if (getNetworkCluster() === Cluster.DEVNET) {
            cluster = Cluster.DEVNET;
        }  else {
            throw Error("Cluster not implemented! crankRpcCalls Helper class");
        }
        this.crankSolbondProgram = getSolbondProgram(connection, this.crankProvider, cluster);

        this.providerWallet = this.provider.wallet;
        console.log("PPP Pubkey is: ", this.providerWallet.publicKey);
        // Get the keypair from the provider wallet

        // @ts-expect-error
        this.wallet = this.provider.wallet.payer as Keypair;

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
        let ix = await instructions.modify.portfolioTransfer.transfer_to_user(
            this.connection,
            this.crankSolbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            currencyMint
        );
        return await sendAndSignInstruction(this.crankProvider, ix);
    }

    async sendToUsersWallet(tmpKeypair: PublicKey, lamports: BN): Promise<TransactionInstruction> {
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
            console.log("Current position: ", currentPosition);
            return;
        }

        // Fetch this position PDA
        // if (await accountExists(this.connection, positionPDA)) {
        // let currentPosition = await this.crankSolbondProgram.account.positionAccountSaber.fetch(positionPDA) as PositionAccountSaber;
        // Return if the current position was already fulfilled
        let ix = await instructions.modify.saber.permissionlessFulfillSaber(
            this.connection,
            this.crankSolbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            index,
            this.registry
        );
        console.log("Sending saber instruciton ....", ix);
        return await sendAndSignInstruction(this.crankProvider, ix);
    }

    async redeemAllPositions(portfolio: PortfolioAccount, positionsSaber: PositionAccountSaber[], positionsMarinade: PositionAccountMarinade[]): Promise<void> {
        // let {portfolio, positionsSaber, positionsMarinade} = await this.getPortfolioAndPositions();
        await Promise.all(positionsSaber.map(async (x: PositionAccountSaber) => {
            let sgRedeemSinglePositionOnlyOne = await this.redeem_single_position_only_one(x.index);
            console.log("Signature to run the crank to get back USDC is: ", sgRedeemSinglePositionOnlyOne);
        }));
        // We don't redeem marinade actively ...
        console.log("Approving Marinade Withdraw");
        return
    }

    async redeem_single_position(poolAddress: PublicKey, index: number) {
        // TODO: Rename to sth saber, or make module imports ...
        let ix = await instructions.modify.saber.redeem_single_position(
            this.connection,
            this.crankSolbondProgram,
            this.owner.publicKey,
            index,
            this.registry
        );
        return await sendAndSignInstruction(this.crankProvider, ix);
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
            this.crankSolbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            index,
            this.registry
        );
        return await sendAndSignInstruction(this.crankProvider, ix);
    }

    /**
     * Marinade
     */
    async createPositionMarinade(index: number) {
        let ix = await instructions.modify.marinade.createPositionMarinade(
            this.connection,
            this.crankSolbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            index,
            this.marinadeState
        );
        return await sendAndSignInstruction(this.crankProvider, ix);
    }


    async createPositionSolend(index: number, solendAction: SolendAction, currencyMint: PublicKey) {
        // TODO: From the currency-mint, fetch the solend symbol ...
        // tokenSymbol: string
        // TODO: Remove the harcoded tokenSymbol variable ...

        // Initialize a solend market using the mint ...

        let ix = await permissionlessFulfillSolend(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            index,
            solendAction
        );
        return await sendAndSignInstruction(this.crankProvider, ix)
    }

    async redeemPositionSolend(currencyMint: PublicKey, index: number, tokenSymbol: string) {

        let ix = await instructions.modify.solend.redeemSinglePositionSolend(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            currencyMint,
            index,
            tokenSymbol
        );
        return await sendAndSignInstruction(this.crankProvider, ix);

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
