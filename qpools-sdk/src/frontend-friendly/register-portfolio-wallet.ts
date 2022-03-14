import {Connection, Keypair, PublicKey, Signer, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import * as poolRegistry from "../registry/registry-helper";
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
import {accountExists, createAssociatedTokenAccountSendUnsigned, getAssociatedTokenAddressOffCurve} from "../utils";
import {SEED} from "../seeds";
import {getPortfolioPda, PortfolioAccount} from "../types/account/portfolioAccount";
import {getPositionPda, PositionAccountSaber} from "../types/account/positionAccountSaber";
import {delay} from "../utils";

export interface PositionsInput {
    percentageWeight: BN,
    poolAddress: PublicKey,
    amount: u64
}

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class PortfolioFrontendFriendly extends SaberInteractToolFrontendFriendly {

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
        // this.poolAddresses = poolRegistry.getActivePools().map((x: ExplicitSaberPool) => x.swap.config.swapAccount);
        this.poolAddresses = [
            MOCK.DEV.SABER_POOL.USDC_USDT,
            MOCK.DEV.SABER_POOL.USDC_CASH,
            MOCK.DEV.SABER_POOL.USDC_TEST
            // getActivePools.
        ];

        this.owner = provider.wallet;
        // @ts-expect-error
        this.payer = provider.wallet.payer as Keypair;

        getPortfolioPda(this.owner.publicKey, solbondProgram).then(([portfolioPDA, bumpPortfolio]) => {
            this.portfolioPDA = portfolioPDA
            this.portfolioBump = bumpPortfolio
        });
        delay(1000);

    }


    /**
     * A bunch of getter functions to display the information that was saved (or, not saved)
     * @param amount
     */
    // Get all accounts, print them, and return them
    /**
     * Get all the portfolio's that were created by the user
     */
    async fetchPortfolio(): Promise<PortfolioAccount | null> {
        console.log("#fetchPortfolio()");

        let [portfolioPDA, _] = await getPortfolioPda(this.owner.publicKey, this.solbondProgram);
        this.portfolioPDA = portfolioPDA;

        // Now get accounts data of this PDA
        // this.solbondProgram.account
        // Of course, this might not exist yet!
        let portfolioContent = null;
        if (await accountExists(this.connection, this.portfolioPDA)) {
            console.log("aaa 16");
            portfolioContent = (await this.solbondProgram.account.portfolioAccount.fetch(portfolioPDA)) as PortfolioAccount;
            console.log("aaa 17");
        }
        console.log("Portfolio Content", portfolioContent);
        console.log("##fetchPortfolio()");
        return portfolioContent;
    }

    async fetchAllPositions(): Promise<PositionAccountSaber[]> {
        console.log("#fetchAllPositions()");

        // Right now, we only have 3 liquidity pools, and that's it!
        let responses = [];

        // TODO: Instead of 3, allow more positions
        // And iterate over the poolAddresses, after you retrieved all positions

        // For each pool, return the address
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

    async fetchSinglePosition(index: number): Promise<PositionAccountSaber | null> {
        console.log("#fetchSinglePosition()");
        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);
        let positionContent = null;
        if (await accountExists(this.connection, positionPDA)) {
            console.log("aaa 18");
            positionContent = (await this.solbondProgram.account.positionAccount.fetch(positionPDA)) as PositionAccountSaber;
            console.log("aaa 19");
        }
        console.log("##fetchSinglePosition()");
        return positionContent;
    }

    async transferUsdcToPortfolio(amount: u64) {
        console.log("#transferUsdcToPortfolio()");
        // Get associated token account for the Saber USDC Token
        console.log("Get PDA userUSDC");
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        // TODO: If this account is empty, return an error! As this must already be existent!
        // All get the portfolio PDAs USDC ATA
        console.log("portfolio USDC");
        let pdaUSDCAccount = await this.getAccountForMintAndPDA(MOCK.DEV.SABER_USDC, this.portfolioPDA);
        // Assume that this account exists already

        console.log("Making transfer ...");
        console.log("Payer is: ", this.payer);
        let tx = await this.solbondProgram.rpc.transferToPortfolio(
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
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                signers: [this.payer]
            }

        )
        let sg = await this.provider.connection.confirmTransaction(tx);
        console.log("Sending money tx: ", sg);
        console.log("##transferUsdcToPortfolio()");
        return tx;
    }

    async transferToUser() {
        console.log("#transferToUser()");
        let userUSDCAta = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SABER_USDC, this.owner.publicKey);
        let pdaUSDCAccount = await this.getAccountForMintAndPDA(MOCK.DEV.SABER_USDC, this.portfolioPDA);

        // Get all token balance on the pda USDC
        let totalPDA_USDCAmount = (await this.connection.getTokenAccountBalance(pdaUSDCAccount)).value.amount;

        let tx = await this.solbondProgram.rpc.transferRedeemedToUser(
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
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                signers: [this.payer]
            }

        )
        let sg = await this.provider.connection.confirmTransaction(tx);
        console.log("Sending money tx: ", sg);
        console.log("##transferToUser()");
        return tx;
    }

    async registerPortfolio(weights: Array<BN>) {
        console.log("#registerPortfolio()");

        console.log("Payer is: ", this.payer);
        let tx = await this.solbondProgram.rpc.savePortfolio(
            this.portfolioBump,
            weights,
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
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);
        console.log("##registerPortfolio()");

    }

}
