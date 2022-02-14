import {Connection, Keypair, PublicKey, Signer, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {SaberInteractTool} from "../saber-cpi-endpoints";
import {findSwapAuthorityKey, StableSwap, StableSwapState} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "../const";
import {sendAndConfirm} from "easy-spl/dist/util";
import {WalletI} from "easy-spl";
import {SaberInteractToolFrontendFriendly} from "./saber-cpi-endpoints-wallet";

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
        this.poolAddresses = [
            MOCK.DEV.SABER_POOL.USDC_USDT,
            MOCK.DEV.SABER_POOL.USDC_CASH,
            MOCK.DEV.SABER_POOL.USDC_TEST
        ];

        this.owner = provider.wallet;
        // @ts-expect-error
        this.payer = provider.wallet.payer as Keypair;

        PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PortFolioSeed8"))],
            this.solbondProgram.programId
        ).then(([portfolioPDA, bumpPortfolio]) => {
            this.portfolioPDA = portfolioPDA
            this.portfolioBump = bumpPortfolio
        }).finally(() => {});

    }

    async registerLiquidityPool(poolAddress: PublicKey, state: StableSwapState) {

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
            this.solbondProgram.programId
        );

        let tx = await this.solbondProgram.rpc.initializePoolAccount(
            new BN(poolBump),
            {
                accounts: {
                    initializer: this.owner.publicKey,
                    poolPda: poolPDA,
                    mintLp: state.poolTokenMint,
                    mintA: state.tokenA.mint,
                    mintB: state.tokenB.mint,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                },
                signers: [this.payer]
            }
        );
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);
    }

    async createSinglePosition(
        index: number,
        poolAddress: PublicKey,
        state: StableSwapState,
        stableSwapState: StableSwap,
        weight: BN,
        amountTokenA: u64
    ) {

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [state.poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
            this.solbondProgram.programId
        );
        let [positonPDA, bumpPositon] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PositionAccount" + index.toString()))],
            this.solbondProgram.programId
        );
        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);

        // Creating ATA accounts if not existent yet ...
        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
        let userAccountPoolToken = await this.getAccountForMintAndPDA(state.poolTokenMint, this.portfolioPDA);

        // Plan to install only in one of the pools
        let amount_a = new u64(0)
        let amount_b = new u64(0)
        if (state.tokenA.mint.toString() === MOCK.DEV.SABER_USDC.toString()) {
            amount_a = amountTokenA
            console.log("A IS THE WAY")
        } else {
            amount_b = amountTokenA
            console.log("B IS THE WAY")
        }

        console.log("👀 positionPda ", positonPDA.toString())

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey", this.owner.publicKey.toString());

        console.log("🟢 poolTokenMint", state.poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountPoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤯 poolPDA", poolPDA.toString());

        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());

        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("👹 userAccountB", userAccountB.toString());

        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", state.poolTokenMint.toString());

        let tx = await this.solbondProgram.rpc.createPositionSaber(
            new BN(poolBump),
            new BN(bumpPositon),
            new BN(this.portfolioBump),
            new BN(index),
            new BN(weight),
            new BN(amount_a),
            new BN(amount_b),
            new BN(0),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: this.portfolioPDA,
                    owner: this.owner.publicKey,
                    poolMint: state.poolTokenMint,
                    outputLp: userAccountPoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    poolPda: poolPDA,
                    swap: stableSwapState.config.swapAccount,
                    qpoolsA: userAccountA,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    qpoolsB: userAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    saberSwapProgram: this.stableSwapProgramId,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [this.payer]
            }
        )
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);

    }

    async sendUSDC() {

        // const mint = await spl.Mint.create(connection, 6, alice.publicKey, alice)
        // await bob.transferToken(mint.key, alice.publicKey, 5)

    }

    async registerPortfolio(weights: Array<BN>) {

        let tx = await this.solbondProgram.rpc.savePortfolio(
            this.portfolioBump,
            weights,
            {
                accounts: {
                    owner: this.owner.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [this.payer]
            }
        )
        console.log("Confirming...");
        let sg = await this.connection.confirmTransaction(tx);
        console.log("Transaction went through: ", sg);

    }

    async createFullPortfolio(weights: Array<BN>, amounts: Array<u64>) {
        for (var i = 0; i < weights.length; i++) {
            let w = weights[i];
            let amountTokenA = amounts[i];
            let poolAddress = this.poolAddresses[i];

            const stableSwapState = await this.getPoolState(poolAddress);
            const {state} = stableSwapState

            // First, register a liquidity position
            await this.registerLiquidityPool(
                poolAddress,
                state
            );
            await this.createSinglePosition(
                i,
                poolAddress,
                state,
                stableSwapState,
                w,
                amountTokenA
            )
        }
    }













    // async redeem_single_position(index: number, weight: BN, amountTokenA: u64, owner: Keypair) {
    //
    //
    //     const pool_address = this.poolAddresses[index];
    //     const stableSwapState = await this.getPoolState(pool_address)
    //     const {state} = stableSwapState
    //
    //     console.log("got state ", state);
    //
    //     let poolTokenMint = state.poolTokenMint
    //
    //     console.log("poolTokenMint ", poolTokenMint.toString());
    //
    //     let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
    //         [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
    //         this.solbondProgram.programId
    //     );
    //
    //     console.log("poolPDA ", poolPDA.toString())
    //
    //     let [positonPDA, bumpPositon] = await await PublicKey.findProgramAddress(
    //         [owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PositionAccount" + index.toString()))],
    //         this.solbondProgram.programId
    //     );
    //
    //     console.log("positionPDA ", positonPDA.toString())
    //
    //     const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
    //     console.log("authority ", authority.toString())
    //
    //
    //     let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
    //     //let userAccountA = await this.getAccountForMint(state.tokenA.mint);
    //
    //
    //     console.log("userA ", userAccountA.toString())
    //     let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
    //     //let userAccountB = await this.getAccountForMint(state.tokenB.mint);
    //
    //     console.log("userB ", userAccountA.toString())
    //
    //
    //     let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);
    //     //let userAccountpoolToken = await this.getAccountForMint(poolTokenMint);
    //
    //
    //     console.log("👀 positionPda ", positonPDA.toString())
    //
    //     console.log("😸 portfolioPda", this.portfolioPDA.toString());
    //     console.log("👾 owner.publicKey", owner.publicKey.toString());
    //
    //     console.log("🟢 poolTokenMint", poolTokenMint.toString());
    //     console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
    //
    //     console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
    //     console.log("🤯 poolPDA", poolPDA.toString());
    //
    //     console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
    //     console.log("🤥 userAccountA", userAccountA.toString());
    //     console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
    //
    //     console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
    //     console.log("👹 userAccountB", userAccountB.toString());
    //
    //     console.log("🦒 mint A", state.tokenA.mint.toString());
    //     console.log("🦒 mint B", state.tokenB.mint.toString());
    //     console.log("🦒 mint LP", poolTokenMint.toString());
    //
    //
    //     let finaltx = await this.solbondProgram.rpc.redeemPositionSaber(
    //         new BN(this.portfolioBump),
    //         new BN(bumpPositon),
    //         new BN(index),
    //         new BN(amountTokenA),
    //         new BN(0),
    //         new BN(0),
    //         {
    //             accounts: {
    //                 positionPda: positonPDA,
    //                 portfolioPda: this.portfolioPDA,
    //                 portfolioOwner: owner.publicKey,
    //                 poolMint: poolTokenMint,
    //                 inputLp: userAccountpoolToken,
    //                 swapAuthority: stableSwapState.config.authority,
    //                 swap: stableSwapState.config.swapAccount,
    //                 userA: userAccountA,
    //                 reserveA: state.tokenA.reserve,
    //                 reserveB: state.tokenB.reserve,
    //                 userB: userAccountB,
    //                 feesA: state.tokenA.adminFeeAccount,
    //                 feesB: state.tokenB.adminFeeAccount,
    //                 saberSwapProgram: this.stableSwapProgramId,
    //                 tokenProgram: TOKEN_PROGRAM_ID,
    //                 systemProgram: web3.SystemProgram.programId,
    //                 // Create liquidity accounts
    //             },
    //             signers: [owner,]
    //         }
    //     )
    //
    //     await this.provider.connection.confirmTransaction(finaltx);
    //     console.log("Single Redeem Transaction is : ", finaltx);
    //
    //     return [finaltx];
    // }
    //
    // async redeem_full_portfolio(weights: Array<BN>, amounts: Array<u64>, owner: Keypair) {
    //     let transactions_sigs = []
    //     for (var i = 0; i < weights.length; i++) {
    //         let w = weights[i];
    //         let amountTokenA = amounts[i];
    //         let tx = await this.redeem_single_position(i, w, amountTokenA, owner)
    //         transactions_sigs = transactions_sigs.concat(tx)
    //     }
    //
    //     console.log("redeemed! the full portfolio!")
    //     return transactions_sigs;
    // }


}
