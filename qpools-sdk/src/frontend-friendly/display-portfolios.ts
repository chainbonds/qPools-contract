import {Program, Provider} from "@project-serum/anchor";
import {Connection, PublicKey} from "@solana/web3.js";
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


    /**
     * Given the portfolio pubkey, return all the PDAs that this portfolio has deposited something in
     * @param portfolio
     */
    async getAllPortfolioPDAs(portfolio: PublicKey) {
    }

}