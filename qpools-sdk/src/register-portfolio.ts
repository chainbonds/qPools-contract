import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {SaberInteractTool} from "./saber-cpi-endpoints";
import {findSwapAuthorityKey} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "./const";
import {createAssociatedTokenAccountSendUnsigned, IWallet} from "./utils";
import {MarinadeState} from '@marinade.finance/marinade-ts-sdk'
import {getMarinadeSolPda, getPortfolioPda, getPositionPda, getUserCurrencyPda} from "./types/account/pdas";

// TODO: Replace all these functions by the functional functions
// And make sure that the tests are passing

export interface PositionsInput {
    percentageWeight: BN,
    poolAddress: PublicKey,
    amount: u64
}

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class Portfolio extends SaberInteractTool {

    public USDC_mint = new PublicKey(MOCK.DEV.SABER_USDC);
    public userOwnedUSDCAccount: PublicKey;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program,
        wallet: Keypair,
    ) {
        super(
            connection,
            provider,
            solbondProgram,
            wallet
        );
    }


    async createPortfolioSigned(weights: Array<u64>, owner_keypair: Keypair, num_positions: BN, pool_addresses: Array<PublicKey>) {
        let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let finaltx = await this.solbondProgram.rpc.createPortfolio(
            portfolioBump,
            weights,
            new BN(num_positions),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: portfolioPDA,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("createPortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }


    async registerCurrencyInputInPortfolio(owner_keypair: Keypair, amount: u64, currencyMint: PublicKey) {
        let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(this.solbondProgram, owner_keypair.publicKey, currencyMint);
        let finaltx = await this.solbondProgram.rpc.approveInitialCurrencyAmount(
            new BN(bumpCurrency),
            new BN(amount),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    userCurrencyPdaAccount: currencyPDA,//randomOwner.publicKey,
                    currencyMint: currencyMint,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("registered currencyMint Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async approvePositionWeightMarinade(init_sol_amount: u64, index: number, weight: BN, owner_keypair: Keypair) {

        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        let [ownerSolPda, bumpMarinade] = await getMarinadeSolPda(owner_keypair.publicKey, this.solbondProgram);

        let finaltx = await this.solbondProgram.rpc.approvePositionWeightMarinade(
            portfolioBump,
            bumpPosition,
            new BN(bumpMarinade),
            new BN(weight),
            new BN(init_sol_amount),
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: portfolioPda,
                    ownerSolPda: ownerSolPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approvePositionWeightMarinade Transaction Signature is: ", finaltx);
        return finaltx;
    }


    async createPositionMarinade(owner_keypair: Keypair, index: number, marinade_state: MarinadeState) {

        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        let [ownerSolPda, bumpMarinade] = await getMarinadeSolPda(owner_keypair.publicKey, this.solbondProgram);
        const pda_msol = await this.getAccountForMintAndPDA(marinade_state.mSolMintAddress, portfolioPda);

        console.log("owner ", owner_keypair.toString());
        console.log("positionPDA ", positionPDA.toString());
        console.log("portfolioPDA ", portfolioPda.toString());
        console.log("state ", marinade_state.marinadeStateAddress.toString())
        console.log("msolMInt ", marinade_state.mSolMintAddress.toString())
        let finaltx = await this.solbondProgram.rpc.createPositionMarinade(
            portfolioBump,
            bumpPosition,
            new BN(bumpMarinade),
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: portfolioPda,
                    state: marinade_state.marinadeStateAddress,
                    msolMint: marinade_state.mSolMintAddress,
                    liqPoolSolLegPda: await marinade_state.solLeg(),
                    liqPoolMsolLeg: marinade_state.mSolLeg,
                    liqPoolMsolLegAuthority: await marinade_state.mSolLegAuthority(),
                    reservePda: await marinade_state.reserveAddress(),
                    ownerSolPda: ownerSolPda,
                    mintTo: pda_msol,
                    msolMintAuthority: await marinade_state.mSolMintAuthority(),
                    marinadeProgram: marinade_state.marinadeFinanceProgramId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            }
        )
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approvePositionWeightSaber Transaction Signature is: ", finaltx);
        return finaltx;


    }


    async approvePositionWeightSaber(pool_addresses: PublicKey[], token_a_amount: u64, token_b_amount: u64, min_mint_amount: u64, index: number, weight: BN, owner_keypair: Keypair) {

        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const pool_address = pool_addresses[index];
        const stableSwapState = await this.getPoolState(pool_address);
        const {state} = stableSwapState

        // Gotta switch tokenA or tokenB ...

        let poolTokenMint = state.poolTokenMint;
        console.log("Inputs are: ");
        console.log({
            portfolioBump: portfolioBump.toString(),
            positionBump: bumpPosition.toString(),
            weight: weight.toString(),
            token_a_amount: token_a_amount.toString(),
            token_b_amount: token_b_amount.toString(),
            min_mint_amount: min_mint_amount.toString(),
            index: index.toString(),
            accounts: {
                accounts: {
                    owner: owner_keypair.publicKey.toString(),
                    positionPda: positionPDA.toString(),
                    portfolioPda: portfolioPda.toString(),//randomOwner.publicKey,
                    poolMint: poolTokenMint.toString(),
                    tokenProgram: TOKEN_PROGRAM_ID.toString(),
                    systemProgram: web3.SystemProgram.programId.toString(),
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        })

        let finaltx = await this.solbondProgram.rpc.approvePositionWeightSaber(
            portfolioBump,
            bumpPosition,
            new BN(weight),
            new BN(token_a_amount),
            new BN(token_b_amount),
            new BN(min_mint_amount),
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: portfolioPda,//randomOwner.publicKey,
                    poolMint: poolTokenMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approvePositionWeightSaber Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async signApproveWithdrawToUser(owner_keypair: Keypair) {

        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let finaltx = await this.solbondProgram.rpc.approveWithdrawToUser(
            portfolioBump,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: portfolioPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approveWithdrawToUser Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async approveWithdrawToMarinade(owner_keypair: Keypair, index: number, marinade_state: MarinadeState) {

        let [portfolioPda, bumpPortfolio] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const pda_msol = await this.getAccountForMintAndPDA(marinade_state.mSolMintAddress, portfolioPda);
        const usermsol = await this.getAccountForMintAndPDA(marinade_state.mSolMintAddress, owner_keypair.publicKey);

        let finaltx = await this.solbondProgram.rpc.approveWithdrawMarinade(
            bumpPortfolio,
            new BN(bumpPosition),
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: portfolioPda,
                    pdaMsolAccount: pda_msol,
                    userMsolAccount: usermsol,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [owner_keypair]
            }
        )

    }




        async signApproveWithdrawAmountSaber(owner_keypair: Keypair, poolAddress: PublicKey, index: number, poolTokenAmount: u64, tokenAAmount: u64) {

        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;

        let poolTokenMint = state.poolTokenMint
        let finaltx = await this.solbondProgram.rpc.approveWithdrawAmountSaber(
            portfolioBump,
            new BN(bumpPosition),
            new BN(poolTokenAmount),
            new BN(tokenAAmount),
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: portfolioPda,
                    poolMint: poolTokenMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [owner_keypair]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approveWithdrawAmountSaber Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async permissionlessFulfillSaber(owner_keypair: Keypair, poolAddress: PublicKey, index: number) {

        // Index should take the account
        // And find the poolAddress through a get request
        let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState

        let poolTokenMint = state.poolTokenMint

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())
        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, portfolioPDA);
        console.log("userA ", userAccountA.toString());
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, portfolioPDA);
        console.log("userB ", userAccountA.toString());
        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, portfolioPDA);


        let finaltx = await this.solbondProgram.rpc.createPositionSaber(
            bumpPosition,
            portfolioBump,
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: portfolioPDA,//randomOwner.publicKey,
                    outputLp: userAccountpoolToken,
                    poolMint: poolTokenMint,
                    swapAuthority: stableSwapState.config.authority,
                    swap: stableSwapState.config.swapAccount,
                    qpoolsA: userAccountA,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    qpoolsB: userAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    saberSwapProgram: this.stableSwapProgramId,
                    systemProgram: web3.SystemProgram.programId,
                    poolAddress: poolAddress,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("FulfillSaberPosition Transaction Signature is: ", finaltx);
        return finaltx;
    }


    async registerPortfolio(weights: Array<BN>, owner_keypair: Keypair) {
        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        console.log("Inputs are: ");
        console.log({
            bump: portfolioBump,
            weights: weights,
            accounts: {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: portfolioPda,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        })
        let finaltx = await this.solbondProgram.rpc.savePortfolio(
            portfolioBump,
            weights,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: portfolioPda,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("SavePortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async signRedeemPortfolio(owner_keypair: Keypair) {
        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner_keypair.publicKey, this.solbondProgram);
        let finaltx = await this.solbondProgram.rpc.signFullRedeem(
            portfolioBump,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: portfolioPda,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [owner_keypair]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("🌪🌪SigRedeemPortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async redeem_single_position(poolAddress: PublicKey, index: number, owner: Keypair) {
        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState;

        let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner.publicKey, this.solbondProgram);

        console.log("got state ", state);
        let poolTokenMint = state.poolTokenMint
        console.log("poolTokenMint ", poolTokenMint.toString());
        let [positonPDA, bumpPositon] = await getPositionPda(owner.publicKey, index, this.solbondProgram);
        console.log("positionPDA ", positonPDA.toString())

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())

        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, portfolioPDA);
        console.log("userA ", userAccountA.toString())
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, portfolioPDA);
        console.log("userB ", userAccountA.toString())
        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, portfolioPDA);
        let amount_a = new u64(0);
        let amount_b = new u64(0);

        let totalLPTokens = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value;

        if (state.tokenA.mint.toString() === MOCK.DEV.SABER_USDC.toString()) {
            amount_a = new u64(1);
            console.log("A IS THE WAY")
        } else {
            amount_b = new u64(1);
            console.log("B IS THE WAY")
        }

        console.log("👀 positionPda ", positonPDA.toString())
        console.log("😸 portfolioPda", portfolioPDA.toString());
        console.log("👾 owner.publicKey", owner.publicKey.toString());
        console.log("🟢 poolTokenMint", poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("👹 userAccountB", userAccountB.toString());
        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", poolTokenMint.toString());

        let finaltx = await this.solbondProgram.rpc.redeemPositionSaber(
            new BN(portfolioBump),
            new BN(bumpPositon),
            new BN(index),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    poolMint: poolTokenMint,
                    inputLp: userAccountpoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    swap: stableSwapState.config.swapAccount,
                    userA: userAccountA,
                    reserveA: state.tokenA.reserve,
                    reserveB: state.tokenB.reserve,
                    userB: userAccountB,
                    feesA: state.tokenA.adminFeeAccount,
                    feesB: state.tokenB.adminFeeAccount,
                    saberSwapProgram: this.stableSwapProgramId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                },
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("Single Redeem Transaction is : ", finaltx);
        return [finaltx];
    }

    async transfer_to_portfolio(owner: Keypair, currencyMint: PublicKey, wrappedSolAccount: PublicKey) {

        let [portfolioPda, portfolioBump] = await getPortfolioPda(owner.publicKey, this.solbondProgram);
        let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(this.solbondProgram, owner.publicKey, currencyMint);

        let pdaUSDCAccount = await this.getAccountForMintAndPDA(currencyMint, portfolioPda);
        console.log("HHH")
        console.log("pda ", pdaUSDCAccount.toString())

        // @ts-expect-error
        let signer = this.provider.wallet.payer as keypair
        let finaltx = await this.solbondProgram.rpc.transferToPortfolio(
            new BN(portfolioBump),
            new BN(bumpCurrency),
            {
                accounts: {
                    owner: owner.publicKey,
                    portfolioPda: portfolioPda,
                    userOwnedTokenAccount: wrappedSolAccount,
                    pdaOwnedTokenAccount: pdaUSDCAccount,
                    userCurrencyPdaAccount: currencyPDA,
                    tokenMint: currencyMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                signers: [owner]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("send money from user to portfolio: ", finaltx);
        return finaltx;

    }

    async transfer_to_user(owner: IWallet, currencyMint: PublicKey) {
        if (!this.userOwnedUSDCAccount) {
            console.log("Creating a userOwnedUSDCAccount");
            this.userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                currencyMint,
                this.wallet.publicKey,
                owner,
            );
            console.log("Done!");
        }
        let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner.publicKey, this.solbondProgram);
        let pdaUSDCAccount = await this.getAccountForMintAndPDA(currencyMint, portfolioPDA);
        let [currencyPDA, bumpCurrency] = await getUserCurrencyPda(this.solbondProgram, owner.publicKey, currencyMint);

        let userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
            this.connection,
            currencyMint,
            this.wallet.publicKey,
            owner
        );

        console.log("HHH")
        console.log("pda ", pdaUSDCAccount.toString())
        // @ts-expect-error
        let signer = this.provider.wallet.payer as keypair
        let finaltx = await this.solbondProgram.rpc.transferRedeemedToUser(
            new BN(portfolioBump),
            new BN(bumpCurrency),
            {
                accounts: {
                    portfolioPda: portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    userCurrencyPdaAccount: currencyPDA,
                    userOwnedUserA: userOwnedUSDCAccount,
                    currencyMint: currencyMint,
                    pdaOwnedUserA: pdaUSDCAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("gave user money back : ", finaltx);

        return [finaltx];
    }

    // TODO: Ported, and final I believe
    async redeem_single_position_only_one(pool_addresses: PublicKey[], index: number, owner: Keypair) {

        const pool_address = pool_addresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState

        console.log("got state ", state);

        let poolTokenMint = state.poolTokenMint

        console.log("poolTokenMint ", poolTokenMint.toString());

        // let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
        //     [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
        //     this.solbondProgram.programId
        // );

        // console.log("poolPDA ", poolPDA.toString())
        let [portfolioPDA, portfolioBump] = await getPortfolioPda(owner.publicKey, this.solbondProgram);
        let [positonPDA, bumpPositon] = await getPositionPda(owner.publicKey, index, this.solbondProgram);
        console.log("positionPDA ", positonPDA.toString())

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, portfolioPDA);
        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, portfolioPDA);
        console.log("userA ", userAccountA.toString())
        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, portfolioPDA);
        let totalLPTokens = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value;

        console.log("👀 positionPda ", positonPDA.toString())
        console.log("😸 portfolioPda", portfolioPDA.toString());
        console.log("👾 owner.publicKey", owner.publicKey.toString());
        console.log("🟢 poolTokenMint", poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());
        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", poolTokenMint.toString());

        let finaltx = await this.solbondProgram.rpc.redeemPositionOneSaber(
            new BN(portfolioBump),
            new BN(bumpPositon),
            new BN(index),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    poolMint: poolTokenMint,
                    inputLp: userAccountpoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    swap: stableSwapState.config.swapAccount,
                    userA: userAccountA,
                    reserveA: state.tokenA.reserve,
                    mintA: state.tokenA.mint,
                    reserveB: state.tokenB.reserve,
                    feesA: state.tokenA.adminFeeAccount,
                    saberSwapProgram: this.stableSwapProgramId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("Single Redeem Transaction is : ", finaltx);
        return [finaltx];
    }
}
