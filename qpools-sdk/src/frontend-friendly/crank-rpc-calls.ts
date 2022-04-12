import {Connection, Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, Provider} from "@project-serum/anchor";
import {delay, IWallet, QWallet, sendAndSignInstruction, sendAndSignTransaction} from "../utils";
import {Marinade, MarinadeConfig, MarinadeState} from "@marinade.finance/marinade-ts-sdk";
import {Registry} from "./registry";
import {getSolbondProgram} from "../index";
import {getPortfolioPda, getPositionPda} from "../types/account/pdas";
import {sendLamports} from "../instructions/modify/portfolio-transfer";
import {PortfolioAccount, PositionAccountMarinade, PositionAccountSaber, PositionAccountSolend} from "../types/account";
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
        } else {
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

        this.initializeState();

        const marinadeConfig = new MarinadeConfig({
            connection: connection,
            publicKey: provider.wallet.publicKey,

        });
        let marinade = new Marinade(marinadeConfig);
        getPortfolioPda(this.owner.publicKey, this.solbondProgram).then(([portfolioPda, portfolioBump]) => {
            this.portfolioPDA = portfolioPda;
            this.portfolioBump =  portfolioBump;
        });
        MarinadeState.fetch(marinade).then((marinadeState: MarinadeState) => {
            this.marinadeState = marinadeState;
        });

        delay(1000);
    }

    async initializeState() {
        [this.portfolioPDA, this.portfolioBump] = await getPortfolioPda(this.owner.publicKey, this.solbondProgram);
        const marinadeConfig = new MarinadeConfig({
            connection: this.connection,
            publicKey: this.provider.wallet.publicKey,

        });
        let marinade = new Marinade(marinadeConfig);
        this.marinadeState = await MarinadeState.fetch(marinade);
    }

    /**
     * Transfers
     */
    async transfer_to_user(currencyMint: PublicKey) {
        // Creating the user-account if it doesn't yet exist
        let tx = await instructions.modify.portfolioTransfer.transfer_to_user(
            this.connection,
            this.crankSolbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            currencyMint
        );
        return await sendAndSignTransaction(this.crankProvider, tx);
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

    async redeemAllPositions(portfolio: PortfolioAccount, positionsSaber: PositionAccountSaber[], positionsMarinade: PositionAccountMarinade[], positionsSolend: PositionAccountSolend[]): Promise<void> {
        console.log("#redeemAllPositions()");
        let inputCurrencyMints = new Set<string>();
        console.log("Running saber items: ", positionsSaber);
        await Promise.all(positionsSaber.map(async (x: PositionAccountSaber) => {
            console.log("Closing following position account: ", x);

            let poolAddress = await this.registry.saberPoolLpToken2poolAddress(x.poolAddress);
            const stableSwapState = await instructions.fetch.saber.getPoolState(this.connection, poolAddress);
            console.log("getting state");
            const {state} = stableSwapState;

            // TODO: Add the input currency to the positions!
            inputCurrencyMints.add(state.tokenA.mint.toString());
            inputCurrencyMints.add(state.tokenB.mint.toString());

            let sgRedeemSinglePositionOnlyOne = await this.redeem_single_position_only_one(x.index);
            console.log("Signature to run the crank to get back USDC is: ", sgRedeemSinglePositionOnlyOne);
        }));
        // TODO: Also redeem solend!
        await Promise.all(positionsSolend.map(async (x: PositionAccountSolend) => {
            // Also get the symbol through the currency mint ...
            // let token = await this.registry.getTokenIndexedBySymbol(x.currencyMint);
            // Assuming that the token is exclusively used for solend ...
            inputCurrencyMints.add(x.currencyMint.toString());
            // TODO: Perhaps add a registry item to go from Solend Currency to Solend Symbol (?)
            let sgRedeemSolendPositions = await this.redeemPositionSolend(x.index);
            console.log("Signature to run the crank to get back USDC is: ", sgRedeemSolendPositions);
        }));

        console.log("Now sendin back the currencies as well...");
        // Now also redeem the individual currencies ..
        await Promise.all(Array.from(inputCurrencyMints.values()).map(async (x: string) => {
            let currencyMint = new PublicKey(x);
            let sgTransferMSolToUser = await this.transfer_to_user(currencyMint);
            console.log("Signature to send back mSOL", sgTransferMSolToUser);
            return;
        }));

        // We don't redeem marinade actively ...
        console.log("Approving Marinade Withdraw");
        console.log("##redeemAllPositions()");
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
        console.log("Current position is: ", currentPosition);

        // if (currentPosition.isRedeemed && !currentPosition.isFulfilled) {
        //     console.log("Crank Orders were already redeemed!");
        //     throw Error("Something major is off!");
        //     return;
        // }
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


    async createPositionSolend(index: number, solendAction: SolendAction) {
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

    async redeemPositionSolend(index: number) {

        let ix = await instructions.modify.solend.redeemSinglePositionSolend(
            this.connection,
            this.solbondProgram,
            this.owner.publicKey,
            this.crankProvider.wallet.publicKey,
            index,
            this.registry
        );
        return await sendAndSignInstruction(this.crankProvider, ix);

    }

}
