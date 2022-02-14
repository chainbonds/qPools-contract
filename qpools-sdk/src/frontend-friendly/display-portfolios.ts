import {Program, Provider} from "@project-serum/anchor";
import {Connection, PublicKey} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../seeds";
import {WalletI} from "easy-spl";


export class DisplayPortfolios {

    public connection: Connection;
    public provider: Provider;
    public solbondProgram: Program;

    public owner: WalletI;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program
    ) {
        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram;

        this.owner = this.provider.wallet;

    }

    // Get all accounts, print them, and return them
    /**
     * Get all the portfolio's that were created by the user
     */
    async getAllPortfolios() {

        let [portfolioPDA, bumpPortfolio] = await PublicKey.findProgramAddress(
            [this.owner.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode(SEED.PORTFOLIO_ACCOUNT))],
            this.solbondProgram.programId
        );

        // Now get accounts data of this PDA
        // this.solbondProgram.account
        // await this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount);

    }

    /**
     * Given the portfolio pubkey, return all the PDAs that this portfolio has deposited something in
     * @param portfolio
     */
    async getAllPortfolioPDAs(portfolio: PublicKey) {


    }

}