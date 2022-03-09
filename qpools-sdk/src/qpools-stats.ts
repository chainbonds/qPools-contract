import {Connection, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {BN, Program, Provider, utils} from "@project-serum/anchor";
import {getSolbondProgram} from "./solbond-program";
import {BondPoolAccount} from "./types/bondPoolAccount";
import airdropAdmin from "./airdropAdmin";
import {SimpleWallet} from "easy-spl";
import {MOCK} from "./const";
import {getPythProgramKeyForCluster, PythConnection} from "@pythnetwork/client";
import {delay, getAssociatedTokenAddressOffCurve} from "./utils";
import {TvlInUsdc} from "./types/tvlAccount";
import {SEED} from "./seeds";

export enum Network {
    LOCAL,
    DEV
}


export class QPoolsStats {

    // Needed to read data from blockchain ...
    public provider: Provider;
    public connection: Connection;
    public solbondProgram: Program;

    public tvlAccount: PublicKey;
    public bumpTvlAccount: number;

    public qPoolAccount: PublicKey;
    public bumpQPoolAccount: number;

    public QPTokenMint: Token;
    public currencyMint: Token;

    public qPoolQPTAccount: PublicKey;
    public qPoolCurrencyAccount: PublicKey;

    // Calculate TVL, and other statistics
    public priceFeed: any;

    // Logic to collect price feed
    async collectPriceFeed() {
        // const pythConnection = new PythConnection(this.connection, getPythProgramKeyForCluster("devnet"))
        // pythConnection.onPriceChange((product, price) => {
        //     // sample output:
        //     // SRM/USD: $8.68725 ±$0.0131
        //     if (product.symbol.includes("Crypto.MSOL/USD")) {
        //         console.log("Price change MSOL/USD");
        //         if (price.price) {
        //             this.priceFeed["Crypto.MSOL/USD"] = new BN(price.price!);
        //             console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`)
        //         }
        //     } else if (product.symbol.includes("Crypto.SOL/USD")) {
        //         console.log("Price change SOL/USD");
        //         if (price.price) {
        //             this.priceFeed["Crypto.SOL/USD"] = new BN(price.price!);
        //             console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`)
        //         }
        //     } else {
        //         // console.log("Price not changed");
        //         // console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`)
        //     }
        // })
        // pythConnection.start();
        // await delay(5000);
        // await pythConnection.stop();
    }

    constructor(
        connection: Connection,
        currencyMint: Token,
        collectPriceFeed: boolean = true
    ) {
        this.connection = connection;

        // Create an empty wallet from the airdrop keypair?
        const wallet = new SimpleWallet(airdropAdmin);

        // Create a dumb provider, let's hope the wallet is not needed for read-only ...
        this.provider = new Provider(
            this.connection,
            wallet,
            {skipPreflight: true}
        );
        this.solbondProgram = getSolbondProgram(this.connection, this.provider);

        this.priceFeed = {
            "Crypto.MSOL/USD": new BN(0.),
            "Crypto.SOL/USD": new BN(0.),
        };

        this.currencyMint = currencyMint;
        // Now get the associated token addresses for all the other accounts
        // TODO: Refactor this!
        // PublicKey.findProgramAddress(
        //     [this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.BOND_POOL_ACCOUNT))],
        //     this.solbondProgram.programId
        // ).then(([_qPoolAccount, _bumpQPoolAccount]) => {
        //
        //     PublicKey.findProgramAddress([_qPoolAccount.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.TVL_INFO_ACCOUNT))],
        //         this.solbondProgram.programId
        //     ).then(([tvlAccount, bumpTvlAccount]) => {
        //         this.tvlAccount = tvlAccount;
        //         this.bumpTvlAccount = bumpTvlAccount;
        //     });
        //
        //     this.qPoolAccount = _qPoolAccount;
        //     this.bumpQPoolAccount = _bumpQPoolAccount;
        //
        //     // Fetch the bondPoolAccount
        //     let bondPoolAccount;
        //     console.log("BondPoolAccount is: ");
        //     console.log("this qpoolacount is: ", this.qPoolAccount.toString());
        //     (this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount)).then((x) => {
        //         console.log("1");
        //         bondPoolAccount = x as BondPoolAccount;
        //
        //         console.log("2");
        //         // Now assign all variables to this
        //         if (!bondPoolAccount.bondPoolCurrencyTokenMint.equals(this.currencyMint.publicKey)) {
        //             console.log(bondPoolAccount.bondPoolCurrencyTokenMint.toString());
        //             console.log(this.currencyMint.publicKey.toString());
        //             throw Error("mint is not the same!: " + this.currencyMint.publicKey.toString());
        //         }
        //
        //         console.log("3");
        //         // Again, signers should never be needed!
        //         this.currencyMint = new Token(
        //             this.connection,
        //             bondPoolAccount.bondPoolCurrencyTokenMint,
        //             this.solbondProgram.programId,
        //             airdropAdmin
        //         );
        //         console.log("4");
        //         this.QPTokenMint = new Token(
        //             this.connection,
        //             bondPoolAccount.bondPoolRedeemableMint,
        //             this.solbondProgram.programId,
        //             airdropAdmin
        //         );
        //         console.log("5");
        //         this.qPoolQPTAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
        //         console.log("6");
        //         this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;
        //         console.log("7", this.qPoolCurrencyAccount.toString());
        //     });
        //
        // });
        if (collectPriceFeed) {
            this.collectPriceFeed();
        }
    }

    /**
     *
     * For every pair, calculate the TVL
     * Then sum up all TVLs
     *
     * (1) For each token account of the qPool
     * (2) For each exchange
     * (2.1) For each liquidity position
     * (2.2) For each token in the liquidity position
     *
     * Add up all values with common token addresses
     * Get PYTH price w.r.t. USDC for this token address
     *
     * Right now, let's do only (1), and assume that the currency token is the only token in the pool ...
     */

}