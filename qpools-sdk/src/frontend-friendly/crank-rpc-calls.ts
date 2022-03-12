import {Connection, Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {WalletI} from "easy-spl";
import {BN, Program, Provider, web3} from "@project-serum/anchor";
import {MOCK} from "../const";
import * as anchor from "@project-serum/anchor";
import QWallet, {
    accountExists,
    createAssociatedTokenAccountUnsigned,
    delay,
    getAssociatedTokenAddressOffCurve,
    IWallet
} from "../utils";
import {findSwapAuthorityKey, StableSwap, StableSwapState} from "@saberhq/stableswap-sdk";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {sendAndConfirm} from "easy-spl/dist/util";
import * as assert from "assert";
import {getSolbondProgram, PortfolioAccount} from "../index";
import {NETWORK} from "../types/cluster";
import {getPositionPda, PositionAccountSaber} from "../types/account/positionAccountSaber";
import {getPortfolioPda} from "../types/account/portfolioAccount";
import * as registry from "../registry/registry-helper";

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
    public qPoolsUsdcFees: PublicKey;

    public payer: Keypair;
    public owner: WalletI;

    public stableSwapProgramId: PublicKey | undefined;
    public stableSwapState: StableSwapState | undefined;

    public crankWallet;
    public crankProvider;
    public crankSolbondProgram;

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

        getPortfolioPda(this.owner.publicKey, solbondProgram).then(([portfolioPDA, bumpPortfolio]) => {
            this.portfolioPDA = portfolioPDA
            this.portfolioBump = bumpPortfolio
        });

        // TODO: Maybe also bring to registry
        this.stableSwapProgramId = registry.getSaberStableSwapProgramId();

        delay(1000);
    }

    // TODO: Watch out, this line of code is a duplicate from within saber-cpi-endpoints!
    // You should really merge the two
    async getPoolState(pool_address: PublicKey) {
        const fetchedStableSwap = await StableSwap.load(
            this.connection,
            pool_address,
            this.stableSwapProgramId
        );
        assert.ok(fetchedStableSwap.config.swapAccount.equals(pool_address));
        return fetchedStableSwap;
    }

    // TODO: Watch out, this line of code is a duplicate from within saber-cpi-endpoints!
    // You should really merge the two
    async getAccountForMintAndPDA(mintKey: PublicKey, pda: PublicKey) {
        try {
            // console.log("this wallet ", this.wallet.publicKey.toString())
            // console.log("this provider wallet  ", this.provider.wallet.publicKey.toString())
            // console.log("this qpoolacc ", this.qPoolAccount.toString())

            console.log("Inputs are: ");
            console.log(mintKey, null, pda, this.providerWallet);

            let tx = await createAssociatedTokenAccountUnsigned(
                this.connection,
                mintKey,
                null,
                pda,
                this.providerWallet,
            );

            console.log("Sending tx");
            await sendAndConfirm(this.connection, tx);
            // const sg = await this.connection.sendTransaction(tx, [this.wallet]);
            // await this.connection.confirmTransaction(sg);
            //console.log("Signature for token A is: ", sg);
        } catch (e) {
            console.log("getAccountForMintAndPDA Error is: ");
            console.log(e);
        }

        const userAccount = await this.getAccountForMintAndPDADontCreate(mintKey, pda);
        return userAccount;
    }

    async getAccountForMintAndPDADontCreate(mintKey: PublicKey, pda: PublicKey) {
        return await getAssociatedTokenAddressOffCurve(mintKey, pda);
    }

    async fullfillAllPermissionless() {
        let portfolioAccount: PortfolioAccount = (await this.crankSolbondProgram.account.portfolioAccount.fetch(this.portfolioPDA)) as PortfolioAccount;
        for (let index = 0; index < portfolioAccount.numPositions; index++) {
            await this.permissionlessFulfillSaber(index);
        }
    }

    /**
     * Send all the rest of SOL back to the user
     */
    async sendToUsersWallet(tmpKeypair: PublicKey, lamports: number): Promise<TransactionInstruction> {
        return web3.SystemProgram.transfer({
            fromPubkey: tmpKeypair,
            toPubkey: this.owner.publicKey,
            lamports: lamports,
        })
    }

    async permissionlessFulfillSaber(index: number) {

        let [positionPDA, bumpPosition] = await getPositionPda(this.owner.publicKey, index, this.solbondProgram);

        // Make a request, and convert it
        let currentPosition = (await this.crankSolbondProgram.account.positionAccountSaber.fetch(positionPDA)) as PositionAccountSaber;
        let poolAddress = registry.saberPoolLpToken2poolAddress(currentPosition.poolAddress);

        const stableSwapState = await this.getPoolState(poolAddress);
        const {state} = stableSwapState

        // Fetch this position PDA
        // if (await accountExists(this.connection, positionPDA)) {
            // let currentPosition = await this.crankSolbondProgram.account.positionAccountSaber.fetch(positionPDA) as PositionAccountSaber;
            // Return if the current position was already fulfilled
        if (currentPosition.isFulfilled) {
            console.log("Orders were already fulfilled!");
            return "";
        }
        // }

        const [authority] = await findSwapAuthorityKey(state.adminAccount, this.stableSwapProgramId);
        console.log("authority ", authority.toString())
        let userAccountA = await this.getAccountForMintAndPDADontCreate(state.tokenA.mint, this.portfolioPDA);
        console.log("userA ", userAccountA.toString())
        let userAccountB = await this.getAccountForMintAndPDADontCreate(state.tokenB.mint, this.portfolioPDA);
        console.log("userB ", userAccountA.toString())
        let userAccountpoolToken = await this.getAccountForMintAndPDADontCreate(state.poolTokenMint, this.portfolioPDA);

        console.log("Sending RPC Permissionless");
        let finaltx = await this.crankSolbondProgram.rpc.createPositionSaber(
            bumpPosition,
            this.portfolioBump,
            new BN(index),
            {
                accounts: {
                    owner: this.owner.publicKey,
                    positionPda: positionPDA,
                    portfolioPda: this.portfolioPDA, //randomOwner.publicKey,
                    outputLp:  userAccountpoolToken,
                    poolMint: state.poolTokenMint,
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
        console.log("Sending RPC Permissionless");
        console.log("Signing separately")
        console.log("Done RPC Call!");

        await this.connection.confirmTransaction(finaltx);
        console.log("FulfillSaberPosition Transaction Signature is: ", finaltx);
        return finaltx;
    }
}
