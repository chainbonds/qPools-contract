import {Connection, Keypair, PublicKey, Signer, Transaction, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {SaberInteractTool} from "./saber-cpi-endpoints";
import {findSwapAuthorityKey, StableSwapState} from "@saberhq/stableswap-sdk";
import {u64} from '@solana/spl-token';
import {MOCK} from "./const";
import {sendAndConfirm} from "easy-spl/dist/util";
import {bnTo8, createAssociatedTokenAccountSendUnsigned, IWallet} from "./utils";
import {SEED} from "./seeds";
import {getPositionPda} from "./types/account/positionAccountSaber";

export interface PositionsInput {
    percentageWeight: BN,
    poolAddress: PublicKey,
    amount: u64
}

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class Portfolio extends SaberInteractTool {

    public portfolioPDA: PublicKey;
    public portfolioBump: number;
    public poolAddresses: Array<PublicKey>;
    public portfolio_owner: PublicKey;

    public qPools_USDC_fees: PublicKey; 

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


    // Instead of this, we can have a couple of JSON objects... Should be much cleaner
    async registerAndCreateFullPortfolio(positionInput: Array<PositionsInput>, ownerKeypair: Keypair) {

        // Create transaction array
        let transaction = new Transaction();
        let tx: TransactionInstruction;

        // TODO: Owner should not be a keypair!!

        // Pool addresses are:
        let poolAddresses: Array<PublicKey> = positionInput.map((x: PositionsInput) => x.poolAddress);
        this.poolAddresses = poolAddresses;

        // Create users' portfolio PDA
        let [_portfolioPDA, _bumpPortfolio] = await await PublicKey.findProgramAddress(
            [ownerKeypair.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );
        this.portfolio_owner = ownerKeypair.publicKey;
        this.portfolioPDA = _portfolioPDA;
        this.portfolioBump = _bumpPortfolio;


        // Should probably accept the provider instead / provider keypair
        /*
            Transaction 1: Create the portfolio
        */
        let weights: Array<BN> = positionInput.map((x: PositionsInput) => x.percentageWeight);
        tx = await this.solbondProgram.instruction.savePortfolio(
            new BN(this.portfolioBump),
            weights,
            {
                accounts: {
                    owner: ownerKeypair.publicKey,
                    portfolioPda: this.portfolioPDA,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                },
                signers: [ownerKeypair]
            }
        );
        transaction.add(tx);

        /*
            Send Transactions, and wait for all to complete ...
        */
        let sg = await this.connection.sendTransaction(transaction, [ownerKeypair]);
        console.log("Single transaction is: ", sg);
        await this.connection.confirmTransaction(sg);

    }

    async createPortfolioSigned(weights: Array<BN>, owner_keypair: Keypair, num_positions: number, initial_amount_USDC: u64, pool_addresses:Array<PublicKey>) {
        this.poolAddresses = pool_addresses;

        let [portfolioPDAtmp, bumpPortfoliotmp] = await PublicKey.findProgramAddress(
            [owner_keypair.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );
        this.portfolio_owner = owner_keypair.publicKey
        this.portfolioPDA = portfolioPDAtmp
        this.portfolioBump = bumpPortfoliotmp

        console.log("Inputs are: ");
        console.log({
            bump: this.portfolioBump,
            weights: weights,
            accounts: {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        })

        let finaltx = await this.solbondProgram.rpc.createPortfolio(
            this.portfolioBump,
            weights,
            new BN(num_positions),
            new BN(initial_amount_USDC),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        // let tx = new Transaction(ix);
        // owner_keypair
        // await sendAndConfirm(this.connection, );
        // this.provider.connection.sendTransaction(tx, [owner_keypair])
        // signers: [owner_keypair]
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("createPortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }




    async approvePositionWeightSaber(token_a_amount: u64, token_b_amount: u64, min_mint_amount: u64, index: number, weight: BN, owner_keypair: Keypair) {

        console.log("seed ",index.toString() + SEED.POSITION_ACCOUNT_APPENDUM)
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const pool_address = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState


        let poolTokenMint = state.poolTokenMint
        console.log("Inputs are: ");
        console.log({
            portfolioBump: this.portfolioBump.toString(),
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
                    portfolioPda: this.portfolioPDA.toString(),//randomOwner.publicKey,
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
            this.portfolioBump,
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
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    poolMint: poolTokenMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approvePositionWeightSaber Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async signApproveWithdrawToUser(owner_keypair: Keypair, totalAmount: BN) {


        let finaltx = await this.solbondProgram.rpc.approveWithdrawToUser(
            this.portfolioBump,
            totalAmount,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,                  
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )

        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approveWithdrawToUser Transaction Signature is: ", finaltx);
        return finaltx;


    }

    async signApproveWithdrawAmountSaber(owner_keypair: Keypair, index: number, poolTokenAmount: u64, tokenAAmount: u64) {
        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const pool_address = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState


        let poolTokenMint = state.poolTokenMint
        let finaltx = await this.solbondProgram.rpc.approveWithdrawAmountSaber(
            this.portfolioBump,
            new BN(bumpPosition),
            new BN(poolTokenAmount),
            new BN(tokenAAmount),
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey, 
                    poolMint: poolTokenMint,                 
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )

        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("approveWithdrawAmountSaber Transaction Signature is: ", finaltx);
        return finaltx;
    }





    async permissionlessFulfillSaber(owner_keypair: Keypair, index: number) {

        let [positionPDA, bumpPosition] = await getPositionPda(owner_keypair.publicKey, index, this.solbondProgram);
        const pool_address = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState
        
        let poolTokenMint = state.poolTokenMint

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())


        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
        //let userAccountA = await this.getAccountForMint(state.tokenA.mint);


        console.log("userA ", userAccountA.toString())
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
        //let userAccountB = await this.getAccountForMint(state.tokenB.mint);

        console.log("userB ", userAccountA.toString())


        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);
        //let userAccountpoolToken = await this.getAccountForMint(poolTokenMint);


        let finaltx = await this.solbondProgram.rpc.createPositionSaber(
            bumpPosition,
            this.portfolioBump,
            new BN(index),
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    outputLp:  userAccountpoolToken,
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
                    poolAddress: pool_address,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    // Create liquidity accounts
                },
                //signers: [owner_keypair]
            }
        )
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("FulfillSaberPosition Transaction Signature is: ", finaltx);
        return finaltx;
    }









    async registerPortfolio(weights: Array<BN>, pool_addresses: Array<PublicKey>, owner_keypair: Keypair) {
        this.poolAddresses = pool_addresses;

        let [portfolioPDAtmp, bumpPortfoliotmp] = await await PublicKey.findProgramAddress(
            [owner_keypair.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );
        this.portfolio_owner = owner_keypair.publicKey
        this.portfolioPDA = portfolioPDAtmp
        this.portfolioBump = bumpPortfoliotmp

        console.log("Inputs are: ");
        console.log({
            bump: this.portfolioBump,
            weights: weights,
            accounts: {
                accounts: {
                    owner: owner_keypair.publicKey,
                        portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        })

        let finaltx = await this.solbondProgram.rpc.savePortfolio(
            this.portfolioBump,
            weights,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        // let tx = new Transaction(ix);
        // owner_keypair
        // await sendAndConfirm(this.connection, );
        // this.provider.connection.sendTransaction(tx, [owner_keypair])
        // signers: [owner_keypair]
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("SavePortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async signRedeemPortfolio( pool_addresses: Array<PublicKey>, owner_keypair: Keypair) {
        this.poolAddresses = pool_addresses;

        let [portfolioPDAtmp, bumpPortfoliotmp] = await await PublicKey.findProgramAddress(
            [owner_keypair.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );
        this.portfolio_owner = owner_keypair.publicKey
        this.portfolioPDA = portfolioPDAtmp
        this.portfolioBump = bumpPortfoliotmp

        

        let finaltx = await this.solbondProgram.rpc.signFullRedeem(
            this.portfolioBump,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                    // Create liquidity accounts
                },
                signers: [owner_keypair]
            }
        )
        // let tx = new Transaction(ix);
        // owner_keypair
        // await sendAndConfirm(this.connection, );
        // this.provider.connection.sendTransaction(tx, [owner_keypair])
        // signers: [owner_keypair]
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("🌪🌪SigRedeemPortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async redeem_single_position(index: number, owner: Keypair) {


        const pool_address = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState

        console.log("got state ", state);

        let poolTokenMint = state.poolTokenMint

        console.log("poolTokenMint ", poolTokenMint.toString());

        /*let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.LP_POOL_ACCOUNT))],
            this.solbondProgram.programId
        );

        console.log("poolPDA ", poolPDA.toString())*/

        let [positonPDA, bumpPositon] = await getPositionPda(owner.publicKey, index, this.solbondProgram);
        console.log("positionPDA ", positonPDA.toString())

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())


        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
        //let userAccountA = await this.getAccountForMint(state.tokenA.mint);


        console.log("userA ", userAccountA.toString())
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);
        //let userAccountB = await this.getAccountForMint(state.tokenB.mint);

        console.log("userB ", userAccountA.toString())


        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);
        //let userAccountpoolToken = await this.getAccountForMint(poolTokenMint);
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

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey", owner.publicKey.toString());

        console.log("🟢 poolTokenMint", poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        //console.log("🤯 poolPDA", poolPDA.toString());

        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());

        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("👹 userAccountB", userAccountB.toString());

        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", poolTokenMint.toString());


        let finaltx = await this.solbondProgram.rpc.redeemPositionSaber(
            new BN(this.portfolioBump),
            new BN(bumpPositon),
            new BN(index),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: this.portfolioPDA,
                    //poolPda: poolPDA,
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
                    // Create liquidity accounts
                },
                //signers: [owner,]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("Single Redeem Transaction is : ", finaltx);

        /*let finaltx_update = await this.solbondProgram.rpc.updatePoolStruct(
            new BN(poolBump),
            new BN(this.portfolioBump),
            {
                accounts: {
                    poolPda: poolPDA,
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    poolMint: poolTokenMint,
                    
                    userA: userAccountA,
                   
                    userB: userAccountB,
        
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                    // Create liquidity accounts
                },
                signers: [owner,]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx_update);
        console.log("🦚🦚🦚🦚Update Pool TX Is : ", finaltx_update);
        */
        return [finaltx];
    }

    async redeem_full_portfolio(weights: Array<BN>, amounts: Array<u64>, owner: Keypair) {
        let transactions_sigs = []
        for (var i = 0; i < weights.length; i++) {
            let w = weights[i];
            let amountTokenA = amounts[i];
            let tx = await this.redeem_single_position(i, owner)
            transactions_sigs = transactions_sigs.concat(tx)
        }

        console.log("redeemed! the full portfolio!")
        return transactions_sigs;
    }

    async transfer_to_portfolio(owner: IWallet, amount: u64) {
        if (!this.userOwnedUSDCAccount) {
            console.log("Creating a userOwnedUSDCAccount");
            this.userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.USDC_mint,
                this.wallet.publicKey,
                owner,
            );
            console.log("Done!");
        }

        let pdaUSDCAccount = await this.getAccountForMintAndPDA(this.USDC_mint, this.portfolioPDA);
        console.log("HHH")
        console.log("pda ", pdaUSDCAccount.toString())
        // @ts-expect-error
        let signer = this.provider.wallet.payer as keypair
        let finaltx = await this.solbondProgram.rpc.transferToPortfolio(
            new BN(this.portfolioBump),
            {
                accounts: {
                    owner: owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    userOwnedTokenAccount: this.userOwnedUSDCAccount,
                    pdaOwnedTokenAccount: pdaUSDCAccount,
                    tokenMint: this.USDC_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                //signers:[signer]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("send money from user to portfolio: ", finaltx);
        return finaltx;

    }

    async read_from_portfolio(owner: IWallet, amount: u64) {
        if (!this.userOwnedUSDCAccount) {
            console.log("Creating a userOwnedUSDCAccount");
            this.userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.USDC_mint,
                this.wallet.publicKey,
                owner,
            );
            console.log("Done!");
        }

        let pdaUSDCAccount = await this.getAccountForMintAndPDA(this.USDC_mint, this.portfolioPDA);
        console.log("HHH")
        console.log("pda ", pdaUSDCAccount.toString())
        // @ts-expect-error
        let signer = this.provider.wallet.payer as keypair
        let finaltx = await this.solbondProgram.rpc.readPortfolio(
            new BN(this.portfolioBump),
            amount,
            {
                accounts: {
                    owner: owner.publicKey,
                    portfolioPda: this.portfolioPDA,
                    userOwnedTokenAccount: this.userOwnedUSDCAccount,
                    pdaOwnedTokenAccount: pdaUSDCAccount,
                    tokenMint: this.USDC_mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                },
                signers:[signer]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("🍄🌝🌖 ", finaltx);
        return finaltx;

    }

    async transfer_to_user(owner: IWallet) {
        //this.qPools_USDC_fees = await this.getAccountForMintAndPDA(this.USDC_mint, new PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs"));

        if (!this.userOwnedUSDCAccount) {
            console.log("Creating a userOwnedUSDCAccount");
            this.userOwnedUSDCAccount = await createAssociatedTokenAccountSendUnsigned(
                this.connection,
                this.USDC_mint,
                this.wallet.publicKey,
                owner,
            );
            console.log("Done!");
        }

        let pdaUSDCAccount = await this.getAccountForMintAndPDA(this.USDC_mint, this.portfolioPDA);
        console.log("HHH")
        console.log("pda ", pdaUSDCAccount.toString())
        // @ts-expect-error
        let signer = this.provider.wallet.payer as keypair
        let finaltx = await this.solbondProgram.rpc.transferRedeemedToUser(
            new BN(this.portfolioBump),
            //new BN(amount),

            {
                accounts: {
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    userOwnedUserA: this.userOwnedUSDCAccount,
                    pdaOwnedUserA: pdaUSDCAccount,
                    //feesQpoolsA: this.qPools_USDC_fees,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                    // Create liquidity accounts
                },
                //signers:[signer]
            }
        )
        await this.provider.connection.confirmTransaction(finaltx);
        console.log("gave user money back : ", finaltx);

        return [finaltx];
    }

    async redeem_single_position_only_one(index: number, owner: Keypair) {

        const pool_address = this.poolAddresses[index];
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

        let [positonPDA, bumpPositon] = await getPositionPda(owner.publicKey, index, this.solbondProgram);
        console.log("positionPDA ", positonPDA.toString())

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())
        
        let userAccountB = await this.getAccountForMintAndPDA(state.tokenB.mint, this.portfolioPDA);

    

        let userAccountA = await this.getAccountForMintAndPDA(state.tokenA.mint, this.portfolioPDA);
        //let userAccountA = await this.getAccountForMint(state.tokenA.mint);

 
        console.log("userA ", userAccountA.toString())
        //let userAccountB = await this.getAccountForMint(state.tokenB.mint);


        
        let userAccountpoolToken = await this.getAccountForMintAndPDA(poolTokenMint, this.portfolioPDA);
        //let userAccountpoolToken = await this.getAccountForMint(poolTokenMint);
        let totalLPTokens = (await this.connection.getTokenAccountBalance(userAccountpoolToken)).value;


        console.log("👀 positionPda ", positonPDA.toString())

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey",  owner.publicKey.toString());

        console.log("🟢 poolTokenMint", poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        // console.log("🤯 poolPDA", poolPDA.toString());
        
        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
        
        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        
        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", poolTokenMint.toString());


        let finaltx = await this.solbondProgram.rpc.redeemPositionOneSaber(
            new BN(this.portfolioBump),
            new BN(bumpPositon),
            new BN(index),
            {
                accounts: {
                    positionPda: positonPDA,
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    poolMint: poolTokenMint,
                    inputLp: userAccountpoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    swap:stableSwapState.config.swapAccount,
                    userA: userAccountA,
                    reserveA: state.tokenA.reserve,
                    mintA: state.tokenA.mint,
                    reserveB: state.tokenB.reserve,
                    feesA: state.tokenA.adminFeeAccount, 
                    saberSwapProgram: this.stableSwapProgramId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                    // Create liquidity accounts
                },
                //signers:[owner]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("Single Redeem Transaction is : ", finaltx);

        /*let finaltx_update = await this.solbondProgram.rpc.updatePoolStruct(
            new BN(poolBump),
            new BN(this.portfolioBump),
            {
                accounts: {
                    poolPda: poolPDA,
                    portfolioPda: this.portfolioPDA,
                    portfolioOwner: owner.publicKey,
                    poolMint: poolTokenMint,
                    
                    userA: userAccountA,
                   
                    userB: userAccountB,
        
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,

                    // Create liquidity accounts
                },
                signers: [owner]
            }
        )*/

        // await this.provider.connection.confirmTransaction(finaltx_update);
        // console.log("Update Pool single TX Is : ", finaltx_update);

        return [finaltx];
    }

}
