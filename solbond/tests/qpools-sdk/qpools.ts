import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {BN, Program, Provider} from "@project-serum/anchor";
import {Amm, IDL} from "../../deps/invariant/sdk/src/idl/amm";
import * as anchor from "@project-serum/anchor";
import {IWallet, Market, Network, Pair} from "@invariant-labs/sdk";
import {CreatePool, Decimal, FeeTier} from "@invariant-labs/sdk/lib/market";
import * as net from "net";
import {Token} from "@solana/spl-token";
import {createToken} from "../invariant-utils";
import {fromFee} from "@invariant-labs/sdk/lib/utils";
import {createMint} from "../utils";
import {Key} from "readline";

export interface Tickmap {
    bitmap: Array<number>
}

export class QPools {

    public connection: Connection;
    public wallet: IWallet;
    public solbondProgram: Program;
    public invariantProgram: Program<Amm>;

    // Create Mock Pools

    constructor(
        wallet: IWallet,
        connection: Connection
    ) {
        this.connection = connection;
        this.wallet = wallet;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = anchor.workspace.Amm;
    }

    async createMockPools() {
        // { pair, signer, initTick }: CreatePool

    }

}

export class QPoolsAdmin {

    public connection: Connection;
    public solbondProgram: Program;
    public invariantProgram: Program<Amm>;
    public provider: Provider;
    public wallet: Keypair;

    // All tokens owned by the protocol
    public qPoolsTokenMint: Token;
    public qPoolAccount: PublicKey | null = null;
    public bumpQPoolAccount: number | null = null;
    public currencyTokenMint: Token | null = null;

    constructor(
        wallet: IWallet,
        connection: Connection
    ) {
        this.connection = connection;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = anchor.workspace.Amm;
        this.provider = Provider.local();

        // @ts-expect-error
        this.wallet = provider.wallet.payer as Keypair
    }

    /**
     *
     * @param currencyMint: Will be provided, is the currency that will be used
     */
    async prepareQPool(currencyMint: Token, payer: Keypair) {

        this.currencyTokenMint = currencyMint;

        // Generate qPoolAccount
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            this.solbondProgram.programId
        );

        // Generate Redeemable Mint
        this.qPoolsTokenMint = await createMint(
            this.provider,
            payer,
            this.qPoolAccount,
            9
        );

    }


}

export class MockQPools extends QPoolsAdmin {

    public mockMarket: Market;
    public pairs: Pair[];
    public tokens: Token[];
    // We have a single fee tier across all pools, for simplicity
    public feeTier: FeeTier;
    public protocolFee: Decimal;

    // TODO: Number pools should be part of the constructor!
    async createTokens(number_pools: number, mintAuthority: Keypair) {
        this.tokens = await Promise.all(Array.from({length: 2 * number_pools}).map((_) => {
            return createToken(this.connection, this.wallet, mintAuthority)
        }));

    }

    async createPairs(number_pools: number) {
        // Call this after all tokens were created!
        if (!this.tokens) {
            throw Error("Tokens Mints were not generated yet");
        }
        if (!this.feeTier) {
            throw Error("Tokens Mints were not generated yet");
        }

        let i = 0;
        this.pairs = Array.from({length: number_pools}).map((_) => {
            let pair = new Pair(
                this.tokens[2*i].publicKey,
                this.tokens[(2*i)+1].publicKey,
                this.feeTier
            );
            i++;
            return pair;
        });
    }

    async createFeeTier() {
        this.feeTier = {
            fee: fromFee(new BN(600)),
            tickSpacing: 10
        }
    }

    async creatMarkets(
        network: Network,
        wallet: IWallet,
        connection: Connection,
        programId?: PublicKey
    ) {
        this.mockMarket = new Market(network, wallet, connection, programId);
    }



}
