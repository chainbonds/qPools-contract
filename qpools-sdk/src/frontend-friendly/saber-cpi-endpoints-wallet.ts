import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Program, Provider} from "@project-serum/anchor";
import {Token} from "@solana/spl-token";
import {StableSwap, StableSwapState} from "@saberhq/stableswap-sdk";
import {createAssociatedTokenAccountUnsigned, getAssociatedTokenAddressOffCurve, IWallet} from "../utils";
import {sendAndConfirm} from "easy-spl/dist/util";

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
    }

    /**
     * Takes in the saber stable-swap state to get the state.
     * Perhaps should allow also to input the LP token, and then automatically fetch from there, if it's a token-type
     * @param poolAddress
     */
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

}
