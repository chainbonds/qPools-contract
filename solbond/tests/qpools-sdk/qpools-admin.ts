import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import {Amm, IDL} from "@invariant-labs/sdk/src/idl/amm";
import * as anchor from "@project-serum/anchor";
import {
    calculate_price_sqrt,
    DENOMINATOR,
    IWallet,
    Market,
    MAX_TICK,
    MIN_TICK,
    Network,
    Pair,
    SEED,
    TICK_LIMIT
} from "@invariant-labs/sdk";
import {CreatePool, Decimal, FeeTier, Tick,} from "@invariant-labs/sdk/lib/market";
import * as net from "net";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {createStandardFeeTiers, createToken} from "../invariant-utils";
import {FEE_TIERS, fromFee} from "@invariant-labs/sdk/lib/utils";
import {createMint, createTokenAccount} from "../utils";
import {Key} from "readline";

import {assert} from "chai";
import {PoolStructure, Position, PositionList} from "@invariant-labs/sdk/lib/market";

export class QPoolsAdmin {

    public connection: Connection;
    public solbondProgram: Program;
    public invariantProgram: Program<Amm>;
    public provider: Provider;
    public wallet: Keypair;

    // All tokens not owned by the protocol
    public currencyMint: Token | null = null;  // We will only have a single currency across one qPool

    // All tokens owned by the protocol
    public qPoolAccount: PublicKey | null = null;  // qPool Account
    public bumpQPoolAccount: number | null = null;

    public QPTokenMint: Token;  // qPool `redeemable` tokens
    public qPoolQPAccount: PublicKey;
    public qPoolCurrencyAccount: PublicKey;

    constructor(
        wallet: IWallet,
        connection: Connection,
        provider: Provider
    ) {
        this.connection = connection;

        this.solbondProgram = anchor.workspace.Solbond;
        this.invariantProgram = anchor.workspace.Amm;
        this.provider = provider;

        // @ts-expect-error
        this.wallet = provider.wallet.payer as Keypair
    }

    /**
     *
     * @param currencyMint: Will be provided, is the currency that will be used
     */
    async get(pair: Pair) {
        const address = await pair.getAddress(this.invariantProgram.programId)
        return (await this.invariantProgram.account.pool.fetch(address)) as PoolStructure
    }

    async initializeQPTReserve(currencyMint: Token, initializer: Keypair) {

        this.currencyMint = currencyMint;

        // Generate qPoolAccount
        [this.qPoolAccount, this.bumpQPoolAccount] = await PublicKey.findProgramAddress(
            [initializer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount"))],
            this.solbondProgram.programId
        );

        // Generate Redeemable Mint
        this.QPTokenMint = await createMint(
            this.provider,
            initializer,
            this.qPoolAccount,
            9
        );


        this.qPoolQPAccount = await this.QPTokenMint!.createAccount(this.qPoolAccount);
        this.qPoolCurrencyAccount = await this.currencyMint.createAccount(this.qPoolAccount);

        /*
            Now make the RPC call, to initialize a qPool
         */
        const initializeTx = await this.solbondProgram.rpc.initializeBondPool(
            this.bumpQPoolAccount,
            {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: currencyMint.publicKey,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    initializer: initializer.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                },
                signers: [initializer]
            }
        );
        await this.provider.connection.confirmTransaction(initializeTx);

    }


}
