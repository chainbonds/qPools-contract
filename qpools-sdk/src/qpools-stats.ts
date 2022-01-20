import {ConfirmOptions, Connection, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {BN, Program, Provider} from "@project-serum/anchor";
import {NETWORK} from "./cluster";
import {getSolbondProgram} from "./solbond-program";
import {Wallet} from "@project-serum/anchor/dist/cjs/provider";
import {BondPoolAccount} from "./types/bondPoolAccount";
import airdropAdmin from "./airdropAdmin";
import {SimpleWallet} from "easy-spl";
import NodeWallet from "@project-serum/anchor/dist/esm/nodewallet";
import InternalWallet from "easy-spl/dist/wallet/internal";

export class QPoolsStats {

    // Needed to read data from blockchain ...
    public provider: Provider;
    public connection: Connection;
    public solbondProgram: Program;

    public qPoolAccount: PublicKey;
    public bumpQPoolAccount: number;

    public QPTokenMint: Token;
    public currencyMint: Token;

    public qPoolQPTAccount: PublicKey;
    public qPoolCurrencyAccount: PublicKey;

    constructor(
        connection: Connection,
        currencyMint: Token
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

        this.currencyMint = currencyMint;
        // Now get the associated token addresses for all the other accounts
        // TODO: Refactor this!
        PublicKey.findProgramAddress(
            [this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))],
            this.solbondProgram.programId
        ).then(([_qPoolAccount, _bumpQPoolAccount]) => {
            this.qPoolAccount = _qPoolAccount;
            this.bumpQPoolAccount = _bumpQPoolAccount;

            // Fetch the bondPoolAccount
            let bondPoolAccount;
            console.log("BondPoolAccount is: ");
            console.log("this qpoolacount is: ", this.qPoolAccount.toString());
            (this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount)).then((x) => {
                console.log("1");
                bondPoolAccount = x as BondPoolAccount;

                console.log("2");
                // Now assign all variables to this
                if (!bondPoolAccount.bondPoolCurrencyTokenMint.equals(this.currencyMint.publicKey)) {
                    console.log(bondPoolAccount.bondPoolCurrencyTokenMint.toString());
                    console.log(this.currencyMint.publicKey.toString());
                    throw Error("mint is not the same!: " + this.currencyMint.publicKey.toString());
                }

                console.log("3");
                // Again, signers should never be needed!
                this.currencyMint = new Token(
                    this.connection,
                    bondPoolAccount.bondPoolCurrencyTokenMint,
                    this.solbondProgram.programId,
                    airdropAdmin
                );
                console.log("4");
                this.QPTokenMint = new Token(
                    this.connection,
                    bondPoolAccount.bondPoolRedeemableMint,
                    this.solbondProgram.programId,
                    airdropAdmin
                );
                console.log("5");
                this.qPoolQPTAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
                console.log("6");
                this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;
                console.log("7", this.qPoolCurrencyAccount.toString());
            });

        });
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
    // parseTokenAccountData(data: Buffer) {
    //     const amountData = data.slice(64, 74)
    //     const amount = amountData.readUInt32LE(0) + amountData.readUInt32LE(4) * 2 ** 32
    //     return {
    //         token: new PublicKey(data.slice(0, 32)),
    //         owner: new PublicKey(data.slice(32, 64)),
    //         amount: new BN(amount)
    //     }
    // }


    async calculateTVL(): Promise<{tvl: number, totalQPT: number}> {

        console.log("Calculate TVL");
        // Iterate over each mint
        // Get associated token account

        // Iterate over each pool
        // Get

        let _response;

        // (1) Get the reserve currency's mint +
        console.log("Gotta check this in devnet...");
        console.log("currencyMint", this.currencyMint.publicKey.toString());
        console.log("qPoolCurrencyAccount", this.qPoolCurrencyAccount.toString())

        _response = await this.connection.getTokenAccountBalance(this.qPoolCurrencyAccount);  // (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        let tvl = Number(_response.value.amount) / (10**9);  // Shouldn't hardcode decimals...

        // _response = await this.connection.getTokenSupply();
        _response = await this.connection.getTokenSupply(this.QPTokenMint.publicKey);
        let totalQPT = Number(_response.value.amount) / (10**9);
        console.log("Second response is: ", _response);


        // Fetch all token accounts owned by owner
        // _response = await this.connection.getTokenAccountsByOwner(
        //     this.qPoolAccount,
        //     {this.currencyMint.publicKey}
        // );

        // let reserveSol = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        console.log("Reserve SOL is: ", tvl);

        // return reserveSol.toNumber();
        return {tvl, totalQPT};

    }

}