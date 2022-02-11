import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import * as net from "net";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {assert} from "chai";
import {QPoolsAdmin} from "./qpools-admin";
import {QPair} from "@qpools/sdk/src/q-pair";
import {createToken} from "./invariant-utils";
import {getAssociatedTokenAddress} from "easy-spl/dist/tx/associated-token-account";
import {getPayer, MOCK} from "@qpools/sdk";
import { SaberInteractTool } from "./saber-cpi-endpoints";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import {
    StableSwap,
    findSwapAuthorityKey,
  } from "@saberhq/stableswap-sdk";
  import { u64} from '@solana/spl-token';


// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class Portfolio extends SaberInteractTool {

    public portfolioPDA: PublicKey;
    public portfolioBump: number;
    public poolAddresses: Array<PublicKey>;
    public portfolio_owner: PublicKey;


    async registerPortfolio(weights: Array<BN>, pool_addresses: Array<PublicKey>, owner_keypair: Keypair) {
        this.poolAddresses = pool_addresses;

        let [portfolioPDAtmp, bumpPortfoliotmp] = await await PublicKey.findProgramAddress(
            [owner_keypair.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PortFolioSeed8"))],
            this.solbondProgram.programId
        );
        this.portfolio_owner = owner_keypair.publicKey
        this.portfolioPDA = portfolioPDAtmp
        this.portfolioBump = bumpPortfoliotmp
        let finaltx = await this.solbondProgram.rpc.savePortfolio(
            new BN(this.portfolioBump),
            weights,
            {
                accounts: {
                    owner: owner_keypair.publicKey,
                    portfolioPda: this.portfolioPDA,//randomOwner.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers:[owner_keypair]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("SavePortfolio Transaction Signature is: ", finaltx);
        return finaltx;
    }

    async register_liquidity_pool(index: number, owner:Keypair) {
        const pool_address = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState
        let poolTokenMint = state.poolTokenMint

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
            this.solbondProgram.programId
        );

        let finaltx = await this.solbondProgram.rpc.initializePoolAccount(
            new BN(poolBump),
            {
                accounts: {
                    initializer: owner.publicKey,
                    poolPda: poolPDA,
                    mintLp: poolTokenMint,
                    mintA: state.tokenA.mint,
                    mintB: state.tokenB.mint,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

                },
                signers:[owner]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("registered a Pool: ", finaltx);
        return finaltx;
    }

    async create_single_position(index: number, weight: BN, amountTokenA: u64, owner: Keypair) {
        let create_liq_pool_tx = await this.register_liquidity_pool(index, owner);
        await this.provider.connection.confirmTransaction(create_liq_pool_tx);

        const pool_address = this.poolAddresses[index];
        const stableSwapState = await this.getPoolState(pool_address)
        const {state} = stableSwapState

        console.log("got state ", state);

        let poolTokenMint = state.poolTokenMint

        console.log("poolTokenMint ", poolTokenMint.toString());

        let [poolPDA, poolBump] = await PublicKey.findProgramAddress(
            [poolTokenMint.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("twoWayPool6"))],
            this.solbondProgram.programId
        );

        console.log("poolPDA ", poolPDA.toString())

        let [positonPDA, bumpPositon] = await await PublicKey.findProgramAddress(
            [owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("PositionAccount"+index.toString()))],
            this.solbondProgram.programId
        );

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


        console.log("👀 positionPda ", positonPDA.toString())

        console.log("😸 portfolioPda", this.portfolioPDA.toString());
        console.log("👾 owner.publicKey",  owner.publicKey.toString());

        console.log("🟢 poolTokenMint", poolTokenMint.toString());
        console.log("🟢 userAccountpoolToken", userAccountpoolToken.toString());

        console.log("🤯 stableSwapState.config.authority", stableSwapState.config.authority.toString());
        console.log("🤯 poolPDA", poolPDA.toString());
        
        console.log("🤥 stableSwapState.config.swapAccount", stableSwapState.config.swapAccount.toString());
        console.log("🤥 userAccountA", userAccountA.toString());
        console.log("🤗 state.tokenA.reserve", state.tokenA.reserve.toString());
        
        console.log("🤠 state.tokenB.reserve", state.tokenB.reserve.toString());
        console.log("👹 userAccountB", userAccountB.toString());
        
        console.log("🦒 mint A", state.tokenA.mint.toString());
        console.log("🦒 mint B", state.tokenB.mint.toString());
        console.log("🦒 mint LP", poolTokenMint.toString());



        let amount_a = new u64 (0)
        let amount_b = new u64 (0)
        if (state.tokenA.mint.toString() === MOCK.DEV.SABER_USDC.toString()) {
            amount_a = amountTokenA
            console.log("A IS THE WAY")
        } else {
            amount_b = amountTokenA
            console.log("B IS THE WAY")


        }

        let finaltx = await this.solbondProgram.rpc.createPositionSaber(
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
                    owner: owner.publicKey,//randomOwner.publicKey,
                    poolMint: poolTokenMint,
                    outputLp: userAccountpoolToken,
                    swapAuthority: stableSwapState.config.authority,
                    poolPda: poolPDA,
                    swap:stableSwapState.config.swapAccount,
                    qpoolsA: userAccountA,
                    poolTokenAccountA: state.tokenA.reserve,
                    poolTokenAccountB: state.tokenB.reserve,
                    qpoolsB: userAccountB,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    saberSwapProgram: this.stableSwapProgramId,
                    systemProgram: web3.SystemProgram.programId,
                    // Create liquidity accounts
                },
                signers:[owner]
            }
        )

        await this.provider.connection.confirmTransaction(finaltx);
        console.log("created a single LP position with signature: ", finaltx);

       return [finaltx, create_liq_pool_tx];
    }

    async create_full_portfolio(weights: Array<BN>,amounts: Array<u64>, owner: Keypair) {
        let transactions_sigs = []
        for (var i = 0; i < weights.length; i++) {
            let w = weights[i];
            let amountTokenA = amounts[i];
            let tx = await this.create_single_position(i, w, amountTokenA, owner)
            transactions_sigs = transactions_sigs.concat(tx)
        }

        console.log("created the full portfolio!")
        return transactions_sigs;
    }

}
