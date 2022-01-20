import {ConfirmOptions, Connection, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {BN, Program, Provider, utils} from "@project-serum/anchor";
import {NETWORK} from "./cluster";
import {getSolbondProgram} from "./solbond-program";
import {Wallet} from "@project-serum/anchor/dist/cjs/provider";
import {BondPoolAccount} from "./types/bondPoolAccount";
import airdropAdmin from "./airdropAdmin";
import {SimpleWallet} from "easy-spl";
import NodeWallet from "@project-serum/anchor/dist/esm/nodewallet";
import InternalWallet from "easy-spl/dist/wallet/internal";
import {MOCK} from "./const";
import {getPythProgramKeyForCluster, PythConnection} from "@pythnetwork/client";
import {delay, getAssociatedTokenAddressOffCurve} from "./utils";
import {getAssociatedTokenAddress} from "easy-spl/dist/tx/associated-token-account";

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

    // Calculate TVL, and other statistics
    public priceFeed: any;

    // Logic to collect price feed
    async collectPriceFeed() {
        const pythConnection = new PythConnection(this.connection, getPythProgramKeyForCluster("devnet"))
        pythConnection.onPriceChange((product, price) => {
            // sample output:
            // SRM/USD: $8.68725 ±$0.0131
            if (product.symbol.includes("Crypto.MSOL/USD")) {
                console.log("Price change MSOL/USD");
                if (price.price) {
                    this.priceFeed["Crypto.MSOL/USD"] = price.price!;
                    console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`)
                }
            } else if (product.symbol.includes("Crypto.SOL/USD")) {
                console.log("Price change SOL/USD");
                if (price.price) {
                    this.priceFeed["Crypto.SOL/USD"] = price.price!;
                    console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`)
                }
            } else {
                // console.log("Price not changed");
                // console.log(`${product.symbol}: $${price.price} \xB1$${price.confidence}`)
            }
        })
        pythConnection.start();
        await delay(5000);
        await pythConnection.stop();
    }

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

        this.priceFeed = {
            "Crypto.MSOL/USD": 0.,
            "Crypto.SOL/USD": 0.,
        };

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
        this.collectPriceFeed();
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

    async getInvariantPositionListAddress() {
        // TODO: Replace the address by the mainnet address, for example
        const POSITION_LIST_SEED = 'positionlistv1';
        const [positionListAddress, positionListBump] = await PublicKey.findProgramAddress(
            [Buffer.from(utils.bytes.utf8.encode(POSITION_LIST_SEED)), this.qPoolAccount.toBuffer()],
            new PublicKey("5W8cgQkGhjniKuVikNyVq6Nh5mWVzHawRnXkWhL7risj")
        )

        return {
            positionListAddress,
            positionListBump
        }
    }

    async getAllTokensLockedInInvariant() {
        let {positionListAddress, positionListBump} = await this.getInvariantPositionListAddress();

        let positionListContents = await this.connection.getAccountInfo(positionListAddress);


    }

    async calculateTVL(): Promise<{tvl: number, totalQPT: number}> {

        console.log("Calculate TVL");
        // Iterate over each mint
        // Get associated token account

        // Iterate over each pool
        // Get
        // From each currency, get the balance
        let _response;
        let tvl = 0.;

        // (1) Get the reserve currency's mint +

        // This is the amount of currencyMint, we should multiple this by the currency's/USD price
        // _response = await this.connection.getTokenAccountBalance(this.qPoolCurrencyAccount);  // (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        // tvl += price_SOL_USDC * (Number(_response.value.amount) / (10**9));  // Shouldn't hardcode decimals...


        /** (1) Iterate over all of the token-accounts owned by qPoolAccount */

        /** (2) Iterate over all the invariant positions */

        // Now also calculate for all the other assets
        let associatedTokenAccount: PublicKey;
        // associatedTokenAccount = await getAssociatedTokenAddressOffCurve(MOCK.DEV.MSOL, this.qPoolAccount);
        // _response = await this.connection.getTokenAccountBalance(associatedTokenAccount);  // (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        // tvl += price_MSOL_USDC * (Number(_response.value.amount) / (10**9));  // Shouldn't hardcode decimals...
        associatedTokenAccount = await getAssociatedTokenAddressOffCurve(MOCK.DEV.SOL, this.qPoolAccount);

        _response = await this.connection.getTokenAccountBalance(associatedTokenAccount);  // (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        console.log("First response is: ", _response);
        tvl += this.priceFeed["Crypto.SOL/USD"] * (Number(_response.value.amount) / (10**(_response.value.decimals)));  // Shouldn't hardcode decimals...
        // associatedTokenAccount = await getAssociatedTokenAddressOffCurve(MOCK.DEV.USDT, this.qPoolAccount);
        // _response = await this.connection.getTokenAccountBalance(associatedTokenAccount);  // (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        // tvl += (Number(_response.value.amount) / (10**9));  // Shouldn't hardcode decimals...
        // associatedTokenAccount = await getAssociatedTokenAddressOffCurve(MOCK.DEV.USDC, this.qPoolAccount);
        // _response = await this.connection.getTokenAccountBalance(associatedTokenAccount);  // (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
        // tvl += (Number(_response.value.amount) / (10**9));  // Shouldn't hardcode decimals...

        // For invariant, iterate through all positionList items (generate seeds until it doesn't find addresses anymore)
        // And get the respective token balance

        // TODO: Get all tokens locked in invariant-accounts ...


        // _response = await this.connection.getTokenSupply();
        _response = await this.connection.getTokenSupply(this.QPTokenMint.publicKey);
        let totalQPT = Number(_response.value.amount) / (10**(_response.value.decimals));
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