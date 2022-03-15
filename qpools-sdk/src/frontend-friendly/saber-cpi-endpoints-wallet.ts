import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Program, Provider} from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {assert} from "chai";
import {StableSwap, StableSwapState} from "@saberhq/stableswap-sdk";
import {createAssociatedTokenAccountUnsigned, getAssociatedTokenAddressOffCurve, IWallet} from "../utils";
import {sendAndConfirm} from "easy-spl/dist/util";
import * as registry from "../registry/registry-helper";

/*
    doing a deposit:
        a function which registers the portfolio with the weights
        an endpoint for calling the create_position instruction
        a function which creates the whole portfolio
*/
export class SaberInteractToolFrontendFriendly {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public providerWallet: IWallet;
    public wallet: Keypair;

    // All tokens owned by the protocol
    public qPoolAccount: PublicKey;
    public bumpQPoolAccount: number;

    public stableSwapProgramId: PublicKey | undefined;

    public currencyTokenMint: PublicKey | undefined;

    public mintA: Token | undefined;
    public mintB: Token | undefined;
    public poolMint: Token | undefined;

    public userAccountA: PublicKey | undefined;
    public userAccountB: PublicKey | undefined;
    public userAccountPoolToken: PublicKey | undefined;

    public fetchedStableSwapPool: StableSwap | undefined;
    public stableSwapState: StableSwapState | undefined;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program,
    ) {
        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram

        this.providerWallet = this.provider.wallet;
        // Get the keypair from the provider wallet
        // @ts-expect-error
        this.wallet = this.provider.wallet.payer as Keypair;
        this.stableSwapProgramId = registry.getSaberStableSwapProgramId();
    }

    /**
     * Takes in the saber stable-swap state to get the state.
     * Perhaps should allow also to input the LP token, and then automatically fetch from there, if it's a token-type
     * @param poolAddress
     */
    async getPoolState(poolAddress: PublicKey) {
        const fetchedStableSwap = await StableSwap.load(
            this.connection,
            poolAddress,
            this.stableSwapProgramId
        );

        assert.ok(fetchedStableSwap.config.swapAccount.equals(poolAddress));
        return fetchedStableSwap;
    }

    async getAccountForMintAndPDA(mintKey: PublicKey, pda: PublicKey) {
        try {
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
        } catch (e) {
            console.log("getAccountForMintAndPDA Error is: ");
            console.log(e);
        }

        const userAccount = await getAssociatedTokenAddressOffCurve(mintKey, pda);
        return userAccount;
    }

    // Yeah, the addresses will not change, but they may not be initialized yet.
    // Initialization must be done over RPC if this is not the case yet!
    async getAccountForMint(mintKey: PublicKey) {
        try {
            let tx = await createAssociatedTokenAccountUnsigned(
                this.connection,
                mintKey,
                null,
                this.wallet.publicKey,
                this.providerWallet,
            );

            const sg = await this.connection.sendTransaction(tx, [this.wallet]);
            await this.connection.confirmTransaction(sg);
        } catch (e) {
            console.log("Error is: ");
            console.log(e);
        }

        const userAccount = await getAssociatedTokenAddressOffCurve(mintKey, this.qPoolAccount);
        return userAccount;
    }

    async prepareSaberPool(pool_address: PublicKey) {
        const fetchedStableSwapPool = await this.getPoolState(pool_address);
        const {state} = fetchedStableSwapPool

        // TODO: Load these if these don't exist yet
        this.mintA = new Token(this.connection, state.tokenA.mint, TOKEN_PROGRAM_ID, this.wallet);
        this.mintB = new Token(this.connection, state.tokenB.mint, TOKEN_PROGRAM_ID, this.wallet);
        this.poolMint = new Token(this.connection, state.poolTokenMint, TOKEN_PROGRAM_ID, this.wallet);

        this.userAccountA = await this.getAccountForMint(state.tokenA.mint);
        this.userAccountB = await this.getAccountForMint(state.tokenB.mint);
        this.userAccountPoolToken = await this.getAccountForMint(state.poolTokenMint);

        this.fetchedStableSwapPool = fetchedStableSwapPool;
        this.stableSwapState = state;
    }

}
